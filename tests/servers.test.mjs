// Run with: npm test
// Loading every page of servers, and searching/filtering/ordering a long list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllServers, countServers, PAGE_SIZE } from '../lib/servers.js';
import { countByStatus, filterAndSort, statusOf } from '../lib/server-list.js';

const make = (n, status = 'up') => Array.from({ length: n }, (_, i) => ({ _id: `s${i}`, name: `server-${String(i).padStart(3, '0')}`, url: `https://s${i}.example.com`, status }));

// A fake backend: pages of `limit` from `all`, like GET /api/servers
const backend = (all, calls = []) => async (endpoint) => {
    calls.push(endpoint);
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const page = Number(params.get('page') || 1);
    const limit = Math.min(50, Number(params.get('limit') || 10));
    return { status: 'success', total: all.length, totalPages: Math.ceil(all.length / limit), data: { servers: all.slice((page - 1) * limit, page * limit) } };
};

test('all 120 servers are loaded, not just the first page', async () => {
    const calls = [];
    const servers = await fetchAllServers(backend(make(120), calls));
    assert.equal(servers.length, 120);
    assert.equal(calls.length, 3, '50 + 50 + 20');
    assert.equal(new Set(servers.map((s) => s._id)).size, 120);
});

test('requests ask for the biggest page and a stable order, and pass the admin flag on', async () => {
    const calls = [];
    await fetchAllServers(backend(make(3), calls), { admin: true });
    assert.equal(calls.length, 1);
    assert.match(calls[0], new RegExp(`limit=${PAGE_SIZE}`));
    assert.match(calls[0], /sortBy=name&sortDir=asc/);
    assert.match(calls[0], /admin=true/);
    const plain = [];
    await fetchAllServers(backend(make(3), plain));
    assert.doesNotMatch(plain[0], /admin/);
});

test('a server that appears on two pages is kept once', async () => {
    const all = make(60);
    let call = 0;
    const api = async () => {
        call += 1;
        return call === 1
            ? { status: 'success', total: 60, totalPages: 2, data: { servers: all.slice(0, 50) } }
            : { status: 'success', total: 60, totalPages: 2, data: { servers: all.slice(45, 60) } }; // overlaps 5
    };
    assert.equal((await fetchAllServers(api)).length, 60);
});

test('no servers, a failure, and a runaway answer are all handled', async () => {
    assert.deepEqual(await fetchAllServers(backend([])), []);
    await assert.rejects(fetchAllServers(async () => ({ status: 'error', message: 'Nope' })), /Nope/);
    let calls = 0;
    const endless = async () => ({ status: 'success', totalPages: 99999, data: { servers: [{ _id: `x${calls++}`, name: 'x' }] } });
    assert.equal((await fetchAllServers(endless)).length, 40, 'stops at the safety limit');
});

test('the count comes from the total, not from the first page', async () => {
    assert.equal(await countServers(backend(make(73))), 73);
    assert.equal(await countServers(async () => ({ status: 'success', data: { servers: make(4) } })), 4);
});

// ---- the list ---------------------------------------------------------------------------------------------

const mixed = [
    { _id: 'a', name: 'Zeta API', url: 'https://zeta.io', status: 'up' },
    { _id: 'b', name: 'Alpha Web', url: 'https://alpha.io', status: 'down' },
    { _id: 'c', name: 'Beta Shop', url: 'https://shop.beta.io', status: 'unknown' },
    { _id: 'd', name: 'Gamma', url: 'https://gamma.io', status: 'up' },
    { _id: 'e', name: 'Delta', url: 'https://delta.io', status: 'down' },
];

test('problems come first, then waiting, then up, each A to Z', () => {
    assert.deepEqual(filterAndSort(mixed).map((s) => s.name), ['Alpha Web', 'Delta', 'Beta Shop', 'Gamma', 'Zeta API']);
});

test('A to Z ignores status', () => {
    assert.deepEqual(filterAndSort(mixed, { sort: 'name' }).map((s) => s.name), ['Alpha Web', 'Beta Shop', 'Delta', 'Gamma', 'Zeta API']);
});

test('search matches name or address, ignoring case and spaces at the ends', () => {
    assert.deepEqual(filterAndSort(mixed, { query: '  SHOP ' }).map((s) => s.name), ['Beta Shop']);
    assert.deepEqual(filterAndSort(mixed, { query: 'gamma.io' }).map((s) => s.name), ['Gamma']);
    assert.deepEqual(filterAndSort(mixed, { query: 'nothing' }), []);
});

test('the status filter and search combine; waiting servers have their own filter', () => {
    assert.deepEqual(filterAndSort(mixed, { status: 'down' }).map((s) => s.name), ['Alpha Web', 'Delta']);
    assert.deepEqual(filterAndSort(mixed, { status: 'down', query: 'alp' }).map((s) => s.name), ['Alpha Web']);
    assert.deepEqual(filterAndSort(mixed, { status: 'unknown' }).map((s) => s.name), ['Beta Shop']);
});

test('counts feed the filter chips, and odd statuses count as waiting', () => {
    assert.deepEqual(countByStatus(mixed), { all: 5, down: 2, up: 2, unknown: 1 });
    assert.equal(statusOf({ status: 'something-new' }), 'unknown');
    assert.equal(statusOf(undefined), 'unknown');
});

test('sorting never changes the original list, and 500 servers sort quickly', () => {
    const before = mixed.map((s) => s._id).join();
    filterAndSort(mixed);
    assert.equal(mixed.map((s) => s._id).join(), before);
    const big = make(500).map((s, i) => ({ ...s, status: i % 25 === 0 ? 'down' : 'up' }));
    const t0 = performance.now();
    const sorted = filterAndSort(big);
    assert.ok(performance.now() - t0 < 200);
    assert.equal(sorted[0].status, 'down');
    assert.equal(sorted.filter((s) => s.status === 'down').length, 20);
});
