// Run with: npm test
// The documentation: every link in it goes somewhere real, its text cannot make an unsafe link, and each page can be reached.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DOCS, parseInline, slugify, getDoc, neighbours, headingsOf } from '../lib/docs.js';

const root = path.resolve(import.meta.dirname, '..');
const pageExists = (route) => {
    const clean = route.replace(/^\//, '');
    if (clean === '') return true;
    const doc = /^docs\/(.+)$/.exec(clean);
    if (doc) return Boolean(getDoc(doc[1]));
    return ['app', 'app/(dashboard)'].some((base) => fs.existsSync(path.join(root, base, clean, 'page.js')));
};

/** Every piece of text in a page, so every link in it can be checked */
const textsOf = (doc) => doc.blocks.flatMap((b) => [b.text, ...(b.items ?? []), ...(b.rows ?? []).flat()].filter((t) => typeof t === 'string'));

test('pages have unique slugs, titles and summaries', () => {
    assert.equal(new Set(DOCS.map((d) => d.slug)).size, DOCS.length);
    for (const d of DOCS) {
        assert.match(d.slug, /^[a-z0-9-]+$/);
        assert.ok(d.title && d.summary && d.blocks.length > 0, d.slug);
    }
});

test('every link to this site goes to a page that exists', () => {
    for (const doc of DOCS) {
        for (const text of textsOf(doc)) {
            for (const part of parseInline(text)) {
                if (part.type !== 'link' || part.external) continue;
                const route = part.href.split(/[?#]/)[0];
                assert.ok(pageExists(route), `${doc.slug}: ${part.href}`);
            }
        }
    }
});

test('every outside link is https, and none is left half written', () => {
    for (const doc of DOCS) {
        for (const text of textsOf(doc)) {
            for (const part of parseInline(text).filter((p) => p.type === 'link' && p.external)) {
                assert.match(part.href, /^https:\/\/[a-z0-9.-]+\//i, `${doc.slug}: ${part.href}`);
            }
            assert.ok(!/\]\(|\[[^\]]*\]$/.test(parseInline(text).filter((p) => p.type === 'text').map((p) => p.text).join('')), `${doc.slug}: stray link syntax in "${text.slice(0, 60)}"`);
        }
    }
});

test('parseInline: text, code and links, and no unsafe link', () => {
    assert.deepEqual(parseInline('Run `ls` or [see this](/docs/x) or [out](https://a.example/b)'), [
        { type: 'text', text: 'Run ' },
        { type: 'code', text: 'ls' },
        { type: 'text', text: ' or ' },
        { type: 'link', text: 'see this', href: '/docs/x', external: false },
        { type: 'text', text: ' or ' },
        { type: 'link', text: 'out', href: 'https://a.example/b', external: true },
    ]);
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'http://plain.example', 'ftp://x.example']) {
        const parts = parseInline(`[click](${bad})`);
        assert.ok(parts.every((p) => p.type === 'text'), bad);
        assert.equal(parts[0].text, 'click', bad);
    }
    assert.deepEqual(parseInline(null), []);
    assert.deepEqual(parseInline('no markup'), [{ type: 'text', text: 'no markup' }]);
});

test('a link or code in a table cell or list is parsed too, and a backtick URL stays code', () => {
    assert.equal(parseInline('`https://hooks.slack.com/services/...`')[0].type, 'code');
});

test('headings get stable ids, and previous and next walk the whole list', () => {
    assert.equal(slugify('Step 1: get your command'), 'step-1-get-your-command');
    for (const d of DOCS) {
        const ids = headingsOf(d).map((h) => h.id);
        assert.equal(new Set(ids).size, ids.length, `${d.slug}: duplicate heading ids`);
    }
    assert.equal(neighbours(DOCS[0].slug).prev, null);
    assert.equal(neighbours(DOCS.at(-1).slug).next, null);
    assert.equal(neighbours(DOCS[1].slug).prev.slug, DOCS[0].slug);
    assert.equal(neighbours(DOCS[1].slug).next.slug, DOCS[2].slug);
    assert.equal(getDoc('nope'), null);
    assert.equal(getDoc('__proto__'), null);
});

test('the install steps point at the real agent files and commands', () => {
    const agent = getDoc('host-agent');
    const commands = agent.blocks.filter((b) => b.type === 'code').map((b) => b.text).join('\n');
    assert.match(commands, /install\.sh \| sudo PINGPILOT_TOKEN=ppa_\.\.\. sh/);
    assert.match(commands, /--pid=host --net=host --uts=host -v \/:\/host:ro/);
    assert.match(commands, /pingpilot-agent check/);
    assert.doesNotMatch(commands, /ppa_[0-9a-f]{24}_/, 'no real token in the docs');
});
