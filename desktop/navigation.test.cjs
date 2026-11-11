const { test } = require('node:test');
const assert = require('node:assert/strict');
const { destination, isWebUrl, website } = require('../web/navigation.js');

test('opens bare domains and HTTP addresses', () => {
  assert.equal(destination(' meeket.in/tools '), 'https://meeket.in/tools');
  assert.equal(destination('http://localhost:3000'), 'http://localhost:3000/');
  assert.equal(destination(' '), null);
});

test('encodes search text and AI Mode independently', () => {
  const url = new URL(destination('RBI & lending', true));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('q'), 'RBI & lending');
  assert.equal(url.searchParams.get('udm'), '50');
});

test('never navigates directly to executable or local schemes', () => {
  for (const value of ['javascript:alert(1)', 'file:///C:/private', 'data:text/html,hi']) {
    assert.equal(isWebUrl(value), false);
    assert.equal(new URL(destination(value)).hostname, 'www.google.com');
  }
});

test('normalizes shortcut addresses without converting invalid input into searches', () => {
  assert.equal(website('example.com:8443/path?x=1#top'), 'https://example.com:8443/path?x=1#top');
  assert.equal(website('http://localhost:5173'), 'http://localhost:5173/');
  assert.equal(website('https://user:secret@example.com'), null);
  assert.equal(website('not a website'), null);
});
