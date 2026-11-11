function isWebUrl(input) {
  try {
    const url = new URL(input);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function website(input) {
  const address = input.trim();
  if (isWebUrl(address)) return new URL(address).href;
  if (/^[^\s/:@?#\\]+\.[^\s/:@?#\\]+(?::\d+)?(?:[/?#][^\s\\]*)?$/.test(address) &&
      isWebUrl('https://' + address)) {
    return new URL('https://' + address).href;
  }
  return null;
}

function destination(input, ai = false) {
  const query = input.trim();
  if (!query) return null;
  const address = ai ? null : website(query);
  if (address) return address;
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', query);
  if (ai) url.searchParams.set('udm', '50');
  return url.href;
}

if (typeof module === "object") module.exports = { isWebUrl, website, destination };
