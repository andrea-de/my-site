// Input checks for the job-links API. Errors are plain sentences, returned as 400s, so an
// agent calling the API can see exactly what to fix.
import { showcaseProjects } from '../../../components/showcase/projects';

const JOB_DESCRIPTION_MAX = 20000;
const FIT_POINTS_MAX = 5;
const FIT_POINT_MAX = 160;

// The projects a link can lead with: the ones the site shows.
export const PROJECT_IDS = showcaseProjects().map((p) => p.id);

const FIELDS = {
	company: { max: 120 },
	role: { max: 160 },
	region: { values: ['us', 'eu'] },
	status: { values: ['active', 'closed'] },
	jobUrl: { max: 2000, url: true },
	jobDescription: { max: JOB_DESCRIPTION_MAX, truncate: true },
	notes: { max: 5000 },
	greeting: { max: 200 },
	fitPoints: { points: true },
	// No longer shown: every link shows every project. Still accepted so older callers work.
	projects: { list: true }
};

const REQUIRED = ['company', 'role'];

/**
 * @param {any} body the parsed JSON body
 * @param {{ partial?: boolean }} options partial: a PATCH (nothing required; null clears)
 * @returns {{ fields?: Record<string, any>, errors?: string[] }}
 */
export function validateReferralInput(body, { partial = false } = {}) {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return { errors: ['Body must be a JSON object.'] };
	}

	const errors = [];
	const fields = {};

	for (const key of Object.keys(body)) {
		if (!FIELDS[key]) errors.push(`Unknown field "${key}". Allowed: ${Object.keys(FIELDS).join(', ')}.`);
	}

	for (const [key, rule] of Object.entries(FIELDS)) {
		if (!(key in body) || body[key] === undefined) {
			if (!partial && REQUIRED.includes(key)) errors.push(`"${key}" is required.`);
			continue;
		}

		let value = body[key];
		if (value === null || value === '') {
			if (REQUIRED.includes(key) || rule.values) errors.push(`"${key}" can't be empty.`);
			else fields[key] = null;
			continue;
		}

		if (rule.points) {
			if (!Array.isArray(value) || value.some((point) => typeof point !== 'string')) {
				errors.push(`"${key}" must be an array of strings.`);
				continue;
			}
			const points = value.map((point) => point.trim()).filter(Boolean);
			if (points.length > FIT_POINTS_MAX) {
				errors.push(`"${key}" takes at most ${FIT_POINTS_MAX} points.`);
				continue;
			}
			if (points.some((point) => point.length > FIT_POINT_MAX)) {
				errors.push(`Each of "${key}" must be at most ${FIT_POINT_MAX} characters.`);
				continue;
			}
			fields[key] = points.length ? points : null;
			continue;
		}

		if (rule.list) {
			if (!Array.isArray(value) || value.some((id) => typeof id !== 'string')) {
				errors.push(`"${key}" must be an array of project ids.`);
				continue;
			}
			const ids = [...new Set(value.map((id) => id.trim()))];
			const unknown = ids.filter((id) => !PROJECT_IDS.includes(id));
			if (unknown.length) {
				errors.push(`Unknown project id(s): ${unknown.join(', ')}. Valid: ${PROJECT_IDS.join(', ')}.`);
				continue;
			}
			fields[key] = ids;
			continue;
		}

		if (typeof value !== 'string') {
			errors.push(`"${key}" must be a string.`);
			continue;
		}
		value = value.trim();

		if (rule.values && !rule.values.includes(value)) {
			errors.push(`"${key}" must be one of: ${rule.values.join(', ')}.`);
			continue;
		}
		if (rule.max && value.length > rule.max) {
			if (rule.truncate) value = value.slice(0, rule.max);
			else {
				errors.push(`"${key}" is too long (max ${rule.max} characters).`);
				continue;
			}
		}
		if (rule.url && !/^https?:\/\/[^\s]+$/i.test(value)) {
			errors.push(`"${key}" must be an http(s) URL.`);
			continue;
		}
		fields[key] = value;
	}

	if (partial && Object.keys(body).length === 0) errors.push('Nothing to update.');
	return errors.length ? { errors } : { fields };
}
