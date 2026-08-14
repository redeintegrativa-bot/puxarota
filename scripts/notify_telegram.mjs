const required = ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID'];
for (const name of required) if (!process.env[name]) throw new Error('Missing secret: '+name);
const base = process.env.SUPABASE_URL.replace(/\/$/,'');
const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type':'application/json' };
const action = process.env.PUXAROTA_ACTION || '';
const profileId = process.env.PUXAROTA_PROFILE_ID || '';
if (action || profileId) {
  if (!['approve','archive'].includes(action) || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(profileId)) throw new Error('Invalid PuxaRota admin action');
  const profilePath='/rest/v1/puxarota_profiles?id=eq.'+encodeURIComponent(profileId)+'&select=id,user_id,display_name,status';
  const profileResponse=await fetch(base+profilePath,{headers});
  if (!profileResponse.ok) throw new Error('Profile read failed: '+profileResponse.status);
  const profiles=await profileResponse.json();
  if (!profiles[0]) throw new Error('Profile not found');
  const profile=profiles[0], now=new Date().toISOString();
  const profileUpdate=action==='approve'?{status:'approved',approved_at:now}:{status:'archived'};
  const updateProfile=await fetch(base+'/rest/v1/puxarota_profiles?id=eq.'+encodeURIComponent(profile.id),{method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify(profileUpdate)});
  if (!updateProfile.ok) throw new Error('Profile update failed: '+updateProfile.status);
  const updateAccount=await fetch(base+'/rest/v1/puxarota_accounts?user_id=eq.'+encodeURIComponent(profile.user_id),{method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({is_approved:action==='approve',updated_at:now})});
  if (!updateAccount.ok) throw new Error('Account update failed: '+updateAccount.status);
  const label=profile.display_name||'Cadastro';
  const confirmation=action==='approve'?`✅ PuxaRota: ${label} aprovado.`:`🗂 PuxaRota: ${label} arquivado da fila. A conta foi preservada e pode ser reaberta na gestão.`;
  const sent=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text:confirmation})});
  if (!sent.ok) throw new Error('Telegram confirmation failed: '+sent.status);
  console.log('admin action completed',action,profile.id);
  process.exit(0);
}
// Recuperação segura: se o gatilho do banco tiver sido aplicado depois de um
// cadastro, a próxima execução ainda cria uma única notificação para perfis
// recentes. Registros já enfileirados não são duplicados.
const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const recentProfilesResponse = await fetch(base + '/rest/v1/puxarota_profiles?select=id,user_id,display_name,profile_type,region,vehicle,status,created_at&created_at=gte.' + encodeURIComponent(recentSince) + '&status=in.(pending,approved)', { headers });
if (!recentProfilesResponse.ok) throw new Error('Recent profile read failed: ' + recentProfilesResponse.status);
const recentProfiles = await recentProfilesResponse.json();
const queuedResponse = await fetch(base + '/rest/v1/puxarota_notifications?select=account_id&channel=eq.telegram_admin', { headers });
if (!queuedResponse.ok) throw new Error('Notification queue read failed: ' + queuedResponse.status);
const queuedAccounts = new Set((await queuedResponse.json()).map((row) => row.account_id).filter(Boolean));
for (const profile of recentProfiles) {
  if (!profile.user_id || queuedAccounts.has(profile.user_id)) continue;
  const message = 'Novo cadastro no PuxaRota: ' + (profile.display_name || 'sem nome') + ' | perfil: ' + profile.profile_type + ' | região: ' + (profile.region || 'não informada') + ' | veículo: ' + (profile.vehicle || 'não informado');
  const queued = await fetch(base + '/rest/v1/puxarota_notifications', { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ account_id: profile.user_id, channel: 'telegram_admin', status: 'pending', message }) });
  if (!queued.ok) throw new Error('Notification recovery enqueue failed: ' + queued.status);
}
const query = base+'/rest/v1/puxarota_notifications?select=id,message,account_id&channel=eq.telegram_admin&status=eq.pending&order=created_at.asc&limit=20';
const response = await fetch(query,{headers});
if(!response.ok) throw new Error('Supabase read failed: '+response.status);
const rows = await response.json();
for (const row of rows) {
  try {
    let profile=[];
    if(row.account_id){
      try {
        const profileQuery=base+'/rest/v1/puxarota_profiles?user_id=eq.'+encodeURIComponent(row.account_id)+'&select=id,display_name,profile_type,region,postal_code,vehicle,license_category,cargo_preference,availability,whatsapp,status&limit=1';
        const profileResponse=await fetch(profileQuery,{headers});
        if(profileResponse.ok) profile=await profileResponse.json();
      } catch(error) { console.error('profile details unavailable',row.id,error.message); }
    }
    let text=row.message, reply_markup;
    if(profile[0]){
      const item=profile[0], value=key=>item[key]||'não informado';
      text += `\n\n<b>Dados para revisão</b>\nTipo: ${value('profile_type')}\nRegião: ${value('region')}\nCEP: ${value('postal_code')}\nVeículo: ${value('vehicle')}\nCNH: ${value('license_category')}\nPreferência: ${value('cargo_preference')}\nDisponibilidade: ${value('availability')}\nWhatsApp: ${value('whatsapp')}`;
      reply_markup={inline_keyboard:[
        [{text:'✅ Aprovar cadastro',callback_data:'puxarota:approve:'+item.id}],
        [{text:'🗂 Arquivar da fila',callback_data:'puxarota:archive:'+item.id}],
        [{text:'↗ Abrir gestão completa',url:'https://puxarota.vercel.app/?open=profile'}],
      ]};
    }
    const sent = await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text,parse_mode:'HTML',...(reply_markup?{reply_markup}:{})})});
    if(!sent.ok) throw new Error('Telegram failed: '+sent.status);
    await fetch(base+'/rest/v1/puxarota_notifications?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({status:'sent',sent_at:new Date().toISOString()})});
    console.log('sent',row.id);
  } catch (error) {
    await fetch(base+'/rest/v1/puxarota_notifications?id=eq.'+encodeURIComponent(row.id),{method:'PATCH',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({status:'failed'})});
    console.error('failed',row.id,error.message);
  }
}
