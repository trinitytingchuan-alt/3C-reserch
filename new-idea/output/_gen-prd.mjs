// 生成 5 个 TOP5 独立 PRD 二级页（仿历史完整版写法 + 强关联实物 SVG 图）
import { readFileSync, writeFileSync } from 'node:fs';

const idx = readFileSync('index.html', 'utf8');
const style = idx.match(/<style>([\s\S]*?)<\/style>/)[1];
const navHtml = idx.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0];
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

// 强关联实物 SVG 图（线稿实物图，零失效、与功能强相关）
const FIG = {
  'ID-001': `<svg viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <rect x="0" y="0" width="480" height="240" rx="16" fill="#F4F7FB"/>
    <!-- 眼镜主体 -->
    <g stroke="#1A2B4A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 96 h60 q10 -2 18 6 q8 -8 18 -6 h60"/>
      <rect x="120" y="86" width="52" height="34" rx="10" fill="#fff"/>
      <rect x="308" y="86" width="52" height="34" rx="10" fill="#fff"/>
      <rect x="128" y="93" width="36" height="20" rx="5" fill="#0B7CF2" opacity="0.18"/>
      <rect x="316" y="93" width="36" height="20" rx="5" fill="#0B7CF2" opacity="0.18"/>
    </g>
    <!-- 颈挂磁吸电池模组 -->
    <g stroke="#0B7CF2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M170 200 q70 34 140 0" fill="none"/>
      <rect x="150" y="184" width="60" height="26" rx="9" fill="#E8F2FE"/>
      <rect x="270" y="184" width="60" height="26" rx="9" fill="#E8F2FE"/>
    </g>
    <!-- 磁吸连接线 -->
    <g stroke="#9BB4D6" stroke-width="2.4" stroke-dasharray="4 5">
      <path d="M180 130 q-8 28 -6 54"/>
      <path d="M300 130 q8 28 6 54"/>
    </g>
    <text x="240" y="232" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">颈挂磁吸电池 · 主体保持无绳</text>
  </svg>`,
  'ID-002': `<svg viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <rect x="0" y="0" width="480" height="240" rx="16" fill="#F4F7FB"/>
    <!-- 眼镜第一视角取景框 -->
    <g stroke="#1A2B4A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M120 100 h70 q10 -2 18 6 q8 -8 18 -6 h70"/>
      <rect x="92" y="90" width="56" height="36" rx="10" fill="#fff"/>
      <rect x="332" y="90" width="56" height="36" rx="10" fill="#fff"/>
      <circle cx="120" cy="108" r="6" fill="#0B7CF2"/>
    </g>
    <!-- 取景框视线 -->
    <g stroke="#0B7CF2" stroke-width="2.4" stroke-dasharray="5 5">
      <path d="M120 110 l-50 40"/>
    </g>
    <rect x="56" y="146" width="64" height="44" rx="8" fill="#E8F2FE" stroke="#0B7CF2" stroke-width="2"/>
    <text x="88" y="168" text-anchor="middle" font-family="monospace" font-size="11" fill="#0B7CF2">取景</text>
    <text x="88" y="182" text-anchor="middle" font-family="monospace" font-size="11" fill="#0B7CF2">REC</text>
    <!-- 实时翻译字幕气泡 -->
    <g>
      <rect x="210" y="150" width="210" height="58" rx="12" fill="#fff" stroke="#1A2B4A" stroke-width="2"/>
      <path d="M236 150 l-12 0 l12 -14 z" fill="#fff" stroke="#1A2B4A" stroke-width="2"/>
      <text x="315" y="174" text-anchor="middle" font-family="monospace" font-size="13" fill="#1A2B4A">“前方左转 200 米”</text>
      <text x="315" y="194" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">Turn left in 200m</text>
    </g>
    <text x="240" y="232" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">第一视角拍摄 + 同声传译字幕</text>
  </svg>`,
  'ID-003': `<svg viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <rect x="0" y="0" width="480" height="240" rx="16" fill="#F4F7FB"/>
    <!-- 眼镜轻量化剖视 -->
    <g stroke="#1A2B4A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 92 h60 q10 -2 18 6 q8 -8 18 -6 h60"/>
      <rect x="120" y="82" width="54" height="36" rx="11" fill="#fff"/>
      <rect x="306" y="82" width="54" height="36" rx="11" fill="#fff"/>
      <!-- 铰链 -->
      <circle cx="174" cy="92" r="6" fill="#0B7CF2"/>
      <circle cx="306" cy="92" r="6" fill="#0B7CF2"/>
    </g>
    <!-- 重量标注 -->
    <g stroke="#0B7CF2" stroke-width="2" stroke-dasharray="4 4">
      <path d="M120 130 v22"/><path d="M360 130 v22"/>
    </g>
    <text x="240" y="160" text-anchor="middle" font-family="monospace" font-size="13" fill="#0B7CF2">≈ 60g 级</text>
    <!-- 前后配重示意 -->
    <rect x="120" y="118" width="20" height="10" rx="3" fill="#28AA6E"/>
    <rect x="340" y="118" width="20" height="10" rx="3" fill="#28AA6E"/>
    <text x="240" y="200" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">重构铰链 + 前后配重 · 全天无感佩戴</text>
    <!-- 散热 -->
    <g stroke="#D69614" stroke-width="2"><path d="M240 82 v-14"/><path d="M232 70 h16"/></g>
  </svg>`,
  'ID-005': `<svg viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <rect x="0" y="0" width="480" height="240" rx="16" fill="#F4F7FB"/>
    <!-- 左：户外强光（亮） -->
    <g>
      <rect x="60" y="70" width="120" height="80" rx="14" fill="#fff" stroke="#1A2B4A" stroke-width="3"/>
      <circle cx="120" cy="110" r="22" fill="#FFD45E" opacity="0.5"/>
      <text x="120" y="178" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">户外强光 · 可读</text>
    </g>
    <!-- 右：室内防窥（暗） -->
    <g>
      <rect x="300" y="70" width="120" height="80" rx="14" fill="#2A3550" stroke="#1A2B4A" stroke-width="3"/>
      <circle cx="360" cy="110" r="22" fill="#0B7CF2" opacity="0.35"/>
      <text x="360" y="178" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">室内防窥 · 变暗</text>
    </g>
    <!-- 电致变色切换箭头 -->
    <g stroke="#0B7CF2" stroke-width="2.6" stroke-linecap="round">
      <path d="M200 110 h80"/><path d="M268 100 l14 10 -14 10"/>
    </g>
    <text x="240" y="210" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">一键电致变色 · 透光率可调 + 防窥</text>
  </svg>`,
  'ID-006': `<svg viewBox="0 0 480 240" fill="none" xmlns="http://www.w3.org/2000/svg" class="figsvg">
    <rect x="0" y="0" width="480" height="240" rx="16" fill="#F4F7FB"/>
    <!-- 眼镜屏显示 App 网格 -->
    <g stroke="#1A2B4A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M150 96 h60 q10 -2 18 6 q8 -8 18 -6 h60"/>
      <rect x="120" y="86" width="54" height="36" rx="11" fill="#fff"/>
      <rect x="306" y="86" width="54" height="36" rx="11" fill="#fff"/>
    </g>
    <rect x="138" y="95" width="18" height="18" rx="4" fill="#0B7CF2" opacity="0.25"/>
    <rect x="338" y="95" width="18" height="18" rx="4" fill="#28AA6E" opacity="0.25"/>
    <!-- 悬浮 App 网格 -->
    <g>
      <rect x="170" y="150" width="42" height="42" rx="10" fill="#fff" stroke="#1A2B4A" stroke-width="2.2"/>
      <rect x="220" y="150" width="42" height="42" rx="10" fill="#E8F2FE" stroke="#0B7CF2" stroke-width="2.2"/>
      <rect x="270" y="150" width="42" height="42" rx="10" fill="#fff" stroke="#1A2B4A" stroke-width="2.2"/>
      <rect x="320" y="150" width="42" height="42" rx="10" fill="#fff" stroke="#1A2B4A" stroke-width="2.2"/>
      <circle cx="191" cy="171" r="6" fill="#0B7CF2"/>
      <text x="241" y="176" text-anchor="middle" font-family="monospace" font-size="11" fill="#0B7CF2">VM</text>
      <circle cx="291" cy="171" r="6" fill="#28AA6E"/>
      <circle cx="341" cy="171" r="6" fill="#D69614"/>
    </g>
    <text x="248" y="212" text-anchor="middle" font-family="monospace" font-size="12" fill="#5A6B85">RayNeo VM 开放应用商店 · 空间计算 SDK</text>
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
.figure{margin:34px 0;background:var(--paper);border:1px solid var(--line-soft);border-radius:var(--r-lg);padding:22px;box-shadow:var(--shadow)}
.figsvg{width:100%;height:auto;display:block}
.figcap{margin-top:12px;font-size:13px;color:var(--ink-lo);text-align:center;font-family:var(--font-mono)}
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
