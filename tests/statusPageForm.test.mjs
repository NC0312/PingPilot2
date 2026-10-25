// Run with: npm test
// The status page form: suggested addresses, the checks before saving, the request it builds, and the monitor list.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    emptyForm, formFromPage, missingServers, moveServer, payloadFromForm, setLabel, slugify, toggleServer, validateForm, MAX_COMPONENTS,
} from '../lib/statusPageForm.js';

test('an address is suggested from a title, and nothing when too little is left', () => {
    assert.equal(slugify('Acme Cloud, Inc.'), 'acme-cloud-inc');
    assert.equal(slugify('  My   Shop  '), 'my-shop');
    assert.equal(slugify('Café Müller'), 'cafe-muller');
    assert.equal(slugify('x'.repeat(60)), 'x'.repeat(40));
    assert.equal(slugify(`${'a'.repeat(39)} b`), 'a'.repeat(39), 'a cut never leaves a trailing hyphen');
    assert.equal(slugify('ab'), '');
    assert.equal(slugify('!!!'), '');
    assert.equal(slugify(''), '');
    assert.equal(slugify(undefined), '');
});

test('a new page starts published and not indexable', () => {
    const form = emptyForm();
    assert.equal(form.published, true);
    assert.equal(form.indexable, false);
    assert.deepEqual(form.servers, []);
});

test('a saved page fills the form, and a missing field is empty, not undefined', () => {
    const form = formFromPage({ title: 'Acme', slug: 'acme', servers: [{ serverId: 'a1', label: 'Website' }], published: true });
    assert.deepEqual(form, { title: 'Acme', slug: 'acme', description: '', servers: [{ serverId: 'a1', label: 'Website' }], published: true, indexable: false });
    assert.deepEqual(formFromPage(null).servers, []);
});

test('the form needs a title and a usable address, and says what is wrong with each', () => {
    assert.deepEqual(validateForm({ title: 'Acme', slug: 'acme', description: '' }), {});
    assert.match(validateForm({ title: '  ', slug: 'acme', description: '' }).title, /title/);
    assert.match(validateForm({ title: 'x'.repeat(81), slug: 'acme', description: '' }).title, /80/);
    assert.match(validateForm({ title: 'Acme', slug: '', description: '' }).slug, /Choose an address/);
    for (const bad of ['ab', 'Acme!', '-acme', 'ac--me', 'x'.repeat(41)]) {
        assert.match(validateForm({ title: 'Acme', slug: bad, description: '' }).slug, /lowercase letters/, bad);
    }
    assert.match(validateForm({ title: 'Acme', slug: 'acme', description: 'x'.repeat(301) }).description, /300/);
    assert.deepEqual(validateForm({ title: 'Acme', slug: ' ACME ', description: '' }), {}, 'case and spaces are tidied on save');
});

test('the request is tidied: trimmed, lowercase address, short labels, empty labels sent empty', () => {
    const payload = payloadFromForm({
        title: '  Acme  ', slug: ' ACME-Status ', description: ' Our services ',
        servers: [{ serverId: 'a1', label: '  Website  ' }, { serverId: 'a2', label: '   ' }, { serverId: 'a3', label: 'x'.repeat(80) }],
        published: 1, indexable: 0,
    });
    assert.equal(payload.title, 'Acme');
    assert.equal(payload.slug, 'acme-status');
    assert.equal(payload.description, 'Our services');
    assert.deepEqual(payload.servers.map((s) => s.label.length), [7, 0, 60]);
    assert.equal(payload.published, true);
    assert.equal(payload.indexable, false);
});

test('monitors are added at the end and taken off again, and a page holds at most 50', () => {
    let form = emptyForm();
    form = toggleServer(form, 'a1');
    form = toggleServer(form, 'a2');
    assert.deepEqual(form.servers.map((s) => s.serverId), ['a1', 'a2']);
    form = toggleServer(form, 'a1');
    assert.deepEqual(form.servers.map((s) => s.serverId), ['a2']);

    let full = emptyForm();
    for (let i = 0; i < MAX_COMPONENTS; i += 1) full = toggleServer(full, `s${i}`);
    assert.equal(toggleServer(full, 'one-more').servers.length, MAX_COMPONENTS);
});

test('a display name belongs to one monitor and is kept short', () => {
    let form = toggleServer(toggleServer(emptyForm(), 'a1'), 'a2');
    form = setLabel(form, 'a2', 'Checkout API');
    assert.deepEqual(form.servers.map((s) => s.label), ['', 'Checkout API']);
    assert.equal(setLabel(form, 'a2', 'x'.repeat(90)).servers[1].label.length, 60);
});

test('monitors move up and down, and stay put at either end', () => {
    const form = ['a1', 'a2', 'a3'].reduce((f, id) => toggleServer(f, id), emptyForm());
    const order = (f) => f.servers.map((s) => s.serverId).join(',');
    assert.equal(order(moveServer(form, 'a3', -1)), 'a1,a3,a2');
    assert.equal(order(moveServer(form, 'a1', 1)), 'a2,a1,a3');
    assert.equal(order(moveServer(form, 'a1', -1)), 'a1,a2,a3');
    assert.equal(order(moveServer(form, 'a3', 1)), 'a1,a2,a3');
    assert.equal(order(moveServer(form, 'nope', 1)), 'a1,a2,a3');
});

test('monitors a page lists that the owner no longer has are found', () => {
    const form = { servers: [{ serverId: 'a1', label: '' }, { serverId: 'gone', label: '' }] };
    assert.deepEqual(missingServers(form, ['a1', 'a2']).map((s) => s.serverId), ['gone']);
    assert.deepEqual(missingServers(form, ['a1', 'gone']), []);
});
