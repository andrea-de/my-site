import { Redis } from '@upstash/redis';
import { dev } from '$app/environment';

let redisClient;

export function getRedisClient() {
	if (redisClient) return redisClient;

	const hasUpstashPair = Boolean(
		process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
	);
	const hasKvPair = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

	if (!hasUpstashPair && !hasKvPair) return null;

	redisClient = Redis.fromEnv({ enableTelemetry: false });
	return redisClient;
}

export function getVisitStorageMode() {
	if (getRedisClient()) return 'redis';
	return dev ? 'memory' : 'disabled';
}
