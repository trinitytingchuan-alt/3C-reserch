// 生成 4 个证据维度二级页（evidence-<dim>.html）
import { readFileSync, writeFileSync } from 'node:fs';

const idx = readFileSync('index.html', 'utf8');

// 抽取 <style> 与 <nav> 与 <footer> 结构
const style = idx.match(/<style>([\s\S]*?)<\/style>/)[1];
const navHtml = idx.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0]
  .replace(/<div class="nav-links">[\s\S]*?<\/div>/,
    '<div class="nav-links"><a class="nav-back" href="index.html"><span class="bk">←</span> 返回白皮书</a></div>');
const footerHtml = idx.match(/<footer class="footer wrap">[\s\S]*?<\/footer>/)[0];

// 抽取 EVI 数据
const eviBlock = idx.match(/const EVI = \[([\s\S]*?)\];/)[1];
const EVI = [...eviBlock.matchAll(/\[([^\]]*)\]/g)].map(m =>
  m[1].split(',').map(s => s.trim().replace(/^"|"$/g, ''))
);

// 维度定义
const DIM_DEF = {
  market:    { name:'市场与行业',   cls:'dim-m', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 17l5-5 4 3 6-7"/><path d="M3 21h18"/></svg>', desc:'市场规模、增速、格局与融资背书' },
  competitor:{ name:'竞品动态',     cls:'dim-c', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 8L11 16M16.5 8L13 16M8 6h8"/></svg>', desc:'头部竞品功能动作与对标缺口' },
  user:      { name:'用户需求',     cls:'dim-u', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>', desc:'核心场景、痛点与付费意愿' },
  strategic: { name:'战略与合规',   cls:'dim-s', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>', desc:'技术护城河、生态与监管约束' }
};
const DIM_MAP = {
  '行业验证':'market', '市场化':'market',
  '竞品验证':'competitor',
  '用户声音':'user',
  '战略验证':'strategic', '技术验证':'strategic'
};
const DIM_OVERRIDE = { E009:'competitor' };

const TITLE = '雷鸟创新 RayNeo · AR 智能眼镜产品机会白皮书';

function buildPage(dk){
  const def = DIM_DEF[dk];
  const list = EVI.map(e => ({id:e[0],tag:e[1],sum:e[2],src:e[3],url:e[4],dim:DIM_OVERRIDE[e[0]]||DIM_MAP[e[1]]||'strategic'}))
                  .filter(e => e.dim===dk);
  const rows = list.map(e => `
    <div class="evrow" id="ev-${e.id}">
      <div class="evrow-head"><span class="eid">${e.id}</span><span class="etag">${e.tag}</span></div>
      <p class="evrow-sum">${e.sum}</p>
      <div class="evrow-src"><span class="arrow">↗</span><a href="${e.url}" target="_blank" rel="noopener">${e.src}</a></div>
    </div>`).join('');

  const others = Object.keys(DIM_DEF).filter(k=>k!==dk)
    .map(k=>`<a class="dim-pill" href="evidence-${k}.html">${DIM_DEF[k].name}</a>`).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${def.name} · 证据链 · ${TITLE}</title>
<style>${style}</style>
<style>
.evlist{display:flex;flex-direction:column;gap:16px;margin-top:32px}
.evrow{background:var(--paper);border:1px solid var(--line-soft);border-radius:var(--r-lg);padding:24px 28px;box-shadow:var(--shadow);transition:border-color .3s var(--ease),transform .3s var(--ease)}
.evrow:hover{border-color:var(--signal-line);transform:translateY(-2px)}
.evrow-head{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.evrow .eid{font-family:var(--font-mono);font-size:14px;font-weight:600;color:var(--signal)}
.evrow .etag{font-size:11px;font-family:var(--font-mono);letter-spacing:.04em;padding:3px 9px;border-radius:6px;background:var(--surface-2);border:1px solid var(--line-soft);color:var(--ink-lo)}
.evrow-sum{font-size:15.5px;color:var(--ink-mid);line-height:1.65;margin:0}
.evrow-src{margin-top:12px;font-size:13px;color:var(--ink-lo);display:flex;align-items:center;gap:7px}
.evrow-src a{color:var(--signal);text-decoration:none}
.evrow-src a:hover{text-decoration:underline}
.dim-pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:40px;padding-top:24px;border-top:1px solid var(--line-soft)}
.dim-pill{font-size:13px;padding:8px 16px;border-radius:999px;border:1px solid var(--line-soft);background:var(--paper);color:var(--ink-mid);text-decoration:none;transition:.25s}
.dim-pill:hover{border-color:var(--signal);color:var(--signal)}
.nav-back{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--signal);background:rgba(11,124,242,.10);border:1px solid var(--signal-line);padding:8px 16px;border-radius:999px;transition:background .25s,border-color .25s}
.nav-back:hover{background:rgba(11,124,242,.18);border-color:var(--signal)}
.nav-back .bk{font-size:16px;line-height:1}
</style>
</head>
<body>
${navHtml}
<header class="hero">
  <div class="wrap">
    <span class="eyebrow">Evidence Chain · ${def.name}</span>
    <h1>${def.name}证据链</h1>
    <p class="lede">${def.desc}。本页汇总该维度下的全部 ${list.length} 条证据，每条均附真实来源链接，可点击跳转核验。数据窗口 2025-05 至 2026-05。</p>
  </div>
</header>
<section class="section wrap">
  <div class="evlist">
    ${rows}
  </div>
  <div class="dim-pills">${others}<a class="dim-pill" href="index.html">← 返回白皮书</a></div>
</section>
${footerHtml}
</body>
</html>`;
}

for(const dk of Object.keys(DIM_DEF)){
  writeFileSync(`evidence-${dk}.html`, buildPage(dk));
  console.log('generated evidence-'+dk+'.html');
}
