const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID'];
for (const name of required) if (!process.env[name]) throw new Error('Missing secret: '+name);
const base = process.env.SUPABASE_URL.replace(/\/$/,'');
const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type':'application/json' };
const query = base+'/rest/v1/puxarota_notifications?select=id,message&channel=eq.telegram_admin&status=eq.pending&order=created_at.asc&limit=20';
const response = await fetch(query,{headers});
if(!response.ok) throw new Error('Supabase read failed: '+response.status);
const rows = await response.json();
for (const row of rows) {
  try {
    const sent = await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text:row.message})});
    if(!sent.ok) throw new Error('Telegram failed: '+sent.status);
    await fetch(base+'/rest/v1/puxarota_notifications?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({status:'sent',sent_at:new Date().toISOString()})});
    console.log('sent',row.id);
  } catch (error) {
    await fetch(base+'/rest/v1/puxarota_notifications?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({status:'failed'})});
    console.error('failed',row.id,error.message);
  }
}
