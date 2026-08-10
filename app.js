const opportunities=[
 {origin:'Guarulhos, SP',destination:'Campinas, SP',pickup:'Coleta amanhã • 07h',distance:'104 km',vehicle:'🚚 Truck baú',operation:'Contrato mensal',payment:'R$ 780 / viagem',frequency:'Seg. a sex.',score:'94%',description:'Distribuição de alimentos embalados. Necessário rastreador e documentação em dia.'},
 {origin:'Osasco, SP',destination:'Sorocaba, SP',pickup:'Início em 3 dias',distance:'91 km',vehicle:'🚛 Carreta LS',operation:'Viagem avulsa',payment:'R$ 1.450 / viagem',frequency:'Retorno opcional',score:'88%',description:'Carga seca paletizada. Descarga agendada e pagamento em até 7 dias.'},
 {origin:'São Bernardo, SP',destination:'Vale do Paraíba',pickup:'Coleta segunda • 06h',distance:'167 km',vehicle:'🚐 VUC refrigerado',operation:'Contrato trimestral',payment:'R$ 920 / diária',frequency:'3× por semana',score:'81%',description:'Produtos refrigerados. Exige baú com controle de temperatura e ANTT ativo.'}
];
let current=0;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
function toast(message){const el=$('#toast');el.textContent=message;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),2200)}
function render(){const d=opportunities[current];Object.entries(d).forEach(([k,v])=>{const el=$('#'+k);if(el)el.textContent=v});$('#card-count').textContent=`0${current+1} / 03`;$('#score-bar').style.width=d.score;$('.progress span').style.width=`${(current+1)*33.33}%`}
function next(message){current=(current+1)%opportunities.length;render();toast(message)}
$$('.bottom-nav button').forEach(button=>button.addEventListener('click',()=>{$$('.bottom-nav button').forEach(x=>x.classList.remove('active'));button.classList.add('active');$$('.screen').forEach(x=>x.classList.remove('active'));$(`[data-screen-panel="${button.dataset.screen}"]`).classList.add('active');window.scrollTo(0,0)}));
$('#interest-button').addEventListener('click',()=>$('#interest-modal').classList.remove('hidden'));
$('.close-modal').addEventListener('click',()=>$('#interest-modal').classList.add('hidden'));
$('#confirm-interest').addEventListener('click',()=>{$('#interest-modal').classList.add('hidden');next('Interesse enviado gratuitamente')});
$('.reject').addEventListener('click',()=>next('Oportunidade descartada'));
$('.save').addEventListener('click',()=>toast('Oportunidade salva'));
$('.reveal-contact').addEventListener('click',e=>{e.target.nextElementSibling.classList.remove('hidden');e.target.textContent='Contato liberado'});
$('#filter-button').addEventListener('click',()=>$('#filter-sheet').classList.remove('hidden'));
$('.close-filter').addEventListener('click',()=>{$('#filter-sheet').classList.add('hidden');toast('Filtros aplicados')});
$$('.overlay').forEach(x=>x.addEventListener('click',e=>{if(e.target===x)x.classList.add('hidden')}));
render();
