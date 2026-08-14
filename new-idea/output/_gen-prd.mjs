// 生成 5 个 TOP5 独立 PRD 二级页（仿历史完整版写法 + 强关联实物 SVG 图）
import { readFileSync, writeFileSync } from 'node:fs';

const idx = readFileSync('index.html', 'utf8');
const style = idx.match(/<style>([\s\S]*?)<\/style>/)[1];
const navHtml = idx.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0]
  .replace(/<div class="nav-links">[\s\S]*?<\/div>/,
    '<div class="nav-links"><a class="nav-back" href="index.html"><span class="bk">←</span> 返回白皮书</a></div>');
const footerHtml = idx.match(/<footer class="footer wrap">[\s\S]*?<\/footer>/)[0];

// 抽取历史完整版 f6584e6 的 PRDS 真实数据（大厂 PRD 写法权威来源，已预提取为 UTF-8 JSON）
const PRDS = JSON.parse(readFileSync('prds-extract.json', 'utf8'));

const TITLE = '雷鸟创新 RayNeo · AR 智能眼镜产品机会白皮书';

// 需求标题与一级维度（用于导航/面包屑）
const META = {
  'ID-001': { name:'长时无绳续航模组', tag:'续航 · 硬件形态', dim:'strategic', score:'90.8' },
  'ID-002': { name:'AI 第一视角拍摄 + 实时翻译', tag:'AI 拍摄 · 交互', dim:'competitor', score:'91.2' },
  'ID-003': { name:'轻量化全天佩戴', tag:'佩戴 · 舒适', dim:'user', score:'90.5' },
  'ID-005': { name:'波导电致变色防窥', tag:'光学 · 隐私', dim:'competitor', score:'90.3' },
  'ID-006': { name:'RayNeo VM 开放应用生态', tag:'生态 · 空间计算', dim:'strategic', score:'90.6' }
};

// 强关联实物产品渲染图（大疆级：深色高级背景 + 产品渐变质感 + 高光投影，零失效）
const FIG = {
  'ID-001': `<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <defs>
      <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2536"/><stop offset="1" stop-color="#0E1420"/></linearGradient>
      <linearGradient id="gl1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A4A66"/><stop offset="1" stop-color="#11233F"/></linearGradient>
      <linearGradient id="bat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E3A52"/><stop offset="1" stop-color="#1A2233"/></linearGradient>
      <radialGradient id="gl" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#5BA8FF" stop-opacity="0.9"/><stop offset="1" stop-color="#0B7CF2" stop-opacity="0.15"/></radialGradient>
    </defs>
    <rect width="480" height="280" rx="18" fill="url(#bg1)"/>
    <ellipse cx="240" cy="250" rx="150" ry="16" fill="#000" opacity="0.35"/>
    <!-- 眼镜主体：镜片玻璃质感 -->
    <g>
      <rect x="150" y="96" width="74" height="50" rx="16" fill="url(#gl)" stroke="#8FB8EE" stroke-width="1.5"/>
      <rect x="256" y="96" width="74" height="50" rx="16" fill="url(#gl)" stroke="#8FB8EE" stroke-width="1.5"/>
      <path d="M224 116 h32" stroke="#9BB4D6" stroke-width="4" stroke-linecap="round"/>
      <path d="M150 116 q-22 -4 -34 6" stroke="#9BB4D6" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M330 116 q22 -4 34 6" stroke="#9BB4D6" stroke-width="4" fill="none" stroke-linecap="round"/>
      <rect x="156" y="102" width="22" height="10" rx="5" fill="#fff" opacity="0.55"/>
    </g>
    <!-- 颈挂磁吸电池模组（金属质感） -->
    <g>
      <path d="M178 196 q62 30 124 0" stroke="#6E7C95" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.6"/>
      <rect x="150" y="180" width="64" height="34" rx="12" fill="url(#bat)" stroke="#5A6B85" stroke-width="1.2"/>
      <rect x="266" y="180" width="64" height="34" rx="12" fill="url(#bat)" stroke="#5A6B85" stroke-width="1.2"/>
      <rect x="158" y="187" width="20" height="6" rx="3" fill="#0B7CF2" opacity="0.8"/>
      <rect x="274" y="187" width="20" height="6" rx="3" fill="#0B7CF2" opacity="0.8"/>
    </g>
    <text x="240" y="266" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBed8" letter-spacing="1">颈挂磁吸电池 · 主体保持无绳轻盈</text>
  </svg>`,
  'ID-002': `<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15233B"/><stop offset="1" stop-color="#0B1422"/></linearGradient>
      <linearGradient id="lens2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A3D5E"/><stop offset="1" stop-color="#0B1C38"/></linearGradient>
    </defs>
    <rect width="480" height="280" rx="18" fill="url(#bg2)"/>
    <ellipse cx="240" cy="252" rx="150" ry="15" fill="#000" opacity="0.35"/>
    <!-- 眼镜第一视角 -->
    <g>
      <rect x="146" y="92" width="78" height="52" rx="16" fill="url(#lens2)" stroke="#8FB8EE" stroke-width="1.5"/>
      <rect x="256" y="92" width="78" height="52" rx="16" fill="url(#lens2)" stroke="#8FB8EE" stroke-width="1.5"/>
      <path d="M224 116 h32" stroke="#9BB4D6" stroke-width="4" stroke-linecap="round"/>
      <circle cx="185" cy="118" r="7" fill="#0B7CF2"/>
      <circle cx="185" cy="118" r="12" fill="none" stroke="#0B7CF2" stroke-width="1.5" opacity="0.5"/>
    </g>
    <!-- 取景窗 -->
    <g>
      <rect x="60" y="178" width="70" height="48" rx="9" fill="#0E1B30" stroke="#0B7CF2" stroke-width="2"/>
      <path d="M70 188 h50 M70 202 h34" stroke="#3A6EA5" stroke-width="2" opacity="0.7"/>
      <text x="95" y="240" text-anchor="middle" font-family="monospace" font-size="11" fill="#5BA8FF">REC · 第一视角</text>
    </g>
    <!-- 实时翻译字幕条 -->
    <g>
      <rect x="178" y="184" width="240" height="44" rx="12" fill="#fff"/>
      <rect x="178" y="184" width="6" height="44" rx="3" fill="#0B7CF2"/>
      <text x="320" y="206" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#1A2B4A" font-weight="600">前方路口左转 200 米</text>
      <text x="320" y="222" text-anchor="middle" font-family="monospace" font-size="11.5" fill="#5A6B85">Turn left at the junction, 200m</text>
    </g>
    <text x="240" y="268" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">AI 第一视角拍摄 + 同声传译字幕</text>
  </svg>`,
  'ID-003': `<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <defs>
      <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A2436"/><stop offset="1" stop-color="#0D1320"/></linearGradient>
      <linearGradient id="fr3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A566E"/><stop offset="1" stop-color="#222C3E"/></linearGradient>
    </defs>
    <rect width="480" height="280" rx="18" fill="url(#bg3)"/>
    <ellipse cx="240" cy="248" rx="140" ry="14" fill="#000" opacity="0.3"/>
    <!-- 轻量眼镜特写 -->
    <g>
      <rect x="150" y="98" width="76" height="50" rx="18" fill="url(#fr3)" stroke="#7E8DA8" stroke-width="1.5"/>
      <rect x="254" y="98" width="76" height="50" rx="18" fill="url(#fr3)" stroke="#7E8DA8" stroke-width="1.5"/>
      <path d="M226 120 h28" stroke="#9AA8C0" stroke-width="5" stroke-linecap="round"/>
      <circle cx="150" cy="120" r="9" fill="#0B7CF2"/>
      <circle cx="330" cy="120" r="9" fill="#0B7CF2"/>
      <rect x="158" y="104" width="20" height="8" rx="4" fill="#fff" opacity="0.5"/>
    </g>
    <!-- 重量标签 -->
    <g>
      <rect x="196" y="172" width="88" height="34" rx="17" fill="rgba(11,124,242,0.16)" stroke="#0B7CF2" stroke-width="1.4"/>
      <text x="240" y="194" text-anchor="middle" font-family="monospace" font-size="15" fill="#5BA8FF" font-weight="600">≈ 60g 级</text>
    </g>
    <text x="240" y="262" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">钛合金骨架 + 前后配重 · 全天无感佩戴</text>
  </svg>`,
  'ID-005': `<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <defs>
      <linearGradient id="bg5" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#13263F"/><stop offset="1" stop-color="#0A1322"/></linearGradient>
      <linearGradient id="lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE0FF"/><stop offset="1" stop-color="#7FB4EF"/></linearGradient>
      <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A3550"/><stop offset="1" stop-color="#161E30"/></linearGradient>
    </defs>
    <rect width="480" height="280" rx="18" fill="url(#bg5)"/>
    <ellipse cx="240" cy="250" rx="150" ry="14" fill="#000" opacity="0.3"/>
    <!-- 左：户外强光（亮镜片） -->
    <g>
      <rect x="70" y="86" width="120" height="56" rx="18" fill="url(#lit)" stroke="#9FC8F5" stroke-width="1.5"/>
      <circle cx="130" cy="114" r="13" fill="#FFE08A" opacity="0.85"/>
      <text x="130" y="170" text-anchor="middle" font-family="monospace" font-size="11.5" fill="#AEBED8">户外强光 · 通透可读</text>
    </g>
    <!-- 右：室内防窥（暗镜片） -->
    <g>
      <rect x="290" y="86" width="120" height="56" rx="18" fill="url(#dark)" stroke="#5A6B85" stroke-width="1.5"/>
      <circle cx="350" cy="114" r="13" fill="#0B7CF2" opacity="0.5"/>
      <text x="350" y="170" text-anchor="middle" font-family="monospace" font-size="11.5" fill="#AEBED8">室内防窥 · 一键变暗</text>
    </g>
    <!-- 电致变色切换 -->
    <g stroke="#5BA8FF" stroke-width="3" stroke-linecap="round"><path d="M200 114 h80"/><path d="M268 104 l16 10 -16 10"/></g>
    <text x="240" y="262" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">波导电致变色 · 透光率可调 + 防窥</text>
  </svg>`,
  'ID-006': `<svg viewBox="0 0 480 280" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <defs>
      <linearGradient id="bg6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15203A"/><stop offset="1" stop-color="#0B1222"/></linearGradient>
      <linearGradient id="lens6" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#27406A"/><stop offset="1" stop-color="#0C1E3C"/></linearGradient>
    </defs>
    <rect width="480" height="280" rx="18" fill="url(#bg6)"/>
    <ellipse cx="240" cy="250" rx="150" ry="14" fill="#000" opacity="0.3"/>
    <!-- 眼镜 -->
    <g>
      <rect x="150" y="92" width="74" height="50" rx="16" fill="url(#lens6)" stroke="#8FB8EE" stroke-width="1.5"/>
      <rect x="256" y="92" width="74" height="50" rx="16" fill="url(#lens6)" stroke="#8FB8EE" stroke-width="1.5"/>
      <path d="M224 116 h32" stroke="#9BB4D6" stroke-width="4" stroke-linecap="round"/>
    </g>
    <!-- 悬浮 App 网格（空间 UI） -->
    <g>
      <rect x="170" y="166" width="44" height="44" rx="11" fill="#16243F" stroke="#3A6EA5" stroke-width="1.3"/>
      <rect x="222" y="166" width="44" height="44" rx="11" fill="#0B7CF2" opacity="0.85"/>
      <rect x="274" y="166" width="44" height="44" rx="11" fill="#16243F" stroke="#3A6EA5" stroke-width="1.3"/>
      <rect x="326" y="166" width="44" height="44" rx="11" fill="#16243F" stroke="#3A6EA5" stroke-width="1.3"/>
      <text x="244" y="193" text-anchor="middle" font-family="monospace" font-size="13" fill="#fff" font-weight="600">VM</text>
      <circle cx="192" cy="188" r="6" fill="#5BA8FF"/><circle cx="296" cy="188" r="6" fill="#28AA6E"/><circle cx="348" cy="188" r="6" fill="#D69614"/>
    </g>
    <text x="240" y="262" text-anchor="middle" font-family="monospace" font-size="12.5" fill="#AEBED8" letter-spacing="1">RayNeo VM 开放应用商店 · 空间计算 SDK</text>
  </svg>`
};

function esc(s){ return s; }

function buildPrd(id){
  const p = PRDS[id];
  const m = META[id];
  const fig = FIG[id];
  const evNums = (p.decision.match(/E\d{3}/g)||[]).concat(p.background.join(' ').match(/E\d{3}/g)||[]);
  const evUniq = [...new Set(evNums)];
  const bg = p.background.map(t=>`<li>${t}</li>`).join('');
  const us = p.users.map(t=>`<li>${t}</li>`).join('');
  const sc = p.scenarios.map(t=>`<li>${t}</li>`).join('');
  const so = p.solution.map(t=>`<li>${t}</li>`).join('');
  const mt = p.metrics.map(o=>`<div class="metric"><div class="mk">${o.k}</div><div class="mv">${o.v}</div></div>`).join('');
  const rk = p.risks.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  const tl = p.timeline.map(t=>`<li>${t}</li>`).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${m.name} · 需求文档 · ${TITLE}</title>
<style>${style}</style>
<style>
.doc-hero{padding:64px 0 40px}
.doc-hero .eyebrow{color:var(--signal)}
.doc-hero h1{font-family:var(--font-display);font-size:clamp(30px,4.4vw,46px);font-weight:600;letter-spacing:-.02em;margin:14px 0 10px;color:var(--ink)}
.doc-hero .tagrow{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.doc-tag{font-family:var(--font-mono);font-size:12.5px;padding:6px 13px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line-soft);color:var(--ink-mid)}
.doc-tag.score{background:rgba(11,124,242,.10);color:var(--signal);border-color:var(--signal-line);font-weight:600}
.figure{margin:34px 0;background:linear-gradient(160deg,#10182A,#0B1120);border:1px solid rgba(139,184,238,.18);border-radius:var(--r-lg);padding:18px;box-shadow:0 20px 50px rgba(10,18,34,.35)}
.figsvg{width:100%;height:auto;display:block;border-radius:12px}
.figcap{margin-top:14px;font-size:12.5px;color:#9FB0CC;text-align:center;font-family:var(--font-mono);letter-spacing:.02em}
.nav-back{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--signal);background:rgba(11,124,242,.10);border:1px solid var(--signal-line);padding:8px 16px;border-radius:999px;transition:background .25s,border-color .25s}
.nav-back:hover{background:rgba(11,124,242,.18);border-color:var(--signal)}
.nav-back .bk{font-size:16px;line-height:1}
.prd-block{background:var(--paper);border:1px solid var(--line-soft);border-radius:var(--r-lg);padding:30px 34px;margin:22px 0;box-shadow:var(--shadow)}
.prd-block h2{font-family:var(--font-display);font-size:23px;font-weight:600;color:var(--ink);margin:0 0 16px;display:flex;align-items:center;gap:12px}
.prd-block h2 .no{font-family:var(--font-mono);font-size:14px;color:var(--signal);background:rgba(11,124,242,.1);border:1px solid var(--signal-line);border-radius:8px;padding:3px 10px}
.prd-block ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:11px}
.prd-block li{font-size:15.5px;color:var(--ink-mid);line-height:1.65}
.prd-block .decision{font-size:16px;line-height:1.7;color:var(--ink);background:var(--surface-2);border-left:4px solid var(--signal);padding:16px 20px;border-radius:0 10px 10px 0}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.metric{background:var(--surface-2);border:1px solid var(--line-soft);border-radius:12px;padding:18px}
.metric .mk{font-size:12.5px;color:var(--ink-lo);font-family:var(--font-mono);margin-bottom:8px}
.metric .mv{font-size:15px;color:var(--ink);font-weight:600;line-height:1.45}
table.risk{width:100%;border-collapse:collapse;font-size:14px}
table.risk th,table.risk td{border:1px solid var(--line-soft);padding:11px 14px;text-align:left}
table.risk th{background:var(--surface-2);color:var(--ink);font-weight:600;font-family:var(--font-mono);font-size:12.5px}
table.risk td{color:var(--ink-mid)}
.evcover{background:rgba(11,124,242,.06);border:1px solid var(--signal-line);border-radius:12px;padding:18px 22px;margin-top:8px}
.evcover .lab{font-family:var(--font-mono);font-size:12px;color:var(--signal);margin-bottom:8px}
.evcover .nums{font-size:16px;color:var(--ink);font-weight:600;letter-spacing:.04em}
.backprd{display:inline-flex;align-items:center;gap:7px;margin-top:30px;font-weight:600;color:var(--signal);text-decoration:none;font-size:15px}
.pill-nav{display:flex;gap:9px;flex-wrap:wrap;margin:34px 0 0;padding-top:22px;border-top:1px solid var(--line-soft)}
.pill-nav a{font-size:13px;padding:7px 14px;border-radius:999px;border:1px solid var(--line-soft);background:var(--paper);color:var(--ink-mid);text-decoration:none;transition:.25s}
.pill-nav a:hover{border-color:var(--signal);color:var(--signal)}
</style>
</head>
<body>
${navHtml}
<header class="hero doc-hero">
  <div class="wrap">
    <span class="eyebrow">PRD · 产品需求文档 · ${id}</span>
    <h1>${m.name}</h1>
    <div class="tagrow">
      <span class="doc-tag">${m.tag}</span>
      <span class="doc-tag">一级维度：${m.dim}</span>
      <span class="doc-tag score">综合分 ${m.score} / 100</span>
    </div>
  </div>
</header>
<section class="section wrap">
  <!-- 主实物图 -->
  <div class="figure">
    ${fig}
    <div class="figcap">图 1 · ${m.name}功能示意（自绘实物线稿）</div>
  </div>

  <!-- 决策结论 -->
  <div class="prd-block">
    <h2><span class="no">00</span>立项决策</h2>
    <div class="decision">${p.decision}</div>
  </div>

  <!-- 背景 -->
  <div class="prd-block">
    <h2><span class="no">01</span>背景与问题</h2>
    <ul>${bg}</ul>
  </div>

  <!-- 目标用户 -->
  <div class="prd-block">
    <h2><span class="no">02</span>目标用户</h2>
    <ul>${us}</ul>
  </div>

  <!-- 使用场景 -->
  <div class="prd-block">
    <h2><span class="no">03</span>使用场景</h2>
    <ul>${sc}</ul>
  </div>

  <!-- 方案 -->
  <div class="prd-block">
    <h2><span class="no">04</span>产品方案</h2>
    <ul>${so}</ul>
  </div>

  <!-- 指标 -->
  <div class="prd-block">
    <h2><span class="no">05</span>核心指标</h2>
    <div class="metrics">${mt}</div>
  </div>

  <!-- 风险 -->
  <div class="prd-block">
    <h2><span class="no">06</span>风险与对策</h2>
    <table class="risk"><thead><tr><th>风险项</th><th>概率</th><th>影响</th><th>对策</th></tr></thead><tbody>${rk}</tbody></table>
  </div>

  <!-- 排期 -->
  <div class="prd-block">
    <h2><span class="no">07</span>排期</h2>
    <ul>${tl}</ul>
  </div>

  <!-- 证据覆盖 -->
  <div class="prd-block">
    <h2><span class="no">08</span>证据覆盖</h2>
    <div class="evcover">
      <div class="lab">支撑证据（点击跳转证据链二级页查看详情）</div>
      <div class="nums">${evUniq.join(' · ')}</div>
    </div>
    <a class="backprd" href="evidence-${m.dim}.html">查看 ${m.dim} 维度全量证据 →</a>
  </div>

  <div class="pill-nav">
    ${Object.keys(META).filter(k=>k!==id).map(k=>`<a href="prd-${k}.html">${META[k].name}</a>`).join('')}
    <a href="index.html">← 返回白皮书</a>
  </div>
</section>
${footerHtml}
</body>
</html>`;
}

for(const id of Object.keys(META)){
  writeFileSync(`prd-${id}.html`, buildPrd(id));
  console.log('generated prd-'+id+'.html');
}
