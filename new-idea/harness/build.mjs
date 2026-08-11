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

// Step 0: Validate inputs
const dataDir = join(BASE, 'data', company);
if (!existsSync(dataDir)) {
  console.error(`❌ 案例数据目录不存在: ${dataDir}`);
  process.exit(1);
}

// Step 1: Load template
const templatePath = join(BASE, 'templates', 'report-template.html');
if (!existsSync(templatePath)) {
  console.log('⚠️  模板文件不存在，将直接构建 HTML');
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

// Step 3: Run QA
console.log('\n🔍 运行 QA 闸门...');
try {
  const qaResult = execSync(`node "${join(__dirname, 'qa.mjs')}" --company ${company}`, {
    cwd: BASE,
    encoding: 'utf-8',
    timeout: 30000,
  });
  console.log(qaResult);
} catch (e) {
  console.error(`❌ QA 未通过:\n${e.stdout || e.message}`);
  console.error('   请修复上述 ERROR 后重试');
  process.exit(1);
}

// Step 4: Copy template to output (报告为单文件 HTML，模板即产物)
const outputDir = dirname(outputPath);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const templateHtml = readFileSync(templatePath, 'utf-8');
writeFileSync(outputPath, templateHtml, 'utf-8');

console.log(`\n✅ 构建完成`);
console.log(`   输出路径: ${outputPath} (${(templateHtml.length / 1024).toFixed(1)} KB)`);
console.log(`   运行 'node harness/lock.mjs --update' 锁定基线`);
