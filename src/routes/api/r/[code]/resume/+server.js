// The resume attached to a job link: a PDF Claude uploads when Andrea asks or a manual
// submission needs one. PUT and DELETE take the bearer token; GET downloads it with the
// token or Andrea's admin session (the dashboard's "Download resume"). Never public.
// See README "Job links".
import { json } from '@sveltejs/kit';
import { hasAdminSession } from '$lib/server/admin';
import { isReferralsAuthorized, notFound, referralUrl } from '$lib/server/referrals/auth';
import {
	RESUME_MAX_BYTES,
	deleteResume,
	getReferral,
	getResume,
	normalizeCode,
	putResume
} from '$lib/server/referrals/store';

const missing = (code) => json({ error: `No job link "${code}".` }, { status: 404 });
const FILENAME_MAX = 150;

function strip(record) {
	const { jobDescription, ...rest } = record;
	return json({ ...rest, url: referralUrl(rest.code) });
}

/** A safe file name ending in .pdf, from ?filename= or else the company. */
function filenameFor(url, record) {
	const given = (url.searchParams.get('filename') || '').replace(/[\\/\r\n"\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
	const base = given || `${record.company ? `${record.company} - ` : ''}Andrea de Candia Resume`;
	const name = base.slice(0, FILENAME_MAX);
	return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

/** Upload: the raw PDF as the body, Content-Type application/pdf; ?filename= optional. */
export async function PUT({ request, params, url }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	const record = code ? await getReferral(code) : null;
	if (!record) return missing(params.code);

	if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/pdf'))
		return json({ error: 'Send the PDF itself as the body, with Content-Type: application/pdf.' }, { status: 415 });
	const declared = Number(request.headers.get('content-length') || 0);
	if (declared > RESUME_MAX_BYTES) return json({ error: `The resume is too big (max ${RESUME_MAX_BYTES / 1024 / 1024} MB).` }, { status: 413 });

	const bytes = new Uint8Array(await request.arrayBuffer());
	if (bytes.length > RESUME_MAX_BYTES) return json({ error: `The resume is too big (max ${RESUME_MAX_BYTES / 1024 / 1024} MB).` }, { status: 413 });
	const isPdf = bytes.length > 4 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
	if (!isPdf) return json({ error: 'The body is not a PDF (it should start with %PDF-).' }, { status: 400 });

	const updated = await putResume(code, bytes, filenameFor(url, record));
	if (!updated) return missing(params.code);
	return strip(updated);
}

export async function GET({ request, params, cookies }) {
	if (!isReferralsAuthorized(request) && !hasAdminSession(cookies)) return notFound();
	const code = normalizeCode(params.code);
	const resume = code ? await getResume(code) : null;
	if (!resume) return json({ error: `No resume attached to "${params.code}".` }, { status: 404 });

	const ascii = resume.filename.replace(/[^\x20-\x7e]/g, '_');
	return new Response(resume.bytes, {
		headers: {
			'content-type': 'application/pdf',
			'content-length': String(resume.bytes.length),
			'content-disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(resume.filename)}`,
			'cache-control': 'private, no-store',
			'x-robots-tag': 'noindex, nofollow'
		}
	});
}

export async function DELETE({ request, params }) {
	if (!isReferralsAuthorized(request)) return notFound();
	const code = normalizeCode(params.code);
	const updated = code ? await deleteResume(code) : null;
	if (!updated) return missing(params.code);
	return strip(updated);
}
