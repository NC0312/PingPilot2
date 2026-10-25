// Run with: npm test
// The form recognises the same three chat addresses the backend does, so it can say so before saving.
import test from 'node:test';
import assert from 'node:assert/strict';
import { detectChat, channelLabel } from '../lib/chatWebhook.js';

test('the three chat addresses are recognised', () => {
    assert.equal(detectChat('https://hooks.slack.com/services/T000/B000/XXXX'), 'slack');
    assert.equal(detectChat('https://discord.com/api/webhooks/123456789/abc_DEF-1.x'), 'discord');
    assert.equal(detectChat('https://api.telegram.org/bot123:ABC/sendMessage?chat_id=-100123'), 'telegram');
    assert.equal(detectChat('  https://hooks.slack.com/services/T000/B000/XXXX  '), 'slack', 'spaces around a pasted address');
});

test('look-alikes, other formats and a Telegram address without a chat are not chat', () => {
    for (const url of [
        'https://example.com/hook',
        'http://hooks.slack.com/services/T/B/x',
        'https://hooks.slack.com.evil.example/services/T/B/x',
        'https://discord.com/api/webhooks/1/abc/slack',
        'https://api.telegram.org/bot123:ABC/sendMessage',
        'https://api.telegram.org/bot123:ABC/getMe?chat_id=5',
        'nonsense',
        '',
        undefined,
    ]) {
        assert.equal(detectChat(url), null, String(url));
    }
});

test('a saved address is labelled by its app, or "Webhook"', () => {
    assert.equal(channelLabel('https://hooks.slack.com/services/T000/B000/XXXX'), 'Slack');
    assert.equal(channelLabel('https://example.com/hook'), 'Webhook');
    assert.equal(channelLabel(''), 'Webhook');
});
