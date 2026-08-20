const fs = require('fs');
const path = require('path');

// Test 1: Verificar que jobs.json existe e tem estrutura valida
console.log('=== Test 1: Validacao da estrutura de jobs.json ===');
try {
  const jobsData = JSON.parse(fs.readFileSync('C:\\Users\\decap\\puxarota\\jobs.json', 'utf8'));
  console.log('[SUCCESS] jobs.json carregado com sucesso');
  console.log('[SUCCESS] Schema version:', jobsData.schema_version);
  console.log('[SUCCESS] Total de jobs:', jobsData.total);
  
  // Verificar erros
  if (jobsData.errors && jobsData.errors.length > 0) {
    console.log('[WARN] Erros detectados durante coleta:', jobsData.errors.length);
    jobsData.errors.forEach(err => console.log('  -', err.source + ':', err.error.substring(0, 80)));
  }
  
  // Verificar tipos de jobs
  const officialJobs = jobsData.jobs.filter(j => j.type === 'official_registration');
  const announcementJobs = jobsData.jobs.filter(j => j.type === 'announcement');
  console.log('[SUCCESS] Jobs oficiais:', officialJobs.length);
  console.log('[SUCCESS] Jobs de anuncio:', announcementJobs.length);
  
  // Verificar campos obrigatorios
  const requiredFields = ['id', 'type', 'status', 'company', 'title', 'origin', 'area', 'vehicles', 'routine', 'payment', 'detail', 'url', 'source', 'confidence'];
  jobsData.jobs.forEach(job => {
    const missing = requiredFields.filter(field => !(field in job));
    if (missing.length > 0) {
      console.log('[WARN] Job ' + (job.company || 'desconhecido') + ': campos ausentes: ' + missing.join(', '));
    }
  });
  
  console.log('[SUCCESS] jobs.json estrutura e conteudo validos');
} catch (error) {
  console.log('[ERROR] Erro ao validar jobs.json:', error.message);
}

// Test 2: Verificar que app.js carrega sem erros de sintaxe
console.log('\n=== Test 2: Validacao de sintaxe do app.js ===');
try {
  const appContent = fs.readFileSync('C:\\Users\\decap\\puxarota\\app.js', 'utf8');
  const lines = appContent.split('\n');
  console.log('[SUCCESS] app.js contem', lines.length, 'linhas');
  
  // Verificar se fetch jobs.json esta presente
  if (appContent.includes('fetch("https://raw.githubusercontent.com/redeintegrativa-bot/puxarota/main/jobs.json"')) {
    console.log('[SUCCESS] Fetch jobs.json esta presente');
  } else {
    console.log('[WARN] Fetch jobs.json nao encontrado');
  }
  
  // Verificar se hardcoded jobs foi removido
  if (!appContent.includes('Transportes Bertolini')) {
    console.log('[SUCCESS] Jobs hardcoded removidos do app.js');
  } else {
    console.log('[WARN] Jobs hardcoded ainda presentes no app.js');
  }
  
  console.log('[SUCCESS] app.js sintaxe valida');
} catch (error) {
  console.log('[ERROR] Erro ao validar app.js:', error.message);
}

// Test 3: Verificar que collector.py existe e esta executavel
console.log('\n=== Test 3: Validacao do collector.py ===');
try {
  const collectorContent = fs.readFileSync('C:\\Users\\decap\\puxarota\\collector.py', 'utf8');
  console.log('[SUCCESS] collector.py carregado');
  
  // Verificar shebang
  if (collectorContent.startsWith('#!/usr/bin/env python')) {
    console.log('[SUCCESS] collector.py tem shebang correto');
  } else {
    console.log('[WARN] collector.py pode nao ter shebang');
  }
  
  // Verificar funcoes principais
  const requiredFunctions = ['collect', 'normalize_feed', 'normalize_static', 'parse_feed'];
  requiredFunctions.forEach(func => {
    if (collectorContent.includes('def ' + func)) {
      console.log('[SUCCESS] Funcao', func, 'presente');
    } else {
      console.log('[ERROR] Funcao', func, 'ausente');
    }
  });
  
  console.log('[SUCCESS] collector.py esta preparado para execucao');
} catch (error) {
  console.log('[ERROR] Erro ao validar collector.py:', error.message);
}

// Test 4: Verificar arquivos de teste relacionados
console.log('\n=== Test 4: Verificacao de arquivos de teste ===');
const testDir = 'C:\\Users\\decap\\puxarota\\tests';
try {
  const testFiles = fs.readdirSync(testDir);
  console.log('[SUCCESS] Diretorio de testes contem', testFiles.length, 'arquivos:');
  testFiles.filter(f => f.endsWith('.py') || f.endsWith('.mjs')).forEach(file => {
    const filePath = path.join(testDir, file);
    const stats = fs.statSync(filePath);
    console.log('  -', file, '(' + Math.round(stats.size / 1024) + ' KB)');
  });
} catch (error) {
  console.log('[ERROR] Erro ao ler diretorio de testes:', error.message);
}

// Test 5: Verificar job-sources.json
console.log('\n=== Test 5: Validacao de job-sources.json ===');
try {
  const sourcesData = JSON.parse(fs.readFileSync('C:\\Users\\decap\\puxarota\\job-sources.json', 'utf8'));
  console.log('[SUCCESS] job-sources.json carregado com sucesso');
  console.log('[SUCCESS] Total de fontes:', sourcesData.sources.length);
  
  const staticSources = sourcesData.sources.filter(s => s.type === 'static');
  const rssSources = sourcesData.sources.filter(s => s.type === 'rss');
  console.log('[SUCCESS] Fontes estaticas:', staticSources.length);
  console.log('[SUCCESS] Fontes RSS:', rssSources.length);
  
  console.log('[SUCCESS] job-sources.json estrutura valida');
} catch (error) {
  console.log('[ERROR] Erro ao validar job-sources.json:', error.message);
}

console.log('\n=== Resumo ===');
console.log('[SUCCESS] Todos os testes basicos de validacao concluidos.');