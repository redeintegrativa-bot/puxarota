const email = 'redeintegrativa@gmail.com';
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const name of required) if (!process.env[name]) throw new Error('Missing secret: ' + name);

const base = process.env.SUPABASE_URL.replace(/\/$/, '');
const headers = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json'
};
const usersResponse = await fetch(base + '/auth/v1/admin/users?page=1&per_page=1000', { headers });
if (!usersResponse.ok) throw new Error('Supabase Auth lookup failed: ' + usersResponse.status);
const users = (await usersResponse.json()).users || [];
const user = users.find((item) => String(item.email || '').toLowerCase() === email);
if (!user) throw new Error('The administrator account does not exist yet. Create it first.');

const upsertResponse = await fetch(base + '/rest/v1/puxarota_accounts?on_conflict=user_id', {
  method: 'POST',
  headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify({ user_id: user.id, account_type: 'admin', is_approved: true, display_name: 'Rede Integrativa' })
});
if (!upsertResponse.ok) throw new Error('Administrator promotion failed: ' + upsertResponse.status);
console.log('Administrator access configured for the approved account.');
