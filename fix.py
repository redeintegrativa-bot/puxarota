import re
with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace oppForm.onsubmit block
opp_pattern = re.compile(r'(const oppForm = q\(\"#opp-form\"\);.*?\n\s*\})', re.DOTALL)
def replace_opp(match):
    return '''  const oppForm = q(\"#opp-form\");
  if (oppForm) oppForm.onsubmit = async (event) => {
    event.preventDefault();
    const statusEl = q(\"#opp-status\");
    const clearStatus = () => { if (statusEl) statusEl.textContent = \"\"; };
    const title = q(\"#opp-title\").value.trim();
    if (!title) {
      toast(\"Informe o título da vaga.\");
      q(\"#opp-title\").focus();
      return;
    }
    // company required for company accounts
    const accType = window.PuxaRotaAuth?.account?.account_type;
    if (accType === \"company\" && !title) {
      toast(\"Informe o título da vaga (empresa obrigatória).\");
      q(\"#opp-title\").focus();
      return;
    }
    if (!window.PuxaRotaAuth?.createOpportunity) {
      toast(\"A conexão segura está indisponível. Tente novamente.\");
      return;
    }
    if (statusEl) statusEl.textContent = \"Enviando...\";
    const submitBtn = q(\"#opp-form button[type=\\\"submit\\\"]\");
    if (submitBtn) submitBtn.disabled = true;
    const result = await window.PuxaRotaAuth.createOpportunity({
      company: \"\", title,
      detail: q(\"#opp-detail\")?.value.trim() || null,
      origin: q(\"#opp-origin\")?.value.trim() || null,
      area: null, vehicles: (q(\"#opp-vehicles\")?.value || \"\").split(\",\").map((v) => v.trim()).filter(Boolean),
      model: null, routine: null, payment: q(\"#opp-payment\")?.value.trim() || null,
      status: \"pending\"
    });
    if (!result.ok) {
      if (statusEl) {
        statusEl.textContent = \"Não foi possível enviar. Revise os dados e tente novamente.\";
        statusEl.classList.add(\"error\");
      }
      toast(\"Não foi possível enviar a oportunidade agora.\");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    // sucesso
    if (submitBtn) submitBtn.disabled = false;
    if (statusEl) statusEl.textContent = \"\";
    const newOpp = result?.data;
    if (newOpp) {
      allJobs.push(newOpp);
      draw();
    }
    if (newOpp.status === \"pending\") {
      toast(\"Oportunidade enviada. Está aguardando aprovação do admin.\");
    } else if (newOpp.status === \"approved\") {
      toast(\"Oportunidade enviada e já aprovada.\");
    } else {
      toast(\"Oportunidade enviada.\");
    }
  };'''
content = opp_pattern.sub(replace_opp, content)

# 2. Replace jobs = allJobs.slice();
content = re.sub(r'jobs = allJobs\.slice\(\);', 'jobs = allJobs.filter(j => j.status === \"approved\");', content)

# 3. Add admin UI before </body>
admin_ui = '''<!-- Admin Opportunities Button -->
<div id=\"admin-opportunities-container\" style=\"display:none;position:fixed;top:20px;right:20px;z-index:1000;\">
  <button id=\"admin-opportunities-btn\" style=\"padding:10px 20px;background:#ff9800;color:white;border:none;border-radius:4px;\">Oportunidades Pendentes</button>
  <div id=\"admin-opportunities-modal\" style=\"display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:1001;\">
    <div style=\"background:white;padding:20px;border-radius:8px;width:80%;max-height:80vh;overflow:auto;\">
      <h2>Oportunidades Pendentes de Aprovação</h2>
      <div id=\"admin-opportunities-list\"></div>
      <button id=\"admin-close-btn\" style=\"margin-top:10px;padding:8px 16px;background:#f44336;color:white;border:none;border-radius:4px;\">Fechar</button>
    </div>
  </div>
</div>
<script>
async function loadAdminOpportunities() {
  if (!(window.PuxaRotaAuth?.account?.account_type === \"admin\")) return;
  const resp = await fetch('/api/opportunities/pending', {cache: 'no-store'});
  if (!resp.ok) { console.error('Failed to fetch pending'); return; }
  const data = await resp.json();
  const listDiv = document.getElementById('admin-opportunities-list');
  listDiv.innerHTML = '';
  if (!data.length) { listDiv.textContent = 'Nenhuma oportunidade pendente.'; return; }
  data.forEach(opp => {
    const div = document.createElement('div');
    div.style.border='1px solid #ddd;margin:10px 0;padding:10px;border-radius:4px';
    div.innerHTML = `<strong>${opp.title}</strong><br/>Empresa: ${opp.company || 'N/A'}<br/>Origem: ${opp.origin || 'N/A'}`;
    const approveBtn = document.createElement('button');
    approveBtn.textContent = 'Aprovar';
    approveBtn.style.marginRight='5px';
    approveBtn.onclick = async () => {
      const r = await fetch(`/api/opportunities/${opp.id}/approve`, {method:'POST',cache:'no-store'});
      if (r.ok) { loadAdminOpportunities(); }
    };
    const rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Recusar';
    rejectBtn.onclick = async () => {
      const reason = prompt('Motivo da recusa (opcional):');
      const r = await fetch(`/api/opportunities/${opp.id}/reject`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({reason: reason||''}),
        cache:'no-store'
      });
      if (r.ok) { loadAdminOpportunities(); }
    };
    div.appendChild(approveBtn);
    div.appendChild(rejectBtn);
    listDiv.appendChild(div);
  });
}
document.getElementById('admin-opportunities-btn').onclick = () => {
  document.getElementById('admin-opportunities-modal').style.display = 'flex';
  loadAdminOpportunities();
};
document.getElementById('admin-close-btn').onclick = () => {
  document.getElementById('admin-opportunities-modal').style.display = 'none';
};
// Show button if admin
if (window.PuxaRotaAuth?.account?.account_type === \"admin\") {
  document.getElementById('admin-opportunities-container').style.display = 'block';
}
</script>
'''
if '</body>' in content:
    content = content.replace('</body>', admin_ui + '\\n</body>')
else:
    content = content + admin_ui

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
