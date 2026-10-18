// Input checks for the job-links API. Errors are plain sentences, returned as 400s, so an
// agent calling the API can see exactly what to fix.
import { showcaseProjects } from '../../../components/showcase/projects';

const JOB_DESCRIPTION_MAX = 20000;
const FIT_POINTS_MAX = 5;
const FIT_POINT_MAX = 160;
const ROUTES_MAX = 6;
const ROUTE_WHERE_MAX = 300;

// How an application goes in. One job can have several routes; `used` marks the one taken.
//   agent-apply     a standard form the agent fills in and submits once Andrea approves
//   manual-apply    a form Andrea submits (login, bot check, questions only Andrea can answer)
//   email-apply     the posting says to apply by email
//   email-outreach  no posting: a direct email to a company or person
//   referral        someone introduces Andrea or passes the resume along
//   inbound         a recruiter or company contacted Andrea first
export const ROUTE_TAGS = ['agent-apply', 'manual-apply', 'email-apply', 'email-outreach', 'referral', 'inbound'];
// Where an application stands, in order.
export const STAGES = ['not-started', 'drafted', 'sent', 'replied', 'interviewing', 'offer', 'rejected', 'no-reply'];

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
	routes: { routes: true },
	stage: { values: STAGES },
	foundBy: { values: ['agent', 'andrea'] },
	needs: { max: 500 },
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

		if (rule.routes) {
			const routes = validateRoutes(value);
			if (typeof routes === 'string') errors.push(routes);
			else fields[key] = routes.length ? routes : null;
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

/** A clean routes list, or an error sentence. */
function validateRoutes(value) {
	if (!Array.isArray(value)) return '"routes" must be an array of { tag, where, used } objects.';
	if (value.length > ROUTES_MAX) return `"routes" takes at most ${ROUTES_MAX} routes.`;
	const routes = [];
	for (const route of value) {
		if (!route || typeof route !== 'object' || Array.isArray(route)) return 'Each route must be an object.';
		const unknown = Object.keys(route).filter((k) => !['tag', 'where', 'used'].includes(k));
		if (unknown.length) return `Unknown route field(s): ${unknown.join(', ')}. Allowed: tag, where, used.`;
		if (!ROUTE_TAGS.includes(route.tag)) return `Route "tag" must be one of: ${ROUTE_TAGS.join(', ')}.`;
		if (route.where != null && typeof route.where !== 'string') return 'Route "where" must be a string.';
		const where = (route.where || '').trim();
		if (where.length > ROUTE_WHERE_MAX) return `Route "where" is too long (max ${ROUTE_WHERE_MAX} characters).`;
		if (route.used != null && typeof route.used !== 'boolean') return 'Route "used" must be true or false.';
		routes.push({ tag: route.tag, ...(where ? { where } : {}), ...(route.used ? { used: true } : {}) });
	}
	return routes;
}
