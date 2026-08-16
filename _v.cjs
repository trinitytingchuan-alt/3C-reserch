/*
 * 硬性自检脚本 —— 强行注入的渲染质量闸门
 * 任何"右侧空白/内容未渲染"类回归都必须在此被拦下。
 * 设计：用尽量真实的 DOM 桩执行页面 <script>，并断言核心容器被填充。
 */
const fs = require('fs');
const path = require('path');
const root = 'new-idea/output';
const file = path.join(root, 'index.html');
const s = fs.readFileSync(file, 'utf8');

let fails = 0;
const logLines = [];
const ok = (c, m) => { const line = (c ? 'OK   ' : 'FAIL') + ' ' + m; logLines.push(line); console.log(line); if (!c) fails++; };

// ---------- 1. 结构平衡 ----------
ok((s.match(/<div/g) || []).length === (s.match(/<\/div>/g) || []).length, 'div balanced');
ok((s.match(/<style>/g) || []).length === (s.match(/<\/style>/g) || []).length && (s.match(/<style>/g) || []).length === 1, 'style closed');
ok((s.match(/<script/g) || []).length === (s.match(/<\/script>/g) || []).length, 'script closed');

// ---------- 2. 业务逻辑一致性 ----------
ok(/const FUNC_EV = \{/.test(s), 'FUNC_EV defined');
ok(/function prdGo/.test(s), 'prdGo defined');
ok(/class="overlay-nav"/.test(s), 'overlay-nav present');
ok(/class="ev-mini"/.test(s), 'ev-mini present');
ok(/evCount\(d\.id\)/.test(s), 'card uses dynamic evCount');
ok(!/已交叉验证 \$\{d\.ev\.length\}/.test(s), 'no hardcoded 2-ev text');
ok(!/\$\{d\.ev\.map/.test(s), 'no old d.ev refs');
// FUNC_EV 每条 >=10
const m = s.match(/const FUNC_EV = \{([\s\S]*?)\};/)[1];
const ids = [...m.matchAll(/"([^"]+)":\[([^\]]*)\]/g)];
ids.forEach(x => { const n = (x[2].match(/E\d+/g) || []).length; ok(n >= 10, `FUNC_EV ${x[1]} has ${n} evidences`); });
// 不可重复声明（导致整段脚本不执行的元凶）
const dimMapCount = (s.match(/const DIM_MAP =/g) || []).length;
const dimOverrideCount = (s.match(/const DIM_OVERRIDE =/g) || []).length;
ok(dimMapCount === 1, `DIM_MAP declared exactly once (found ${dimMapCount})`);
ok(dimOverrideCount <= 1, `DIM_OVERRIDE declared <=1 (found ${dimOverrideCount})`);

// ---------- 3. 真实 DOM 执行，断言右侧被填充 ----------
// 容器登记：id -> 期望非空（仅 JS 动态填充的容器）
const NEED_FILL = {
  top5grid: 'TOP5 卡片网格',
  gtmgrid: 'GTM 卡片网格',
  eviBody: '证据总表',
  eviToolbar: '证据筛选器',
  eviX: '三级核验记录',
  weights: '10维权重',
};
// 静态容器：要求源 HTML 中已自带子节点（非空）
ok((s.match(/id="railLinks"[\s\S]*?<\/div>/)[0].match(/<a /g) || []).length >= 6, 'left-nav railLinks has >=6 static links');
ok(/id="prdLayer"|class="prd-layer"|prdLayer/.test(s), 'PRD overlay (prdLayer) exists in source');
ok(/id="eviMask"|modal-mask/.test(s), 'evidence modal (eviMask) exists in source');
// 二级页导航栏必须左侧 + 编号
ok(/class="prd-aside"/.test(s), 'PRD/GTM secondary page uses left aside nav');
ok(/class="prd-layout"/.test(s), 'secondary page uses left-right layout');
const navNums = (s.match(/<span class="n">(\d+)<\/span>/g) || []).length;
ok(navNums >= 18, `secondary nav items carry numeric labels (found ${navNums}, PRD 10 + GTM 10 = 20)`);
ok(/bindPrdNav/.test(s), 'scroll-spy bindPrdNav present for active highlighting');

function El(id) {
  this.id = id; this.children = []; this._html = '';
  this.style = {}; this.dataset = {};
  this._cls = new Set();
  this.classList = {
    _s: this._cls,
    add: x => this._cls.add(x),
    remove: x => this._cls.delete(x),
    toggle: (x, v) => { if (v !== undefined) { v ? this._cls.add(x) : this._cls.delete(x); } else { this._cls.has(x) ? this._cls.delete(x) : this._cls.add(x); } },
    contains: x => this._cls.has(x)
  };
  this._text = '';
}
Object.defineProperty(El.prototype, 'innerHTML', {
  get() { return this._html; },
  set(v) { this._html = String(v); if (v) this._dirty = true; }
});
Object.defineProperty(El.prototype, 'textContent', {
  get() { return this._text; },
  set(v) { this._text = String(v); if (v) this._dirty = true; }
});
El.prototype.appendChild = function (c) { this.children.push(c); this._dirty = true; return c; };
El.prototype.querySelectorAll = function () { return []; };
El.prototype.addEventListener = function () {};
El.prototype.setAttribute = function () {};
El.prototype.scrollIntoView = function () {};
El.prototype.getBoundingClientRect = function () { return { top: 0, left: 0, width: 0, height: 0 }; };
El.prototype.querySelector = function () { return null; };

const els = {};
function getEl(id) { return els[id] || (els[id] = new El(id)); }
global.document = {
  getElementById: getEl,
  createElement: () => new El('x'),
  createElementNS: () => new El('svg'),
  querySelectorAll: () => [],
  body: new El('body'),
  documentElement: new El('html')
};
global.window = global;
global.addEventListener = function () {};
global.scrollY = 0;
global.location = { hash: '' };
global.IntersectionObserver = function (cb) { this.observe = function () {}; this.unobserve = function () {}; };

const code = s.match(/<script>([\s\S]*?)<\/script>/)[1];
try {
  new Function(code)();
  console.log('OK   SCRIPT RUNTIME');
} catch (e) {
  console.log('FAIL SCRIPT RUNTIME: ' + e.message);
  fails++;
}

// 断言核心容器非空
for (const [id, label] of Object.entries(NEED_FILL)) {
  const el = els[id];
  const filled = el && (el.children.length > 0 || (el._html && el._html.length > 10));
  ok(!!filled, `right-panel [${label}] filled (id=${id})`);
}

// ---------- 4. 汇总 ----------
const summary = (fails === 0 ? 'PASS' : `FAIL(${fails})`);
const result = (fails === 0 ? '✅ ALL PASS — 界面渲染自检通过' : `❌ ${fails} CHECK(S) FAILED — 禁止交付`);
console.log('\n' + result);
fs.writeFileSync(path.join(root, '_v_result.txt'), logLines.join('\n') + '\n\n' + summary + ' ' + result + '\n');
process.exit(fails === 0 ? 0 : 1);
