/*
 * 自我迭代 / 回测引擎  _selfcheck.cjs
 * ---------------------------------------------------------------------------
 * 对照主 AGENTS.md 的「硬性规则(8 条红线) + TOP5 强制规则 + 渲染不空白」，
 * 对产物 new-idea/output/index.html 做机读校验，输出逐条 PASS/FAIL 报告。
 *
 * 设计目标：把"用户口头提需求"收敛为"每次改动后自动跑本脚本对照 AGENTS.md 红线"，
 * 形成 agent 自我进化闭环。任何 FAIL 即视为禁止交付。
 *
 * 用法：  node _selfcheck.cjs
 * 退出码： 0 = 全部通过； 1 = 存在 FAIL（禁止交付）
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join('new-idea', 'output', 'index.html');
const s = fs.readFileSync(OUT, 'utf8');

let fails = 0, passes = 0;
const lines = [];
const ok = (c, id, desc) => {
  if (c) { passes++; lines.push(`  PASS  [${id}] ${desc}`); }
  else { fails++; lines.push(`> FAIL  [${id}] ${desc}`); }
};

// 安全求值：从源码提取字面量并解析（括号平衡法，兼容 ] / } 结尾）
function extract(name) {
  const start = s.indexOf('const ' + name + ' =');
  if (start < 0) return null;
  let i = s.indexOf('=', start) + 1;
  while (i < s.length && /\s/.test(s[i])) i++;
  const open = s[i], close = open === '[' ? ']' : open === '{' ? '}' : null;
  if (!close) return null;
  let depth = 0, inStr = false, esc = false, q = '';
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === q) inStr = false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; q = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { const lit = s.slice(i, j + 1); try { return (new Function('return ' + lit))(); } catch (e) { return 'ERR:' + e.message; } } }
  }
  return null;
}

const TOP5 = extract('TOP5');
const EVID = extract('EVID');
const FUNC_EV = extract('FUNC_EV');
const PRDS = extract('PRDS');
const SCORES = extract('SCORES');
const DIMS_W = extract('DIMS_W');

// ===================================================================
// 一、渲染不空白（来自 _v.cjs 子集：脚本可运行 + 右侧核心容器被填充）
// ===================================================================
ok((s.match(/<script>/g) || []).length === (s.match(/<\/script>/g) || []).length, 'R-RENDER', 'script 标签闭合');
ok(/const DIM_MAP =/.test(s) && (s.match(/const DIM_MAP =/g) || []).length === 1, 'R-RENDER', '无重复声明导致整段脚本失效');
// 真实 DOM 执行 + 右侧容器填充
function El(id){this.id=id;this.children=[];this._html='';this.style={};this.dataset={};this._cls=new Set();
  this.classList={_s:this._cls,add:x=>this._cls.add(x),remove:x=>this._cls.delete(x),
    toggle:(x,v)=>{if(v!==undefined){v?this._cls.add(x):this._cls.delete(x)}else{this._cls.has(x)?this._cls.delete(x):this._cls.add(x)}},
    contains:x=>this._cls.has(x)};this._text='';}
Object.defineProperty(El.prototype,'innerHTML',{get(){return this._html},set(v){this._html=String(v);if(v)this._dirty=true}});
Object.defineProperty(El.prototype,'textContent',{get(){return this._text},set(v){this._text=String(v);if(v)this._dirty=true}});
El.prototype.appendChild=function(c){this.children.push(c);this._dirty=true;return c};
El.prototype.querySelectorAll=function(){return[]};El.prototype.querySelector=function(){return null};
El.prototype.addEventListener=function(){};El.prototype.setAttribute=function(){};
El.prototype.scrollIntoView=function(){};El.prototype.getBoundingClientRect=function(){return{top:0,left:0,width:0,height:0}};
const els={};const getEl=id=>els[id]||(els[id]=new El(id));
global.document={getElementById:getEl,createElement:()=>new El('x'),createElementNS:()=>new El('svg'),querySelectorAll:()=>[],body:new El('body'),documentElement:new El('html')};
global.window=global;global.addEventListener=function(){};global.scrollY=0;global.location={hash:''};
global.IntersectionObserver=function(cb){this.observe=function(){};this.unobserve=function(){}};
try { new Function(s.match(/<script>([\s\S]*?)<\/script>/)[1])(); ok(true,'R-RENDER','SCRIPT RUNTIME 执行无异常'); }
catch(e){ ok(false,'R-RENDER','SCRIPT RUNTIME 执行异常: '+e.message); }
for (const [id,label] of Object.entries({top5grid:'TOP5 卡片网格',gtmgrid:'GTM 卡片网格',eviBody:'证据总表',eviToolbar:'证据筛选器',eviX:'三级核验记录',weights:'10维权重'})) {
  const el=els[id]; const filled=el&&(el.children.length>0||(el._html&&el._html.length>10));
  ok(!!filled,'R-RENDER',`右侧容器 [${label}] 已填充 (id=${id})`);
}

// ===================================================================
// 二、TOP5 强制规则（用户强约束）
// ===================================================================
ok(Array.isArray(TOP5) && TOP5.length===5, 'TOP5', `TOP5 固定 5 个（当前 ${Array.isArray(TOP5)?TOP5.length:'?'})`);
if(Array.isArray(TOP5)){
  TOP5.forEach(d=>ok(typeof d.score==='number'&&d.score>=90,'TOP5',`${d.id||'?'} 综合分 ${d.score} ≥ 90`));
}

// ===================================================================
// 三、AGENTS.md 硬性规则 逐条对照
// ===================================================================
// R1 证据链可溯源：EVID 每条含 url(可点击)+src+date
if(Array.isArray(EVID)){
  ok(EVID.length>=10,'R1','证据链 EVID 数量充足 ('+EVID.length+')');
  let bad=0;
  EVID.forEach(e=>{ if(!e.url||!/^https?:\/\//.test(e.url)||!e.src||!e.date) bad++; });
  ok(bad===0,'R1',`每条 EVID 含 真实URL+src+date（异常 ${bad} 条）`);
}
// R2 根因多点验证：PRDS.root 字段存在（交叉在 JSON 层，单文件做软校验）
if(PRDS&&typeof PRDS==='object'){
  let noRoot=0; Object.keys(PRDS).forEach(id=>{ if(!PRDS[id].root) noRoot++; });
  ok(noRoot===0,'R2',`PRDS 均含 root 根因字段（缺 ${noRoot}）`);
}
// R5/R6 市场验证闭环 + 数据质量：FUNC_EV 每功能 ≥10 条强相关
if(FUNC_EV&&typeof FUNC_EV==='object'){
  let below=0; Object.keys(FUNC_EV).forEach(id=>{ const n=(FUNC_EV[id].match(/E\d+/g)||[]).length; if(n<10) below++; });
  ok(below===0,'R5/R6',`FUNC_EV 每功能 ≥10 条强相关证据（不足 ${below} 个）`);
}
// R6 来源类型 ≥4 种：EVID.dim 去重计数
if(Array.isArray(EVID)){
  const types=new Set(EVID.map(e=>e.dim).filter(Boolean));
  ok(types.size>=4,'R6',`证据来源维度类型 ≥4 种（当前 ${types.size} 种）`);
}
// R7 推导链路闭环：PRDS 含 scene/pain/root/solution 字段
if(PRDS&&typeof PRDS==='object'){
  let miss=0; Object.keys(PRDS).forEach(id=>{const p=PRDS[id];if(!(p.scene&&p.pain&&p.root&&p.solution))miss++;});
  ok(miss===0,'R7',`PRDS 推导链路字段齐全 scene/pain/root/solution（缺 ${miss}）`);
}
// R8 报告透出红线：正文禁止 AI/Agent/内部机制词（仅扫展示文本，排除 script/style/标签属性）
const visible = s.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,' ');
const banned = ['harness','pipeline','五源规则','子权重','QA 校验','AI Agent','大语言模型','LLM','端到端流程'];
let hit=[]; banned.forEach(w=>{ if(visible.includes(w)) hit.push(w); });
ok(hit.length===0,'R8',`透出红线词未出现（命中 ${hit.join('/')||'无'}）`);
ok(!/已交叉验证 \$\{d\.ev\.length\}/.test(s),'R8','无写死证据文本');

// 二级页左导航 + 编号（上一轮用户要求，纳入自我迭代基线）
ok(/class="prd-aside"/.test(s),'LAYOUT','二级页左导航 prd-aside 存在');
ok((s.match(/<span class="n">\d+<\/span>/g)||[]).length>=20,'LAYOUT','二级页导航带编号(≥20)');

// ===================================================================
// 汇总
// ===================================================================
lines.unshift(`自我迭代回测 · 对照 AGENTS.md 红线 · ${new Date().toISOString().slice(0,10)}`);
lines.push('');
lines.push(`结果：${passes} PASS / ${fails} FAIL`);
const verdict = fails===0 ? '✅ 全部通过 — 符合 AGENTS.md 产出要求，可交付' : '❌ 存在 FAIL — 禁止交付，需自我修复至 0 FAIL';
lines.push(verdict);
fs.writeFileSync(path.join('new-idea','output','_selfcheck_result.txt'), lines.join('\n')+'\n');
// 同时打印（PowerShell 下用文件读取更稳）
if (process.env.SELFCHECK_ECHO) console.log(lines.join('\n'));
process.exit(fails===0?0:1);
