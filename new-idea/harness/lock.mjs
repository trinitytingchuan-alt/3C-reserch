// NEW IDEA Harness — SHA-256 基线锁定 (lock.mjs)
// 版本: 1.0.0
// 用法: node harness/lock.mjs [--company <slug>] [--verify | --update]
// --verify: 验证当前状态与基线一致（默认模式）
// --update: 更新基线（仅限内容评审通过后）

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');
const LOCK_DIR = join(BASE, 'output');
const LOCK_FILE = join(LOCK_DIR, 'contract.lock.json');

const args = process.argv.slice(2);
const mode = args.includes('--update') ? 'update' : 'verify';

function hashFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  return createHash('sha256').update(content).digest('hex');
}

function collectFiles(dir) {
  const results = [];
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'raw' || item.name === 'superpowers') continue; // 跳过原始采集和工作流记录
      results.push(...collectFiles(fullPath));
    } else if ((item.name.endsWith('.json') || item.name.endsWith('.md') || item.name.endsWith('.html')) &&
               !item.name.includes('lock')) {
      results.push(fullPath);
    }
  }
  return results;
}

const dataDir = join(BASE, 'data');
const cases = existsSync(dataDir) ? readdirSync(dataDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.'))
  .map(d => d.name) : [];

const baseline = {};
const files = [];

for (const caseSlug of cases) {
  const caseDir = join(dataDir, caseSlug);
  files.push(...collectFiles(caseDir));
}

// Also hash key harness and doc files
const metaFiles = [
  join(BASE, 'AGENTS.md'),
  join(BASE, 'README.md'),
  join(BASE, 'harness', 'rules.mjs'),
];

for (const f of metaFiles) {
  if (existsSync(f)) files.push(f);
}

for (const f of files) {
  const h = hashFile(f);
  if (h) baseline[relative(BASE, f).replace(/\\/g, '/')] = h;
}

if (mode === 'update') {
  if (!existsSync(LOCK_DIR)) mkdirSync(LOCK_DIR, { recursive: true });
  writeFileSync(LOCK_FILE, JSON.stringify(baseline, null, 2), 'utf-8');
  console.log(`✅ 基线已更新: ${Object.keys(baseline).length} 个文件`);
  console.log(`   锁定文件: ${LOCK_FILE}`);
} else {
  // verify mode
  if (!existsSync(LOCK_FILE)) {
    console.error('⚠️  未找到基线文件，请先运行 --update');
    process.exit(1);
  }

  const existing = JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
  let changed = 0;

  for (const [relPath, expectedHash] of Object.entries(existing)) {
    const fullPath = join(BASE, relPath);
    const currentHash = hashFile(fullPath);

    if (currentHash === null) {
      console.log(`[DELETED] ${relPath}`);
      changed++;
    } else if (currentHash !== expectedHash) {
      console.log(`[CHANGED] ${relPath}`);
      changed++;
    }
  }

  // Check for new files
  const existingKeys = new Set(Object.keys(existing));
  const currentKeys = new Set(Object.keys(baseline));
  for (const key of currentKeys) {
    if (!existingKeys.has(key)) {
      console.log(`[NEW] ${key}`);
      changed++;
    }
  }

  if (changed > 0) {
    console.error(`\n❌ 基线验证失败: ${changed} 处变更`);
    console.error('   如内容变更已评审通过，请运行: node harness/lock.mjs --update');
    process.exit(1);
  } else {
    console.log(`✅ 基线验证通过: ${Object.keys(existing).length} 个文件一致`);
  }
}
