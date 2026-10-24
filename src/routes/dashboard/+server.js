import { dashboardGet, dashboardPost } from '$lib/server/visits/dashboard-route';

// Andrea's dashboard: job links, site visits and stats (see dashboard-route.js). Signed out, it
// answers Not found, as /api/visits did.
export const GET = ({ request, url, cookies }) => dashboardGet(request, url, cookies);
export const POST = ({ request, url, cookies }) => dashboardPost(request, url, cookies);
