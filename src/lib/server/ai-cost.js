import { getRedisClient } from './visit-store/client';
import { getVisitDateKey } from './visit-store/shared';

// Gemini 2.5 Flash pricing (Standard, <= 128k context)
// Input: $0.075 per 1,000,000 tokens ($0.000000075 / token)
// Output: $0.30 per 1,000,000 tokens ($0.00000030 / token)
const INPUT_COST_PER_TOKEN = 0.075 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 0.30 / 1_000_000;

const AI_USAGE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MEMORY_AI_KEY = '__my_site_ai_usage__';

function getMemoryAiStore() {
	if (!globalThis[MEMORY_AI_KEY]) {
		globalThis[MEMORY_AI_KEY] = {
			sessions: new Map(),
			daily: new Map()
		};
	}
	return globalThis[MEMORY_AI_KEY];
}

export function calculateCost(promptTokens = 0, candidatesTokens = 0) {
	const cost = (promptTokens * INPUT_COST_PER_TOKEN) + (candidatesTokens * OUTPUT_COST_PER_TOKEN);
	return Math.round(cost * 1_000_000) / 1_000_000; // 6 decimals precision
}

export async function recordAiUsage({ sessionId, model = 'gemini-2.5-flash', promptTokens = 0, candidatesTokens = 0, type = 'chat' }) {
	const totalTokens = promptTokens + candidatesTokens;
	const estimatedCost = calculateCost(promptTokens, candidatesTokens);
	const dateKey = getVisitDateKey(Date.now());

	const redis = getRedisClient();
	if (redis) {
		try {
			const dailyKey = `ai-stats:${dateKey}`;
			const sessionKey = sessionId ? `chat-ai-usage:${sessionId}` : null;

			const ops = [
				redis.hincrby(dailyKey, 'total_tokens', totalTokens),
				redis.hincrby(dailyKey, 'prompt_tokens', promptTokens),
				redis.hincrby(dailyKey, 'candidates_tokens', candidatesTokens),
				redis.hincrbyfloat(dailyKey, 'total_cost_usd', estimatedCost),
				redis.hincrby(dailyKey, 'requests_count', 1),
				redis.expire(dailyKey, AI_USAGE_TTL_SECONDS)
			];

			if (sessionKey) {
				ops.push(
					redis.hincrby(sessionKey, 'total_tokens', totalTokens),
					redis.hincrby(sessionKey, 'prompt_tokens', promptTokens),
					redis.hincrby(sessionKey, 'candidates_tokens', candidatesTokens),
					redis.hincrbyfloat(sessionKey, 'total_cost_usd', estimatedCost),
					redis.hincrby(sessionKey, 'turns', 1),
					redis.expire(sessionKey, AI_USAGE_TTL_SECONDS)
				);
			}

			await Promise.all(ops);
		} catch (e) {
			console.warn('[AI COST] Failed to record usage to Redis:', e);
		}
	}

	const memory = getMemoryAiStore();
	// Update daily in-memory
	const existingDaily = memory.daily.get(dateKey) || {
		total_tokens: 0,
		prompt_tokens: 0,
		candidates_tokens: 0,
		total_cost_usd: 0,
		requests_count: 0
	};
	existingDaily.total_tokens += totalTokens;
	existingDaily.prompt_tokens += promptTokens;
	existingDaily.candidates_tokens += candidatesTokens;
	existingDaily.total_cost_usd += estimatedCost;
	existingDaily.requests_count += 1;
	memory.daily.set(dateKey, existingDaily);

	// Update session in-memory
	if (sessionId) {
		const existingSession = memory.sessions.get(sessionId) || {
			total_tokens: 0,
			prompt_tokens: 0,
			candidates_tokens: 0,
			total_cost_usd: 0,
			turns: 0
		};
		existingSession.total_tokens += totalTokens;
		existingSession.prompt_tokens += promptTokens;
		existingSession.candidates_tokens += candidatesTokens;
		existingSession.total_cost_usd += estimatedCost;
		existingSession.turns += 1;
		memory.sessions.set(sessionId, existingSession);
	}

	return {
		totalTokens,
		estimatedCost
	};
}

export async function getSessionAiUsage(sessionId) {
	if (!sessionId) return null;

	const redis = getRedisClient();
	if (redis) {
		try {
			const data = await redis.hgetall(`chat-ai-usage:${sessionId}`);
			if (data && Object.keys(data).length > 0) {
				return {
					totalTokens: Number(data.total_tokens || 0),
					promptTokens: Number(data.prompt_tokens || 0),
					candidatesTokens: Number(data.candidates_tokens || 0),
					totalCostUsd: Number(data.total_cost_usd || 0),
					turns: Number(data.turns || 0)
				};
			}
		} catch (e) {
			console.warn('[AI COST] Failed to read session usage from Redis:', e);
		}
	}

	const memory = getMemoryAiStore();
	const session = memory.sessions.get(sessionId);
	if (session) {
		return {
			totalTokens: session.total_tokens,
			promptTokens: session.prompt_tokens,
			candidatesTokens: session.candidates_tokens,
			totalCostUsd: session.total_cost_usd,
			turns: session.turns
		};
	}

	return null;
}

export async function getDailyAiStats(dateKey) {
	const redis = getRedisClient();
	if (redis) {
		try {
			const data = await redis.hgetall(`ai-stats:${dateKey}`);
			if (data && Object.keys(data).length > 0) {
				return {
					totalTokens: Number(data.total_tokens || 0),
					promptTokens: Number(data.prompt_tokens || 0),
					candidatesTokens: Number(data.candidates_tokens || 0),
					totalCostUsd: Number(data.total_cost_usd || 0),
					requestsCount: Number(data.requests_count || 0)
				};
			}
		} catch (e) {
			console.warn('[AI COST] Failed to read daily stats from Redis:', e);
		}
	}

	const memory = getMemoryAiStore();
	const daily = memory.daily.get(dateKey);
	if (daily) {
		return {
			totalTokens: daily.total_tokens,
			promptTokens: daily.prompt_tokens,
			candidatesTokens: daily.candidates_tokens,
			totalCostUsd: daily.total_cost_usd,
			requestsCount: daily.requests_count
		};
	}

	return {
		totalTokens: 0,
		promptTokens: 0,
		candidatesTokens: 0,
		totalCostUsd: 0,
		requestsCount: 0
	};
}
