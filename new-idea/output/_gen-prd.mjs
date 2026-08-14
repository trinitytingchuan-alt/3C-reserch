import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORDER = ["ID-002","ID-001","ID-006","ID-003","ID-005"];

const FIG = {
  "ID-002": `<svg viewBox="0 0 480 280" class="figsvg"><defs><linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15233B"/><stop offset="1" stop-color="#0B1422"/></linearGradient><linearGradient id="lens2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3D5E"/><stop offset="1" stop-color="#0B1C38"/></linearGradient></defs><rect width="480" height="280" rx="18" fill="url(#bg2)"/><ellipse cx="240" cy="252" rx="150" ry="15" fill="#000" opacity="0.35"/><g><rect x="146" y="92" width="78" height="52" rx="16" fill="url(#lens2)" stroke="#8FB8EE" stroke-width="1.5"/><rect x="256" y="92" width="78" height="52" rx="16" fill="url(#lens2)" stroke="#8FB8EE" stroke-width="1.5"/><path d="M224 116 h32" stroke="#9BB4D6" stroke-width="4" stroke-linecap="round"/><circle cx="185" cy="118" r="7" fill="#0B7CF2"/><circle cx="185" cy="118" r="12" fill="none" stroke="#0B7CF2" stroke-width="1.5" opacity="0.5"/></g><g><rect x="60" y="178" width="70" height="48" rx="9" fill="#0E1B30" stroke="#0B7CF2" stroke-width="2"/><path d="M70 188 h50 M70 202 h34" stroke="#3A6EA5" stroke-width="2" opacity="0.7"/><text x="95" y="240" text-anchor="middle" font-family="monospace" font-size="11" fill="#5BA8FF">REC</text></g><g><rect x="178" y="184" width="240" height="44" rx="12" fill="#fff"/><rect x="178" y="184" width="6" height="44" rx="3" fill="#0B7CF2"/><text x="320" y="206" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#1A2B4A" font-weight="600">前方路口左转 200 米</text><text x="320" y="222" text-anchor="middle" font-family="monospace" font-size="11.5" fill="#5A6B85">Turn left at the junction, 200m</text></g><text x="240" y="268" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">AI 第一视角拍摄 + 同声传译字幕</text></svg>`,
  "ID-001": `<svg viewBox="0 0 480 280" class="figsvg"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#162238"/><stop offset="1" stop-color="#0A1018"/></linearGradient><linearGradient id="bat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B7CF2"/><stop offset="1" stop-color="#064A94"/></linearGradient></defs><rect width="480" height="280" rx="18" fill="url(#bg1)"/><ellipse cx="240" cy="255" rx="140" ry="12" fill="#000" opacity="0.3"/><g><rect x="150" y="88" width="72" height="48" rx="14" fill="#1A2D4A" stroke="#5A82A8" stroke-width="1.5"/><rect x="258" y="88" width="72" height="48" rx="14" fill="#1A2D4A" stroke="#5A82A8" stroke-width="1.5"/><path d="M222 112 h36" stroke="#5A82A8" stroke-width="3.5" stroke-linecap="round"/></g><path d="M130 136 C110 155 105 175 108 195 L115 192 C114 175 118 158 135 142 Z" fill="#2A3D5E" stroke="#0B7CF2" stroke-width="1"/><path d="M350 136 C370 155 375 175 372 195 L365 192 C366 175 362 158 345 142 Z" fill="#2A3D5E" stroke="#0B7CF2" stroke-width="1"/><g transform="translate(190,170)"><rect x="0" y="0" width="100" height="52" rx="14" fill="#0B1120" stroke="#0B7CF2" stroke-width="2"/><rect x="10" y="10" width="50" height="8" rx="4" fill="url(#bat)"/><text x="50" y="42" text-anchor="middle" font-family="monospace" font-size="16" fill="#5BA8FF" font-weight="600">98%</text></g><text x="240" y="266" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">颈挂式外挂电池 · 全天候续航</text></svg>`,
  "ID-006": `<svg viewBox="0 0 480 280" class="figsvg"><defs><linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#141E30"/><stop offset="1" stop-color="#0B1018"/></linearGradient><linearGradient id="vm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1A3A5C"/><stop offset="1" stop-color="#0D2035"/></linearGradient></defs><rect width="480" height="280" rx="18" fill="url(#bg3)"/><ellipse cx="240" cy="255" rx="140" ry="12" fill="#000" opacity="0.3"/><g><rect x="148" y="86" width="74" height="50" rx="14" fill="#1A2D4A" stroke="#5A82A8" stroke-width="1.5"/><rect x="258" y="86" width="74" height="50" rx="14" fill="#1A2D4A" stroke="#5A82A8" stroke-width="1.5"/><path d="M222 110 h36" stroke="#5A82A8" stroke-width="3.5" stroke-linecap="round"/></g><g transform="translate(120,156)"><rect x="0" y="0" width="240" height="78" rx="14" fill="url(#vm)" stroke="#0B7CF2" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="14" y="14" width="56" height="20" rx="6" fill="#0B7CF2" opacity="0.2"/><rect x="14" y="42" width="80" height="8" rx="4" fill="#fff" opacity="0.08"/><rect x="104" y="14" width="56" height="20" rx="6" fill="#28AA6E" opacity="0.2"/><rect x="104" y="42" width="64" height="8" rx="4" fill="#fff" opacity="0.08"/><rect x="178" y="14" width="42" height="20" rx="6" fill="#D69614" opacity="0.2"/><rect x="178" y="42" width="48" height="8" rx="4" fill="#fff" opacity="0.08"/><text x="120" y="70" text-anchor="middle" font-family="monospace" font-size="10" fill="#5BA8FF">RayNeo VM · 安卓应用容器</text></g><text x="240" y="266" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">RayNeo VM 开放应用生态</text></svg>`,
  "ID-003": `<svg viewBox="0 0 480 280" class="figsvg"><defs><linearGradient id="bg4" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#182238"/><stop offset="1" stop-color="#0C121A"/></linearGradient></defs><rect width="480" height="280" rx="18" fill="url(#bg4)"/><ellipse cx="240" cy="255" rx="140" ry="12" fill="#000" opacity="0.3"/><g><rect x="146" y="84" width="76" height="50" rx="16" fill="#1E3048" stroke="#6A9BD0" stroke-width="1.8"/><rect x="258" y="84" width="76" height="50" rx="16" fill="#1E3048" stroke="#6A9BD0" stroke-width="1.8"/><path d="M222 108 h36" stroke="#6A9BD0" stroke-width="3.5" stroke-linecap="round"/><circle cx="184" cy="109" r="5" fill="#0B7CF2" opacity="0.6"/></g><g transform="translate(160,154)"><rect x="0" y="0" width="26" height="46" rx="8" fill="#2A4A6A" stroke="#0B7CF2" stroke-width="1.5"/><line x1="13" y1="10" x2="13" y2="36" stroke="#0B7CF2" stroke-width="2" stroke-dasharray="2 2"/><text x="13" y="58" text-anchor="middle" font-family="monospace" font-size="9" fill="#5BA8FF">钛合金铰链</text></g><g transform="translate(210,154)"><rect x="0" y="16" width="50" height="14" rx="7" fill="#1A3A5C" stroke="#28AA6E" stroke-width="1.5"/><circle cx="10" cy="23" r="3" fill="#28AA6E"/><circle cx="25" cy="23" r="3" fill="#28AA6E"/><circle cx="40" cy="23" r="3" fill="#28AA6E"/><text x="25" y="44" text-anchor="middle" font-family="monospace" font-size="9" fill="#5BA8FF">隐藏式磁吸</text></g><g transform="translate(278,154)"><rect x="0" y="4" width="56" height="38" rx="10" fill="#1E3048" stroke="#D69614" stroke-width="1.5"/><text x="28" y="28" text-anchor="middle" font-family="monospace" font-size="14" fill="#D69614" font-weight="600">Mg-Li</text><text x="28" y="54" text-anchor="middle" font-family="monospace" font-size="9" fill="#5BA8FF">镁锂合金</text></g><text x="240" y="266" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">轻量化舒适佩戴 · 铰链+磁吸+材质</text></svg>`,
  "ID-005": `<svg viewBox="0 0 480 280" class="figsvg"><defs><linearGradient id="bg5" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#161E2E"/><stop offset="1" stop-color="#0B1018"/></linearGradient><linearGradient id="ecd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1A2D4A"/><stop offset="1" stop-color="#0A1628"/></linearGradient><linearGradient id="ecl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A5A7A"/><stop offset="1" stop-color="#1A3050"/></linearGradient><radialGradient id="sun" cx="50%" cy="30%"><stop offset="0" stop-color="#F5A623" stop-opacity="0.3"/><stop offset="1" stop-color="#F5A623" stop-opacity="0"/></radialGradient></defs><rect width="480" height="280" rx="18" fill="url(#bg5)"/><ellipse cx="380" cy="60" rx="80" ry="60" fill="url(#sun)"/><ellipse cx="240" cy="255" rx="140" ry="12" fill="#000" opacity="0.3"/><g><rect x="144" y="86" width="78" height="52" rx="16" fill="url(#ecd)" stroke="#0B7CF2" stroke-width="1.5"/><rect x="258" y="86" width="78" height="52" rx="16" fill="url(#ecl)" stroke="#5A82A8" stroke-width="1.5" stroke-dasharray="3 2"/><path d="M222 110 h36" stroke="#6A9BD0" stroke-width="3.5" stroke-linecap="round"/></g><g transform="translate(130,158)"><rect x="0" y="0" width="220" height="64" rx="12" fill="#0B1120" stroke="#0B7CF2" stroke-width="1"/><rect x="12" y="12" width="60" height="18" rx="6" fill="#0B7CF2" opacity="0.15"/><rect x="12" y="38" width="196" height="6" rx="3" fill="#fff" opacity="0.06"/><text x="110" y="56" text-anchor="middle" font-family="monospace" font-size="10" fill="#5BA8FF">透光率 12% · 户外强光模式</text></g><text x="240" y="266" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">电致变色智能镜片 · 一键变暗+防窥</text></svg>`
};

const indexHtml = readFileSync(join(__dirname, 'index.html'), 'utf8');
const navMatch = indexHtml.match(/<nav class="nav"[^>]*>[\s\S]*?<\/nav>/);
const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>\s*<\/head>/);
if (!navMatch || !styleMatch) { console.log('ERROR nav/style'); process.exit(1); }
const NAV = navMatch[0].replace(/<div class="nav-links">[\s\S]*?<\/div>/, '<div class="nav-links"><a class="nav-back" href="index.html"><span class="bk">&larr;</span> 返回白皮书</a></div>');
const STYLE = styleMatch[1];

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function renderValidation(vl){
  const TYPE = { E001:'官方参数', E005:'用户社区', E006:'用户社区', E007:'竞品数据', E008:'竞品数据', E009:'竞品数据', E011:'竞品数据', E012:'用户声音', E013:'行业报告', E014:'行业报告', E015:'用户评测', E016:'用户声音', E017:'官方动态' };
  return vl.map((s,i)=>{
    const evs = s.ev.map(e=>{
      const label = e.r || (e.e ? (TYPE[e.e]||'来源') : '来源');
      return `<li><span class="evref">${esc(label)}</span><span>${esc(e.s)}</span></li>`;
    }).join('');
    return `<div class="vl-step"><div class="stitle"><span class="snum">${i+1}</span>${esc(s.step)}</div><div class="sclaim">${esc(s.claim)}</div><ul class="vl-evlist">${evs}</ul><div class="vl-conclusion">${esc(s.conclusion)}</div></div>`;
  }).join('');
}

function renderMetrics(m){
  return `<div class="metrics">${m.map(x=>`<div class="metric"><div class="mk">${esc(x.k)}</div><div class="mv">${esc(x.v)}</div></div>`).join('')}</div>`;
}

function renderRisks(r){
  const rows = r.map(x=>`<tr><td>${esc(x.r)}</td><td>${esc(x.p)}</td><td>${esc(x.i)}</td><td>${esc(x.m)}</td></tr>`).join('');
  return `<table class="risk"><thead><tr><th>风险</th><th>概率</th><th>影响</th><th>对策</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderTimeline(t){
  return t.map(x=>`<div class="tl-item"><div class="tl-phase">${esc(x.phase)}</div><div class="tl-dur">${esc(x.dur)}</div><div class="tl-d">${esc(x.d)}</div></div>`).join('');
}

function renderPrd(p){
  const tu = p.targetUsers.map(u=>`<li><strong>${esc(u.seg)}</strong> —— ${esc(u.desc)}</li>`).join('');
  const sc = p.scenarios.map(s=>`<div class="sc-item"><div class="sc-name">${esc(s.name)}</div><div class="sc-row"><span class="sc-lab">流程</span><span class="sc-val">${esc(s.flow)}</span></div><div class="sc-row"><span class="sc-lab pain">现状痛点</span><span class="sc-val">${esc(s.pain)}</span></div><div class="sc-row"><span class="sc-lab good">需求价值</span><span class="sc-val">${esc(s.value)}</span></div></div>`).join('');
  const sol = p.solution.map(s=>`<li>${esc(s)}</li>`).join('');
  return `
  <div class="prd-block"><h2><span class="no">1</span>立项决策</h2><div class="decision">${esc(p.decision)}</div></div>
  <div class="prd-block"><h2><span class="no">2</span>项目背景</h2><ul>${p.background.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></div>
  <div class="prd-block"><h2><span class="no">3</span>目标用户</h2><ul>${tu}</ul></div>
  <div class="prd-block"><h2><span class="no">4</span>使用场景</h2>${sc}</div>
  <div class="prd-block"><h2><span class="no">5</span>产品方案</h2><ul>${sol}</ul></div>
  <div class="prd-block"><h2><span class="no">6</span>核心指标</h2>${renderMetrics(p.metrics)}</div>
  <div class="prd-block"><h2><span class="no">7</span>风险与对策</h2>${renderRisks(p.risks)}</div>
  <div class="prd-block"><h2><span class="no">8</span>排期规划</h2><div class="timeline">${renderTimeline(p.timeline)}</div></div>`;
}

function renderGtm(g){
  const aud = g.audience.map(a=>`<div class="gtm-aud"><div class="ga-group">${esc(a.group)}</div><div class="ga-size">${esc(a.size)}</div><div class="ga-insight">${esc(a.insight)}</div></div>`).join('');
  const ch = g.channel.map(c=>`<div class="gtm-ch"><div class="gc-ch">${esc(c.ch)}</div><div class="gc-t">${esc(c.t)}</div></div>`).join('');
  const pr = g.pricing.map(c=>`<div class="gtm-pr"><div class="gp-m">${esc(c.m)}</div><div class="gp-p">${esc(c.p)}</div></div>`).join('');
  const tam = g.tam.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td class="tam-num">${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('');
  const ms = g.milestones.map(m=>`<div class="ms-item"><div class="ms-t">${esc(m.t)}</div><div class="ms-a">${esc(m.a)}</div><div class="ms-k">KPI：${esc(m.k)}</div></div>`).join('');
  return `
  <div class="gtm-section">
    <h2><span class="gno">GTM</span>商业落地策略 · 市场与商业视角</h2>
    <div class="gtm-pos">${esc(g.positioning)}</div>
    <div class="gtm-sub">目标受众与洞察</div><div class="gtm-aud-wrap">${aud}</div>
    <div class="gtm-sub">渠道与打法</div><div class="gtm-ch-wrap">${ch}</div>
    <div class="gtm-sub">定价与变现</div><div class="gtm-pr-wrap">${pr}</div>
    <div class="gtm-sub">市场规模（TAM / SAM / SOM）</div>
    <table class="risk"><thead><tr><th>层级</th><th>细分市场</th><th>规模</th><th>说明</th></tr></thead><tbody>${tam}</tbody></table>
    <div class="gtm-sub">落地节奏与 KPI</div><div class="ms-wrap">${ms}</div>
  </div>`;
}

for (const id of ORDER){
  const d = JSON.parse(readFileSync(join(__dirname,'data-prd',`${id}.json`),'utf8'));
  const vl = renderValidation(d.validationLogic);
  const prd = renderPrd(d.prd);
  const gtm = renderGtm(d.gtm);
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(d.title)} · 需求文档 · 雷鸟创新 RayNeo · AR 智能眼镜产品机会白皮书</title>
<style>
${STYLE}
.doc-hero{padding:64px 0 40px}
.doc-hero .eyebrow{color:var(--signal)}
.doc-hero h1{font-family:var(--font-display);font-size:clamp(30px,4.4vw,46px);font-weight:600;letter-spacing:-.02em;margin:14px 0 10px;color:var(--ink)}
.doc-hero .tagrow{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.doc-tag{font-family:var(--font-mono);font-size:12.5px;padding:6px 13px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line-soft);color:var(--ink-mid)}
.doc-tag.score{background:rgba(11,124,242,.10);color:var(--signal);border-color:var(--signal-line);font-weight:600}
.figure{margin:34px 0;background:linear-gradient(160deg,#10182A,#0B1120);border:1px solid rgba(139,184,238,.18);border-radius:var(--r-lg);padding:18px;box-shadow:0 20px 50px rgba(10,18,34,.35)}
.figsvg{width:100%;height:auto;display:block;border-radius:12px}
.figcap{margin-top:14px;font-size:12.5px;color:#9FB0CC;text-align:center;font-family:var(--font-mono);letter-spacing:.02em}
.nav-back{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--signal);background:rgba(11,124,242,.10);border:1px solid var(--signal-line);padding:8px 16px;border-radius:999px;transition:.25s}
.nav-back:hover{background:rgba(11,124,242,.18);border-color:var(--signal)}
.nav-back .bk{font-size:16px;line-height:1}
.prd-block{background:var(--paper);border:1px solid var(--line-soft);border-radius:var(--r-lg);padding:30px 34px;margin:22px 0;box-shadow:var(--shadow)}
.prd-block h2{font-family:var(--font-display);font-size:23px;font-weight:600;color:var(--ink);margin:0 0 16px;display:flex;align-items:center;gap:12px}
.prd-block h2 .no{font-family:var(--font-mono);font-size:14px;color:var(--signal);background:rgba(11,124,242,.1);border:1px solid var(--signal-line);border-radius:8px;padding:3px 10px}
.prd-block ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:11px}
.prd-block li{font-size:15.5px;color:var(--ink-mid);line-height:1.65}
.prd-block li strong{color:var(--ink)}
.prd-block .decision{font-size:16px;line-height:1.7;color:var(--ink);background:var(--surface-2);border-left:4px solid var(--signal);padding:16px 20px;border-radius:0 10px 10px 0}
.metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.metric{background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:18px}
.metric .mk{font-size:12.5px;color:var(--ink-lo);font-family:var(--font-mono);margin-bottom:8px}
.metric .mv{font-size:15px;color:var(--ink);font-weight:600;line-height:1.45}
table.risk{width:100%;border-collapse:collapse;font-size:14px;margin-top:6px}
table.risk th,table.risk td{border:1px solid var(--line-soft);padding:11px 14px;text-align:left}
table.risk th{background:var(--surface-2);color:var(--ink);font-weight:600;font-family:var(--font-mono);font-size:12.5px}
table.risk td{color:var(--ink-mid)}
.timeline{display:flex;flex-direction:column;gap:12px;margin-top:6px}
.tl-item{display:grid;grid-template-columns:1.3fr .8fr 2fr;gap:14px;align-items:start;padding:14px 18px;background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px}
.tl-phase{font-weight:600;color:var(--ink)}
.tl-dur{font-family:var(--font-mono);font-size:13px;color:var(--signal)}
.tl-d{font-size:14px;color:var(--ink-mid)}
.sc-item{background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:18px 20px;margin-bottom:14px}
.sc-name{font-weight:600;font-size:16px;color:var(--ink);margin-bottom:12px}
.sc-row{display:grid;grid-template-columns:90px 1fr;gap:12px;margin-bottom:8px;align-items:start}
.sc-lab{font-family:var(--font-mono);font-size:12px;color:var(--ink-lo);padding-top:2px}
.sc-lab.pain{color:#D6655A}.sc-lab.good{color:#28AA6E}
.sc-val{font-size:14.5px;color:var(--ink-mid);line-height:1.6}
.vl-section{background:linear-gradient(135deg,#f8fafc,#f0f4f8);border:1px solid var(--line-soft);border-radius:var(--r-lg);padding:32px 36px;margin:24px 0}
.vl-section > .vl-title{font-family:var(--font-display);font-size:25px;font-weight:600;color:var(--ink);margin:0 0 8px;display:flex;align-items:center;gap:12px}
.vl-section > .vl-title .vno{font-family:var(--font-mono);font-size:14px;color:#fff;background:var(--signal);border-radius:8px;padding:4px 11px}
.vl-section > .vl-desc{font-size:14.5px;color:var(--ink-mid);margin:0 0 22px;line-height:1.6}
.vl-step{margin-bottom:26px;padding-bottom:22px;border-bottom:1px solid var(--line-soft)}
.vl-step:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}
.vl-step .stitle{font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--ink);margin-bottom:10px;display:flex;align-items:center;gap:10px}
.vl-step .stitle .snum{font-family:var(--font-mono);font-size:12px;background:var(--signal);color:#fff;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.vl-step .sclaim{font-size:15.5px;color:var(--ink);line-height:1.65;margin-bottom:12px;padding-left:34px}
.vl-evlist{margin:0 0 0 34px;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.vl-evlist li{font-size:14px;color:var(--ink-mid);line-height:1.55;display:flex;gap:8px;align-items:flex-start}
.vl-evlist li .evtag{font-family:var(--font-mono);font-size:11.5px;color:#fff;background:var(--signal);padding:2px 8px;border-radius:4px;flex-shrink:0;height:fit-content}
.vl-evlist li .evref{font-family:var(--font-mono);font-size:11.5px;color:var(--ink-lo);flex-shrink:0;height:fit-content}
.vl-conclusion{font-size:14.5px;color:var(--ink);line-height:1.6;background:var(--paper);border-left:3px solid #28AA6E;padding:12px 16px;margin:8px 0 0 34px;border-radius:0 8px 8px 0}
.gtm-section{background:var(--paper);border:1px solid var(--line-soft);border-radius:var(--r-lg);padding:32px 36px;margin:24px 0;box-shadow:var(--shadow)}
.gtm-section h2{font-family:var(--font-display);font-size:23px;font-weight:600;color:var(--ink);margin:0 0 16px;display:flex;align-items:center;gap:12px}
.gtm-section h2 .gno{font-family:var(--font-mono);font-size:14px;color:#D69614;background:rgba(214,150,20,.10);border:1px solid rgba(214,150,20,.3);border-radius:8px;padding:3px 10px}
.gtm-pos{font-size:16px;line-height:1.65;color:var(--ink);background:rgba(214,150,20,.06);border-left:4px solid #D69614;padding:16px 20px;border-radius:0 10px 10px 0;margin-bottom:8px}
.gtm-sub{font-size:16px;font-weight:600;color:var(--ink);margin:22px 0 12px}
.gtm-aud-wrap{display:flex;flex-direction:column;gap:12px}
.gtm-aud{background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:16px 20px}
.ga-group{font-weight:600;color:var(--ink);font-size:15.5px}
.ga-size{font-family:var(--font-mono);font-size:13px;color:var(--signal);margin:5px 0}
.ga-insight{font-size:14px;color:var(--ink-mid);line-height:1.55}
.gtm-ch-wrap,.gtm-pr-wrap{display:flex;flex-direction:column;gap:10px}
.gtm-ch{display:grid;grid-template-columns:1.2fr 2fr;gap:14px;background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:14px 18px}
.gc-ch{font-weight:600;color:var(--ink)}
.gc-t{font-size:14px;color:var(--ink-mid);line-height:1.55}
.gtm-pr{display:grid;grid-template-columns:1.2fr 2fr;gap:14px;background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:14px 18px}
.gp-m{font-weight:600;color:var(--ink)}
.gp-p{font-size:14px;color:var(--ink-mid);line-height:1.55}
table.risk .tam-num{font-family:var(--font-mono);font-weight:600;color:var(--ink)}
.ms-wrap{display:flex;flex-direction:column;gap:12px}
.ms-item{display:grid;grid-template-columns:70px 1fr;gap:14px;background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:14px 18px}
.ms-t{font-family:var(--font-mono);font-weight:600;color:#D69614}
.ms-a{font-size:14.5px;color:var(--ink)}
.ms-k{font-size:13px;color:var(--ink-lo);margin-top:4px}
.pill-nav{display:flex;gap:9px;flex-wrap:wrap;margin:34px 0 0;padding-top:22px;border-top:1px solid var(--line-soft)}
.pill-nav a{font-size:13px;padding:7px 14px;border-radius:999px;border:1px solid var(--line-soft);background:var(--paper);color:var(--ink-mid);text-decoration:none;transition:.25s}
.pill-nav a:hover{border-color:var(--signal);color:var(--signal)}
</style>
</head>
<body>
${NAV}
<main class="container">
  <section class="doc-hero">
    <div class="eyebrow">TOP5 产品需求 · 需求文档</div>
    <h1>${esc(d.title)}</h1>
    <div class="tagrow">
      <span class="doc-tag">${esc(d.tag)}</span>
      <span class="doc-tag score">综合分 ${d.score}</span>
      <span class="doc-tag">需求编号 ${esc(d.id)}</span>
    </div>
  </section>
  <div class="figure">${FIG[d.figSvg]}<div class="figcap">${esc(d.title)} · 产品形态示意</div></div>

  <section class="vl-section">
    <div class="vl-title"><span class="vno">V</span>需求验证逻辑</div>
    <p class="vl-desc">为什么这个需求成立？下列四个维度交叉验证，每一环均有可追溯证据支撑，形成完整逻辑闭环。</p>
    ${vl}
  </section>

  <section>
    <div class="vl-title" style="font-family:var(--font-display);font-size:25px;font-weight:600;color:var(--ink);margin:34px 0 4px;display:flex;align-items:center;gap:12px"><span class="vno" style="font-family:var(--font-mono);font-size:14px;color:#fff;background:var(--signal);border-radius:8px;padding:4px 11px">PRD</span>产品需求文档</div>
    <p style="font-size:14.5px;color:var(--ink-mid);margin:0 0 8px;line-height:1.6"><strong>视角：产品岗</strong> —— 回答「做什么、为什么做、怎么做、做到什么程度」。</p>
    ${prd}
  </section>

  <section>
    ${gtm}
  </section>

  <nav class="pill-nav">
    ${ORDER.filter(x=>x!==id).map(x=>`<a href="prd-${x}.html">查看 ${x} 需求文档 →</a>`).join('')}
  </nav>
</main>
<footer class="footer"><div class="container"><p>雷鸟创新 RayNeo · AR 智能眼镜产品机会白皮书 · 需求文档由产品机会挖掘框架自动生成</p></div></footer>
</body>
</html>`;
  writeFileSync(join(__dirname,`prd-${id}.html`), html, 'utf8');
  console.log('generated prd-' + id + '.html');
}
console.log('ALL DONE');
