const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const name of required) if (!process.env[name]) throw new Error('Missing secret: ' + name);

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
const headers = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal'
};
let page = 1;
let synced = 0;
while (true) {
  const response = await fetch(base + '/auth/v1/admin/users?page=' + page + '&per_page=1000', { headers });
  if (!response.ok) throw new Error('Supabase Auth lookup failed: ' + response.status);
  const users = (await response.json()).users || [];
  for (const user of users) {
    if (!user.email) continue;
    const update = await fetch(base + '/rest/v1/puxarota_accounts?user_id=eq.' + encodeURIComponent(user.id), {
      method: 'PATCH', headers, body: JSON.stringify({ email_snapshot: user.email })
    });
    if (!update.ok) throw new Error('Account contact sync failed: ' + update.status);
    synced += 1;
  }
  if (users.length < 1000) break;
  page += 1;
}
console.log('Account contact records synchronized:', synced);
