export async function shortenUrl(longUrl) {
  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
    );
    if (!res.ok) throw new Error('tinyurl failed');
    const short = await res.text();
    if (short.startsWith('http')) return short.trim();
    throw new Error('invalid response');
  } catch {
    return longUrl;
  }
}
