const OWNER = 'heltonfelixdearaujo-max';
const REPO = 'painel-vagas';
const BRANCH = 'gh-pages';
const PAGES_BASE = 'https://heltonfelixdearaujo-max.github.io/painel-vagas';

export function getGhToken() {
  return localStorage.getItem('wayzim-gh-token') || '';
}
export function setGhToken(t) {
  localStorage.setItem('wayzim-gh-token', t.trim());
}

export async function syncAllJobs(jobs) {
  const token = getGhToken();
  if (!token || !jobs?.length) return;
  for (const job of jobs) {
    await storeJobAndGetLink(job).catch(() => {});
  }
}

export async function storeJobAndGetLink(job) {
  const { candidates, ...jobData } = job;
  const token = getGhToken();

  if (token) {
    try {
      const path = `jobs/${job.id}.json`;
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(jobData))));

      // Get SHA if file already exists (required for update)
      let sha;
      try {
        const check = await fetch(
          `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (check.ok) sha = (await check.json()).sha;
      } catch {}

      const body = { message: `job ${job.id}`, content, branch: BRANCH };
      if (sha) body.sha = sha;

      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
        {
          method: 'PUT',
          headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (res.ok) {
        return `${PAGES_BASE}/#/candidatar/${job.id}`;
      }
    } catch {}
  }

  // Fallback: compressed URL
  const { compressToEncodedURIComponent } = await import('lz-string');
  const { candidates: _c, ...jobData2 } = job;
  const encoded = compressToEncodedURIComponent(JSON.stringify(jobData2));
  return `${window.location.origin}${window.location.pathname}#/candidatar/${job.id}?j=${encoded}`;
}

export async function fetchJobFromServer(jobId) {
  try {
    const res = await fetch(`${PAGES_BASE}/jobs/${jobId}.json?_=${Date.now()}`);
    if (res.ok) return res.json();
  } catch {}
  return null;
}
