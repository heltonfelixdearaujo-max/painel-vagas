export async function shortenUrl(longUrl) {
  try {
    const res = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`
    );
    if (!res.ok) throw new Error('isgd failed');
    const short = await res.text();
    if (short.startsWith('http')) return short.trim();
    throw new Error('invalid response');
  } catch {
    return longUrl;
  }
}
