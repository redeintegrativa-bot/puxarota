import { readFile } from 'node:fs/promises';

const [catalogPath, reviewPath, sourcesPath] = process.argv.slice(2);
const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!catalogPath || !reviewPath || !sourcesPath || !base || !key) throw new Error('Usage: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [catalog, review, sources] = await Promise.all([readJson(catalogPath), readJson(reviewPath), readJson(sourcesPath)]);
const reviewSources = new Set((sources.sources || []).filter((item) => item.review_required).map((item) => item.name));
const candidateJobs = (review.jobs || []).filter((job) => reviewSources.has(job.source));
const initial = new Map();
for (const job of catalog.jobs || []) initial.set(job.id, { job, initialStatus: 'approved' });
for (const job of candidateJobs) initial.set(job.id, { job, initialStatus: 'pending' });

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const existingResponse = await fetch(`${base}/rest/v1/puxarota_opportunities?select=id,status,reviewed_at` , { headers });
if (!existingResponse.ok) throw new Error(`Could not read opportunity queue: ${existingResponse.status}`);
const existing = new Map((await existingResponse.json()).map((item) => [item.id, item]));
const statusFor = ({ job, initialStatus }) => {
  const prev = existing.get(job.id);
  if (!prev) return initialStatus;
  if (initialStatus === 'pending' && prev.status === 'approved' && !prev.reviewed_at) return 'pending';
  return prev.status;
};
const records = [...initial.values()].map(({ job, initialStatus }) => ({
  id: job.id,
  company: job.company,
  title: job.title,
  source: job.source,
  source_url: job.url,
  origin: job.origin || null,
  area: job.area || null,
  vehicles: job.vehicles || [],
  model: job.model || null,
  routine: job.routine || null,
  payment: job.payment || null,
  detail: job.detail || null,
  confidence: job.confidence || null,
  discovered_at: job.discovered_at || new Date().toISOString(),
  last_checked_at: job.last_checked_at || new Date().toISOString(),
  status: statusFor({ job, initialStatus })
}));
if (!records.length) throw new Error('No opportunities found; queue was preserved.');
const upsert = await fetch(`${base}/rest/v1/puxarota_opportunities?on_conflict=id`, {
  method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(records)
});
if (!upsert.ok) throw new Error(`Could not sync opportunity queue: ${upsert.status}`);
console.log(`Synced ${records.length} opportunities (${candidateJobs.length} awaiting review).`);
