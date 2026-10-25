// Searching, filtering and ordering a long list of servers. Plain functions, so they can be tested on their own.

const RANK = { down: 0, unknown: 1, up: 2 };

/** Anything that is not clearly up or down counts as waiting for a first check */
export const statusOf = (server) => (server?.status === 'up' || server?.status === 'down' ? server.status : 'unknown');

/** { all, down, up, unknown } for the filter chips */
export function countByStatus(servers) {
    const counts = { all: servers.length, down: 0, up: 0, unknown: 0 };
    for (const s of servers) counts[statusOf(s)] += 1;
    return counts;
}

/**
 * @param {Array} servers
 * @param {{ query?: string, status?: 'all'|'down'|'up'|'unknown', sort?: 'problems'|'name' }} options
 *   sort 'problems': down first, then waiting, then up (the ones that need you at the top), each group A to Z
 */
export function filterAndSort(servers, { query = '', status = 'all', sort = 'problems' } = {}) {
    const q = query.trim().toLowerCase();
    const matches = servers.filter((s) => {
        if (status !== 'all' && statusOf(s) !== status) return false;
        return !q || `${s.name ?? ''} ${s.url ?? ''}`.toLowerCase().includes(q);
    });
    const byName = (a, b) => (a.name ?? '').localeCompare(b.name ?? '');
    return matches.sort(sort === 'name' ? byName : (a, b) => RANK[statusOf(a)] - RANK[statusOf(b)] || byName(a, b));
}
