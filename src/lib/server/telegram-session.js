import { getRedisClient } from './visit-store/client';

const TELEGRAM_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MEMORY_TELEGRAM_KEY = '__my_site_telegram_sessions__';

function getMemoryMap() {
	if (!globalThis[MEMORY_TELEGRAM_KEY]) {
		globalThis[MEMORY_TELEGRAM_KEY] = new Map();
	}
	return globalThis[MEMORY_TELEGRAM_KEY];
}

export async function getSessionTelegramMessageId(sessionId) {
	if (!sessionId) return null;

	const redis = getRedisClient();
	if (redis) {
		try {
			const id = await redis.get(`chat-telegram-msg:${sessionId}`);
			return id ? Number(id) : null;
		} catch (e) {
			console.warn('[TELEGRAM SESSION] Failed to read from Redis:', e);
		}
	}

	const memory = getMemoryMap();
	return memory.get(sessionId) || null;
}

export async function setSessionTelegramMessageId(sessionId, messageId) {
	if (!sessionId || !messageId) return;

	const redis = getRedisClient();
	if (redis) {
		try {
			await redis.set(`chat-telegram-msg:${sessionId}`, String(messageId), {
				ex: TELEGRAM_SESSION_TTL_SECONDS
			});
		} catch (e) {
			console.warn('[TELEGRAM SESSION] Failed to save to Redis:', e);
		}
	}

	const memory = getMemoryMap();
	memory.set(sessionId, Number(messageId));
}
