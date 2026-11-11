function isWebUrl(input) {
  try {
    const url = new URL(input);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function destination(input, ai = false) {
  const query = input.trim();
  if (!query) return null;
  if (!ai && isWebUrl(query)) return new URL(query).href;
  if (!ai && /^[^\s/:]+\.[^\s/:]+(?:[/:].*)?$/.test(query) && isWebUrl('https://' + query)) {
    return new URL('https://' + query).href;
  }
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', query);
  if (ai) url.searchParams.set('udm', '50');
  return url.href;
}

module.exports = { isWebUrl, destination };
