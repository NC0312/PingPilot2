// Loading a person's servers. GET /api/servers returns ONE page: 10 servers unless asked for more, and never more than
// 50. A page that read only the first response silently showed 10 servers, however many there were, so a down server
// could be missing from the dashboard and the plan usage read "10" for everyone. Everything that needs the list, or
// how many there are, goes through here.

/** The most the backend returns in one request */
export const PAGE_SIZE = 50;
/** A safety stop: 40 pages is 2,000 servers, far beyond any plan */
const MAX_PAGES = 40;

const ensureOk = (res) => {
    if (res?.status !== 'success') throw new Error(res?.message || 'Could not load servers');
    return res;
};

const idOf = (s) => s?._id || s?.id;

/**
 * Every server, across all pages. Sorted by name on the server: the default order is "last updated", which changes every
 * time a check runs, so servers would move between pages while we read them and some would be skipped or repeated.
 * @param {(endpoint: string, options?: object) => Promise<any>} apiRequest  from useAuth()
 * @param {{ admin?: boolean }} [options]  admin: every account's servers (admins only)
 */
export async function fetchAllServers(apiRequest, { admin = false } = {}) {
    const seen = new Set();
    const all = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
        const query = `?page=${page}&limit=${PAGE_SIZE}&sortBy=name&sortDir=asc${admin ? '&admin=true' : ''}`;
        const res = ensureOk(await apiRequest(`/api/servers${query}`, { method: 'GET' }));
        const batch = res.data?.servers ?? [];

        for (const server of batch) {
            const id = idOf(server);
            if (id && seen.has(id)) continue; // a server edited mid-read must not appear twice
            if (id) seen.add(id);
            all.push(server);
        }

        if (batch.length === 0 || page >= (res.totalPages || 1)) break;
    }
    return all;
}

/** How many servers the person has, without downloading them */
export async function countServers(apiRequest) {
    const res = ensureOk(await apiRequest('/api/servers?limit=1', { method: 'GET' }));
    return Number.isInteger(res.total) ? res.total : (res.data?.servers?.length ?? 0);
}
