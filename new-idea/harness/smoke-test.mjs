// NEW IDEA — 运行时冒烟测试 (smoke-test.mjs)
// 用法: node scripts/smoke-test.mjs [--file <path>]
// 功能: 用 jsdom 执行 HTML 内嵌 JS，验证各章节渲染产出非空、交互事件可触发
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const filePath = fileIdx > -1 ? args[fileIdx + 1] : join(BASE, 'output', 'index.html');

if (!existsSync(filePath)) {
  console.error(`❌ 文件不存在: ${filePath}`);
  process.exit(1);
}

const html = readFileSync(filePath, 'utf-8');
const errors = [];
const warnings = [];

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  url: 'http://localhost:5173/',
  beforeParse(window) {
    // IntersectionObserver stub（jsdom 不支持）
    window.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { /* 直接触发入场，模拟已可见 */ el.classList?.add?.('in'); }
      unobserve() {}
      disconnect() {}
    };
    window.scrollIntoView = function () {};
    window.matchMedia = window.matchMedia || function () { return { matches: false, addListener() {}, removeListener() {} }; };
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  },
});

const { window } = dom;

function waitFor(ms) { return new Promise(r => setTimeout(r, ms)); }

// 捕获未捕获异常
window.addEventListener('error', (e) => {
  errors.push(`window error: ${e.message}`);
});

const checks = [
  { id: 'top5Detail', desc: 'TOP5 详情卡渲染' },
  { id: 'rankList', desc: 'TOP5 排名列表渲染' },
  { id: 'radarContainer', desc: '10 维雷达图渲染' },
  { id: 'dimBars', desc: '维度评分条渲染' },
  { id: 'top5Evidence', desc: 'TOP5 证据链渲染' },
  { id: 'listBody', desc: '功能清单渲染' },
  { id: 'prdTabs', desc: 'PRD 导航渲染' },
  { id: 'prdPanels', desc: 'PRD 面板渲染' },
  { id: 'gtmGrid', desc: 'GTM 矩阵渲染' },
  { id: 'evBody', desc: '证据链总表渲染' },
  { id: 'verBody', desc: '核验记录表渲染' },
];

async function run() {
  await waitFor(300);

  for (const c of checks) {
    const el = window.document.getElementById(c.id);
    if (!el) { errors.push(`挂载点缺失: #${c.id}`); continue; }
    const content = el.innerHTML.trim();
    if (!content) { errors.push(`渲染为空: #${c.id} (${c.desc})`); continue; }
    console.log(`[OK]    ${c.desc}: ${content.length} 字符`);
  }

  // 断言关键内容
  const bodyText = window.document.body.textContent || '';
  const assertions = [
    ['TOP5 冠军 ID-005', bodyText.includes('HomeCharge OS')],
    ['TOP5 分数 91.6', bodyText.includes('91.6')],
    ['清单含 ID-007', bodyText.includes('StairClimber')],
    ['PRD 背景块', bodyText.includes('Background')],
    ['证据 E009 国标', bodyText.includes('E009')],
    ['核验 V001', bodyText.includes('V001')],
    ['GTM 北极星', bodyText.includes('northStar') || bodyText.includes('北极星')],
  ];
  for (const [name, ok] of assertions) {
    if (ok) console.log(`[OK]    断言通过: ${name}`);
    else { errors.push(`断言失败: ${name}`); }
  }

  // 交互测试 1：切换排名列表项
  try {
    const items = window.document.querySelectorAll('#rankList .rank-item');
    if (items.length >= 2) {
      items[1].dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitFor(50);
      const detailText = window.document.getElementById('top5Detail').textContent;
      if (detailText.includes('ID-001') || detailText.includes('Battery')) {
        console.log('[OK]    交互: 排名列表切换 TOP5 详情');
      } else {
        errors.push('交互失败: 排名切换后详情未更新');
      }
    } else {
      warnings.push('排名列表项不足 2 个，跳过切换测试');
    }
  } catch (e) { errors.push(`交互异常: ${e.message}`); }

  // 交互测试 2：专家视角切换
  try {
    const tabs = window.document.querySelectorAll('#expertTabs .expert-tab');
    if (tabs.length >= 4) {
      tabs[1].dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitFor(50);
      const label = window.document.getElementById('radarViewLabel').textContent;
      if (label.includes('产品专家')) {
        console.log('[OK]    交互: 专家视角切换');
      } else { errors.push(`交互失败: 专家视角标签=${label}`); }
    }
  } catch (e) { errors.push(`交互异常: ${e.message}`); }

  // 交互测试 3：清单筛选
  try {
    const chips = window.document.querySelectorAll('.filter-chip[data-path]');
    for (const chip of chips) {
      if (chip.dataset.path === 'cross-industry') {
        chip.dispatchEvent(new window.Event('click', { bubbles: true }));
        await waitFor(50);
        const rows = window.document.querySelectorAll('#listBody tr').length;
        if (rows === 1) { console.log('[OK]    交互: 发现路径筛选 (cross-industry → 1 条)'); }
        else { errors.push(`筛选失败: cross-industry 应 1 条，实际 ${rows} 条`); }
        break;
      }
    }
  } catch (e) { errors.push(`交互异常: ${e.message}`); }

  // 交互测试 4：详情弹层
  try {
    const firstRow = window.document.querySelector('#listBody tr');
    if (firstRow) {
      firstRow.dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitFor(50);
      const modalOpen = window.document.getElementById('modalBackdrop').classList.contains('open');
      if (modalOpen) console.log('[OK]    交互: 清单详情弹层打开');
      else errors.push('交互失败: 弹层未打开');
    }
  } catch (e) { errors.push(`交互异常: ${e.message}`); }

  // 交互测试 5：PRD 折叠
  try {
    const prdHeads = window.document.querySelectorAll('.prd-block-head');
    if (prdHeads.length >= 2) {
      prdHeads[1].dispatchEvent(new window.Event('click', { bubbles: true }));
      await waitFor(50);
      const blocks = window.document.querySelectorAll('.prd-block');
      const openCount = [...blocks].filter(b => b.classList.contains('open')).length;
      if (openCount === 2) console.log('[OK]    交互: PRD 折叠展开');
      else errors.push(`交互失败: PRD 折叠后 open=${openCount}`);
    }
  } catch (e) { errors.push(`交互异常: ${e.message}`); }

  for (const w of warnings) console.warn(`[WARN]  ${w}`);
  console.log(errors.length === 0
    ? '\n✅ 冒烟测试通过: 0 ERROR'
    : `\n❌ 冒烟测试失败: ${errors.length} ERROR\n  - ` + errors.join('\n  - '));
  process.exit(errors.length === 0 ? 0 : 1);
}

run();
