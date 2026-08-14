// NEW IDEA Harness — 构建程序 (build.mjs)
// 版本: 1.0.0
// 用法: node harness/build.mjs [--company <slug>] [--output <path>]
// 功能: 读取案例数据 → 注入模板 → 自动 QA → 输出 HTML

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const args = process.argv.slice(2);
const companyIdx = args.indexOf('--company');
const company = companyIdx > -1 ? args[companyIdx + 1] : 'anker';
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx > -1 ? args[outputIdx + 1] : join(BASE, 'output', 'index.html');
const stageIdx = args.indexOf('--stage');
const stage = stageIdx > -1 ? args[stageIdx + 1] : 'report';

// 分步骤产出状态机：demand → gtm → report
// 铁律：后置模块产出前，前置模块必须已 done（需求未确认不得产出 GTM，避免返工）
const STAGE_ORDER = ['demand', 'gtm', 'report'];
const stageFile = join(BASE, 'data', company, 'stage.json');
function loadStage() {
  if (!existsSync(stageFile)) return { stages: { demand: 'pending', gtm: 'pending', report: 'pending' } };
  try { return JSON.parse(readFileSync(stageFile, 'utf-8')); } catch { return { stages: { demand: 'pending', gtm: 'pending', report: 'pending' } }; }
}
function assertStage(stage, current) {
  const idx = STAGE_ORDER.indexOf(stage);
  for (let i = 0; i < idx; i++) {
    const prev = STAGE_ORDER[i];
    if ((current.stages[prev] || 'pending') !== 'done') {
      console.error(`❌ 分步骤产出拦截：产出「${stage}」前，「${prev}」必须已 done（当前 ${current.stages[prev]}）。`);
      console.error(`   请先确认上一阶段产出，再执行对应 stage。`);
      process.exit(1);
    }
  }
}

// Step 0: Validate inputs + stage 约束
const dataDir = join(BASE, 'data', company);
if (!existsSync(dataDir)) {
  console.error(`❌ 案例数据目录不存在: ${dataDir}`);
  process.exit(1);
}
const stageState = loadStage();
if (stage === 'report') {
  // report 阶段要求前置模块(demand/evidence/gtm)全部 done 才产出完整报告；否则拦截，强制先逐模块产出
  assertStage('report', stageState);
  for (const pre of ['evidence', 'gtm']) {
    if ((stageState.stages[pre] || 'pending') !== 'done') {
      console.error(`❌ 分步骤产出拦截：产出「report」前，模块「${pre}」必须已 done（当前 ${stageState.stages[pre]}）。`);
      console.error(`   请先执行对应 stage（如 --stage gtm）完成该模块后再产出完整报告。`);
      process.exit(1);
    }
  }
}
console.log(`📦 构建案例: ${company} | 阶段: ${stage} | stage.json: ${JSON.stringify(stageState.stages)}`);

// Step 1: Load template (按 company 自动匹配 report-template-<company>.html，隔离不同公司数据)
const templatePath = join(BASE, 'templates', `report-template-${company}.html`);
if (!existsSync(templatePath)) {
  console.error(`❌ 模板不存在: ${templatePath}（请复制 templates/report-template.html 为 report-template-${company}.html 并替换内联数据）`);
  process.exit(1);
}

// Step 2: Load case data
const loadJSON = (name) => {
  const fp = join(dataDir, name);
  if (!existsSync(fp)) return null;
  try { return JSON.parse(readFileSync(fp, 'utf-8')); }
  catch (e) { console.warn(`⚠️  无法解析 ${name}: ${e.message}`); return null; }
};

const profile = loadJSON('company-profile.json');
const ideas = loadJSON('ideas.json');
const evidence = loadJSON('evidence.json');
const verification = loadJSON('verification.json');
const scores = loadJSON('scores.json');

console.log(`📦 构建案例: ${company}`);
console.log(`   画像: ${profile ? '✓' : '✗'}  |  IDEA池: ${ideas ? `${ideas.length}条` : '✗'}  |  证据: ${evidence ? '✓' : '✗'}`);
console.log(`   核验: ${verification ? '✓' : '✗'}  |  评分: ${scores ? `${scores.length}条` : '✗'}`);

// Step 2.5: Schema 数据契约前置校验（结构层，杜绝 undefined/幽灵引用/字段缺失）
console.log('\n🔍 运行 Schema 数据契约校验...');
try {
  const schemaResult = execSync(`node "${join(__dirname, 'schema-validate.mjs')}" --company ${company}`, {
    cwd: BASE,
    encoding: 'utf-8',
    timeout: 15000,
  });
  const lastLine = schemaResult.trim().split('\n').pop();
  if (!/通过|0 ERROR/.test(lastLine)) {
    console.error(`❌ Schema 校验未通过:\n${schemaResult}`);
    process.exit(1);
  }
  console.log(schemaResult.trim().split('\n').slice(-3).join('\n'));
} catch (e) {
  console.error(`❌ Schema 校验失败:\n${e.stdout || e.message}`);
  process.exit(1);
}

// Step 3: Run QA
console.log('\n🔍 运行 QA 闸门...');
try {
  const qaResult = execSync(`node "${join(__dirname, 'qa.mjs')}" --company ${company}`, {
    cwd: BASE,
    encoding: 'utf-8',
    timeout: 30000,
  });
  console.log(qaResult.trim().split('\n').slice(-3).join('\n'));
} catch (e) {
  console.error(`❌ QA 未通过:\n${e.stdout || e.message}`);
  console.error('   请修复上述 ERROR 后重试');
  process.exit(1);
}

// Step 4: Copy template to output (报告为单文件 HTML，模板即产物)
const outputDir = dirname(outputPath);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const templateHtml = readFileSync(templatePath, 'utf-8');
// 注入分模块产出状态 __STAGE__（控制模块可见性：未 done 模块渲染"待确认"占位）
const stageJson = existsSync(stageFile) ? readFileSync(stageFile, 'utf-8') : JSON.stringify({ stages: { demand: 'done', gtm: 'done', evidence: 'done', report: 'done' } });
const outputHtml = templateHtml.split('__STAGE__').join(stageJson.trim());
writeFileSync(outputPath, outputHtml, 'utf-8');

console.log(`\n✅ 构建完成`);
console.log(`   输出路径: ${outputPath} (${(templateHtml.length / 1024).toFixed(1)} KB)`);
console.log(`   运行 'node harness/lock.mjs --update' 锁定基线`);
