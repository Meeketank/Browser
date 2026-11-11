const { test } = require('node:test');
const assert = require('node:assert/strict');
const { destination, isWebUrl } = require('./navigation.cjs');

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
