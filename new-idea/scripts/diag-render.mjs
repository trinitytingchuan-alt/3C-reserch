// diag-render.mjs — 无头诊断：stub DOM，用 vm 执行报告 <script>，捕获首屏渲染错误
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, '..', 'output', 'index.html');
const html = readFileSync(htmlPath, 'utf-8');

const m = html.match(/<script>([\s\S]*?)<\/script>/g);
if (!m) { console.log('NO SCRIPT FOUND'); process.exit(1); }
const scriptBody = m[m.length - 1].replace(/^<script>/, '').replace(/<\/script>$/, '');

const noop = () => {};
function makeEl() {
  return new Proxy(function () {}, {
    get(t, p) {
      if (p === 'classList') return { add: noop, remove: noop, toggle: noop, contains: () => false };
      if (p === 'dataset') return {};
      if (p === 'style') return {};
      if (p === 'addEventListener') return noop;
      if (p === 'querySelector') return () => makeEl();
      if (p === 'querySelectorAll') return () => [];
      if (p === 'closest') return () => null;
      if (p === 'scrollIntoView') return noop;
      if (p === 'getBoundingClientRect') return () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 });
      if (p === 'dataset') return { target: '' };
      if (p === 'innerHeight') return 800;
      if (p === 'getElementById') return () => makeEl();
      return makeEl();
    },
    set() { return true; },
    apply() { return makeEl(); }
  });
}
const sandbox = {
  console,
  document: {
    getElementById: () => makeEl(),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') sandbox.__domReady = fn; },
    createElement: () => makeEl(),
  },
  window: { addEventListener: noop, removeEventListener: noop },
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  setTimeout: (fn) => { try { fn(); } catch (e) { console.log('setTimeout err:', e.message); } },
  Math, JSON, Object, Array, String, Set, Map, Date,
};
sandbox.globalThis = sandbox;

try {
  vm.createContext(sandbox);
  vm.runInContext(scriptBody, sandbox, { filename: 'report.js' });
  console.log('✅ 脚本解析执行无异常');
  if (sandbox.__domReady) {
    console.log('▶ 触发 DOMContentLoaded (initRemaining)');
    sandbox.__domReady();
    console.log('✅ initRemaining 执行成功');
    // 额外验证 openPrdDoc（TOP5 卡点击二级界面）与 renderValidationLoop 不抛错
    const checks = [
      ['renderValidationLoop', 'renderValidationLoop'],
    ];
    for (const [label, fnName] of checks) {
      try {
        if (typeof sandbox[fnName] === 'function') { sandbox[fnName](); console.log(`✅ ${label} 执行成功`); }
        else console.log(`⚠ ${label} 未定义（可能被条件包裹）`);
      } catch (e) { console.log(`❌ ${label} 抛错: ${e.message}`); }
    }
  } else {
    console.log('⚠ 未注册 DOMContentLoaded');
  }
} catch (e) {
  console.log('❌ 执行异常:');
  console.log('   message:', e.message);
  console.log('   stack:', (e.stack || '').split('\n').slice(0, 6).join('\n'));
}
