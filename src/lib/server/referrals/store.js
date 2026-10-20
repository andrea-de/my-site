// Job links (/r/<code>): one record per job application, kept for good (no TTL, unlike
// the visit analytics), with its visit log and counters alongside.
//
//   ref:<code>         the record (JSON)
//   ref:<code>:stats   hash of counters (visits, previews, events), bumped atomically so a
//                      visit can't clobber a PATCH to the record or the other way round
//   ref:<code>:visits  list of visits and events, newest first, capped at LOG_CAP
//   ref:index          sorted set of codes, scored by creation time
//   ref:<code>:resume:<i>  the attached resume PDF, base64 in chunks (see Resume below)
import { dev } from '$app/environment';
// @ts-ignore Node builtin types are not installed in this JS-only project.
import { randomInt } from 'node:crypto';
// @ts-ignore
import { Buffer } from 'node:buffer';
import { getRedisClient } from '../visit-store/client';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LENGTH = 3;
const LOG_CAP = 500;
const INDEX_KEY = 'ref:index';
const MEMORY_KEY = '__my_site_referrals__';

export const CODE_PATTERN = /^[a-z0-9]{3}$/;

/** Lowercased code, or '' if it can't be one. */
export const normalizeCode = (value) => {
	const code = String(value || '').trim().toLowerCase();
	return CODE_PATTERN.test(code) ? code : '';
};

const recordKey = (code) => `ref:${code}`;
const statsKey = (code) => `ref:${code}:stats`;
const logKey = (code) => `ref:${code}:visits`;

function randomCode() {
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
	return code;
}

// ---- Storage backends --------------------------------------------------------------
// Redis when configured; in dev without it, a process-wide map so the feature still runs.

function memory() {
	if (!globalThis[MEMORY_KEY]) {
		globalThis[MEMORY_KEY] = { records: new Map(), stats: new Map(), logs: new Map() };
	}
	return globalThis[MEMORY_KEY];
}

function backend() {
	const redis = getRedisClient();
	if (redis) return redis;
	if (!dev) throw new Error('Redis is not configured; job links need it in production.');
	return null;
}

const parse = (value) => {
	if (!value) return null;
	if (typeof value === 'object') return value;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

// Old records kept what Andrea had to do in `needs`; it is now `noteForAndrea`. Reads show it
// there at once (with `needs` still listed until then), and the next write of the record
// stores it there for good and drops `needs`.
function migrateNeeds(record, { drop = false } = {}) {
	if (!record?.needs) return record;
	const { needs, ...rest } = record;
	const migrated = { ...rest, noteForAndrea: rest.noteForAndrea || needs, noteForAndreaAt: rest.noteForAndreaAt || rest.updatedAt };
	return drop ? migrated : { ...migrated, needs };
}

function withStats(record, stats = {}) {
	record = migrateNeeds(record);
	const counts = {};
	for (const [key, value] of Object.entries(stats || {})) {
		if (key.startsWith('event:')) counts[key.slice(6)] = Number(value) || 0;
	}
	return {
		...record,
		visits: Number(stats?.visits) || 0,
		previews: Number(stats?.previews) || 0,
		firstVisitAt: stats?.firstVisitAt || null,
		lastVisitAt: stats?.lastVisitAt || null,
		events: counts
	};
}

// ---- Records -----------------------------------------------------------------------

/**
 * Stores a new record under a fresh random code, retrying on collision.
 * @param {Record<string, any>} fields validated fields (see validate.js)
 */
export async function createReferral(fields) {
	const redis = backend();
	for (let attempt = 0; attempt < 50; attempt++) {
		const code = randomCode();
		const now = new Date().toISOString();
		const record = { code, status: 'active', region: 'us', ...fields, createdAt: now, updatedAt: now };

		if (redis) {
			// NX makes the claim atomic: two creates can never land on the same code.
			const claimed = await redis.set(recordKey(code), JSON.stringify(record), { nx: true });
			if (!claimed) continue;
			await redis.zadd(INDEX_KEY, { score: Date.now(), member: code });
		} else {
			const store = memory();
			if (store.records.has(code)) continue;
			store.records.set(code, record);
		}
		return withStats(record);
	}
	throw new Error('No free job-link code found; the code space may be nearly full.');
}

/** The record with its counters, or null. */
export async function getReferral(code) {
	code = normalizeCode(code);
	if (!code) return null;
	const redis = backend();
	if (!redis) {
		const store = memory();
		const record = store.records.get(code);
		return record ? withStats(record, store.stats.get(code)) : null;
	}
	const [record, stats] = await Promise.all([redis.get(recordKey(code)), redis.hgetall(statsKey(code))]);
	const parsed = parse(record);
	return parsed ? withStats(parsed, stats) : null;
}

/** Every record, newest first. */
export async function listReferrals() {
	const redis = backend();
	if (!redis) {
		const store = memory();
		return [...store.records.values()]
			.map((r) => withStats(r, store.stats.get(r.code)))
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}
	const codes = /** @type {string[]} */ (await redis.zrange(INDEX_KEY, 0, -1, { rev: true }));
	if (codes.length === 0) return [];
	const pipeline = redis.pipeline();
	for (const code of codes) {
		pipeline.get(recordKey(code));
		pipeline.hgetall(statsKey(code));
	}
	const results = await pipeline.exec();
	const records = [];
	codes.forEach((code, i) => {
		const record = parse(results[i * 2]);
		if (record) records.push(withStats(record, /** @type {any} */ (results[i * 2 + 1])));
	});
	return records;
}

/** Merges validated fields into a record; null for an unknown code. */
export async function updateReferral(code, fields) {
	code = normalizeCode(code);
	const redis = backend();
	const current = redis ? parse(await redis.get(recordKey(code))) : memory().records.get(code);
	if (!current) return null;

	const now = new Date().toISOString();
	const next = { ...migrateNeeds(current, { drop: true }), ...fields, code, updatedAt: now };
	// When each note was last written, for "saved 2m ago" on the dashboard.
	for (const note of ['noteForAndrea', 'noteForClaude']) {
		if (note in fields) next[`${note}At`] = fields[note] ? now : null;
	}
	// A field set to null is cleared rather than stored as null.
	for (const [key, value] of Object.entries(next)) if (value === null) delete next[key];

	if (redis) await redis.set(recordKey(code), JSON.stringify(next));
	else memory().records.set(code, next);
	return getReferral(code);
}

// ---- Notes between Andrea and Claude -----------------------------------------------------
// Two boxes per job: `noteForAndrea` (what Claude, the agent on the applications, needs from
// Andrea) and `noteForClaude` (Andrea's instructions or answers). Once handled, a note settles
// into `history`, oldest first: [{ at, by: 'andrea' | 'claude', text }].
export const HISTORY_CAP = 100;
export const HISTORY_TEXT_MAX = 3000;
export const NOTE_AUTHORS = { noteForAndrea: 'claude', noteForClaude: 'andrea' };

const capHistory = (history) => history.slice(-HISTORY_CAP);

/**
 * Appends history entries; null for an unknown code.
 * @param {string} code
 * @param {{ by: 'andrea' | 'claude', text: string, at?: string }[]} entries
 */
export async function appendHistory(code, entries, extraFields = {}) {
	const current = await getReferral(code);
	if (!current) return null;
	const at = new Date().toISOString();
	const added = entries.map((e) => ({ at: e.at || at, by: e.by, text: e.text }));
	return updateReferral(code, { ...extraFields, history: capHistory([...(current.history || []), ...added]) });
}

/**
 * Moves notes into the history (each as its author's entry) and clears them, then adds
 * `text` as Claude's entry if given. `only` limits it to one note. Null for an unknown code.
 * @param {string} code
 * @param {{ only?: 'noteForAndrea' | 'noteForClaude', text?: string, by?: 'andrea' | 'claude' }} [options]
 */
export async function archiveNotes(code, { only, text, by = 'claude' } = {}) {
	const current = await getReferral(code);
	if (!current) return null;
	const notes = only ? [only] : ['noteForAndrea', 'noteForClaude'];
	const entries = [];
	const cleared = {};
	for (const note of notes) {
		if (current[note]) entries.push({ by: NOTE_AUTHORS[note], text: current[note] });
		cleared[note] = null;
	}
	if (text) entries.push({ by, text });
	return appendHistory(code, entries, cleared);
}

// ---- Resume ----------------------------------------------------------------------------
// One PDF per job, attached only when Andrea asks or a manual submission needs one. The bytes
// live base64-encoded in chunks (each well under Upstash's per-request and per-value limits),
// written one request each; the record keeps { filename, size, chunks, uploadedAt }.
export const RESUME_MAX_BYTES = 2 * 1024 * 1024;
const RESUME_CHUNK_CHARS = 512 * 1024;
const RESUME_MAX_CHUNKS = Math.ceil(Math.ceil((RESUME_MAX_BYTES * 4) / 3) / RESUME_CHUNK_CHARS) + 1;
const resumeKey = (code, i) => `ref:${code}:resume:${i}`;
const resumeKeys = (code) => Array.from({ length: RESUME_MAX_CHUNKS }, (_, i) => resumeKey(code, i));

/**
 * Stores (replacing any earlier) the job's resume; null for an unknown code.
 * @param {string} code
 * @param {Uint8Array} bytes
 * @param {string} filename
 */
export async function putResume(code, bytes, filename) {
	code = normalizeCode(code);
	if (!(await getReferral(code))) return null;
	const base64 = Buffer.from(bytes).toString('base64');
	const chunks = [];
	// Prefixed so the Redis client never mistakes a chunk for JSON (an all-digit tail, say).
	for (let i = 0; i < base64.length; i += RESUME_CHUNK_CHARS) chunks.push(`b:${base64.slice(i, i + RESUME_CHUNK_CHARS)}`);

	const redis = backend();
	if (redis) {
		await redis.del(...resumeKeys(code));
		for (let i = 0; i < chunks.length; i++) await redis.set(resumeKey(code, i), chunks[i]);
	} else {
		const store = memory();
		store.resumes ||= new Map();
		store.resumes.set(code, chunks);
	}
	const resume = { filename, size: bytes.length, chunks: chunks.length, uploadedAt: new Date().toISOString() };
	return updateReferral(code, { resume });
}

/** { filename, bytes } of the job's resume, or null. */
export async function getResume(code) {
	const record = await getReferral(code);
	if (!record?.resume) return null;
	const redis = backend();
	let chunks;
	if (redis) {
		const keys = Array.from({ length: record.resume.chunks }, (_, i) => resumeKey(record.code, i));
		chunks = keys.length ? await redis.mget(...keys) : [];
	} else chunks = memory().resumes?.get(record.code) || [];
	if (chunks.length !== record.resume.chunks || chunks.some((c) => typeof c !== 'string' || !c.startsWith('b:'))) return null;
	const base64 = chunks.map((c) => c.slice(2)).join('');
	return { filename: record.resume.filename, bytes: Buffer.from(base64, 'base64') };
}

/** Removes the job's resume; null for an unknown code. */
export async function deleteResume(code) {
	code = normalizeCode(code);
	if (!(await getReferral(code))) return null;
	const redis = backend();
	if (redis) await redis.del(...resumeKeys(code));
	else memory().resumes?.delete(code);
	return updateReferral(code, { resume: null });
}

// ---- Applied ---------------------------------------------------------------------------
// A link is made before anything is sent; these marks say what actually went out:
//   ats    applied through the posting's form    → appliedAt, appliedNote
//   email  the pitch email was sent              → emailSentAt, emailNote
export const APPLIED_CHANNELS = ['ats', 'email'];
const APPLIED_FIELDS = { ats: ['appliedAt', 'appliedNote'], email: ['emailSentAt', 'emailNote'] };

/**
 * Sets (or with null, clears) a channel's applied mark. False for an unknown code.
 * @param {string} code
 * @param {'ats' | 'email'} channel
 * @param {{ at: string, note?: string | null } | null} mark
 */
export async function setApplied(code, channel, mark) {
	const [timeField, noteField] = APPLIED_FIELDS[channel];
	const fields = { [timeField]: mark ? mark.at : null, [noteField]: mark?.note || null };
	// Sending moves an early stage to "sent"; taking the mark back undoes only that.
	const current = await getReferral(code);
	if (!current) return false;
	const other = channel === 'ats' ? current.emailSentAt : current.appliedAt;
	if (mark && ['not-started', 'drafted', undefined].includes(current.stage)) fields.stage = 'sent';
	if (!mark && !other && current.stage === 'sent') fields.stage = 'drafted';
	return Boolean(await updateReferral(code, fields));
}

/** Whether anything has actually been sent for this job. */
export const isApplied = (record) => Boolean(record?.appliedAt || record?.emailSentAt);

/** Where an application stands: its stage, or one inferred for records made before stages. */
export const stageOf = (record) => record?.stage || (isApplied(record) ? 'sent' : 'not-started');

/** Deletes a record, its counters and its log. */
export async function deleteReferral(code) {
	code = normalizeCode(code);
	const redis = backend();
	if (!redis) {
		const store = memory();
		const existed = store.records.delete(code);
		store.stats.delete(code);
		store.logs.delete(code);
		memory().resumes?.delete(code);
		return existed;
	}
	const [deleted] = await Promise.all([
		redis.del(recordKey(code), statsKey(code), logKey(code), ...resumeKeys(code)),
		redis.zrem(INDEX_KEY, code)
	]);
	return deleted > 0;
}

/** Clears a link's counters and log (visits, previews, events), keeping the link. */
export async function resetReferralActivity(code) {
	code = normalizeCode(code);
	const redis = backend();
	if (!redis) {
		const store = memory();
		store.stats.delete(code);
		store.logs.delete(code);
		return store.records.has(code);
	}
	if (!(await redis.exists(recordKey(code)))) return false;
	await redis.del(statsKey(code), logKey(code));
	return true;
}

// ---- Visits and events -------------------------------------------------------------

/** Newest first. */
export async function getReferralLog(code, limit = LOG_CAP) {
	code = normalizeCode(code);
	const redis = backend();
	if (!redis) return (memory().logs.get(code) || []).slice(0, limit);
	const entries = await redis.lrange(logKey(code), 0, limit - 1);
	return entries.map(parse).filter(Boolean);
}

/**
 * The newest entries of several logs in one round trip, for the admin dashboard.
 * @param {string[]} codes
 * @returns {Promise<Record<string, any[]>>} code → entries, newest first
 */
export async function getReferralLogs(codes, limit = LOG_CAP) {
	const valid = codes.map(normalizeCode).filter(Boolean);
	if (valid.length === 0) return {};
	const redis = backend();
	if (!redis) {
		const logs = memory().logs;
		return Object.fromEntries(valid.map((code) => [code, (logs.get(code) || []).slice(0, limit)]));
	}
	const pipeline = redis.pipeline();
	for (const code of valid) pipeline.lrange(logKey(code), 0, limit - 1);
	const results = await pipeline.exec();
	return Object.fromEntries(
		valid.map((code, i) => [code, (/** @type {any[]} */ (results[i]) || []).map(parse).filter(Boolean)])
	);
}

/**
 * Appends an entry to a code's log and bumps its counters.
 * kind 'visit' counts a visit (and returns its number), 'preview' a link unfurl,
 * anything else an event by name.
 * @returns {Promise<number>} the new value of the counter bumped
 */
export async function recordReferralEntry(code, entry) {
	code = normalizeCode(code);
	const at = entry.at || new Date().toISOString();
	const full = { ...entry, at };
	const field = entry.type === 'visit' ? 'visits' : entry.type === 'preview' ? 'previews' : `event:${entry.type}`;

	const redis = backend();
	if (!redis) {
		const store = memory();
		store.logs.set(code, [full, ...(store.logs.get(code) || [])].slice(0, LOG_CAP));
		const stats = store.stats.get(code) || {};
		stats[field] = (Number(stats[field]) || 0) + 1;
		if (entry.type === 'visit') {
			stats.firstVisitAt ||= at;
			stats.lastVisitAt = at;
		}
		store.stats.set(code, stats);
		return stats[field];
	}

	const pipeline = redis.pipeline();
	pipeline.lpush(logKey(code), JSON.stringify(full));
	pipeline.ltrim(logKey(code), 0, LOG_CAP - 1);
	pipeline.hincrby(statsKey(code), field, 1);
	if (entry.type === 'visit') {
		pipeline.hsetnx(statsKey(code), 'firstVisitAt', at);
		pipeline.hset(statsKey(code), { lastVisitAt: at });
	}
	const results = await pipeline.exec();
	return Number(results[2]) || 0;
}

/**
 * True the first time it's called for a key within `seconds`: a light limiter for the
 * public event endpoint and for repeat link-preview alerts.
 */
export async function firstWithin(key, seconds) {
	const redis = backend();
	if (!redis) {
		const store = memory();
		store.limits ||= new Map();
		const until = store.limits.get(key) || 0;
		if (until > Date.now()) return false;
		store.limits.set(key, Date.now() + seconds * 1000);
		return true;
	}
	return Boolean(await redis.set(`ref-limit:${key}`, '1', { nx: true, ex: seconds }));
}

/** Counts calls for a key within a window; for rate limiting. */
export async function countWithin(key, seconds) {
	const redis = backend();
	if (!redis) {
		const store = memory();
		store.counts ||= new Map();
		const now = Date.now();
		const current = store.counts.get(key);
		const next = current && current.until > now ? { ...current, n: current.n + 1 } : { n: 1, until: now + seconds * 1000 };
		store.counts.set(key, next);
		return next.n;
	}
	const fullKey = `ref-rate:${key}`;
	const n = await redis.incr(fullKey);
	if (n === 1) await redis.expire(fullKey, seconds);
	return n;
}
