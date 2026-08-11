/**
 * lock.mjs — 3C 竞品分析基线锁定
 * 
 * 对 evidence.json 和 prd-draft.md 建立 SHA-256 基线，
 * 后续构建时校验内容无非预期的漂移。
 * 
 * 用法：
 *   node harness/lock.mjs --category headphones    # 建立/更新基线
 *   node harness/lock.mjs --category headphones --check  # 仅校验不更新
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import minimist from 'minimist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function hashFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashJSON(filePath) {
  // 规范化 JSON（sort keys）再做 hash，避免格式漂变
  const obj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const normalized = JSON.stringify(obj, Object.keys(obj).sort(), 2);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const category = argv.category || argv.c || 'headphones';
  const checkOnly = argv.check || false;

  console.log(`\n🔒 基线锁定 — 品类：${category}\n${'─'.repeat(50)}`);

  const dataDir = path.join(ROOT, 'data', category);
  const lockPath = path.join(dataDir, 'contract.lock.json');

  const evidencePath = path.join(dataDir, 'evidence.json');
  const prdPath = path.join(dataDir, 'prd-draft.md');

  // Compute hashes
  const evidenceHash = hashJSON(evidencePath);
  const prdHash = hashFile(prdPath);

  const current = {
    locked_at: new Date().toISOString(),
    category,
    hashes: {
      evidence: evidenceHash,
      prd_draft: prdHash,
    },
    algorithm: 'sha256',
    note: '修改 evidence.json 或 prd-draft.md 后必须重新 lock',
  };

  if (checkOnly) {
    // Check mode
    if (!fs.existsSync(lockPath)) {
      console.log('⚠️ 基线文件不存在，请先执行 lock（不加 --check）建立基线');
      process.exit(1);
    }
    const baseline = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

    let passed = true;
    for (const [key, hash] of Object.entries(baseline.hashes)) {
      const currentHash = current.hashes[key];
      if (hash !== currentHash) {
        console.log(`❌ ${key}: 哈希不匹配！`);
        console.log(`   基线：${hash.slice(0, 16)}...`);
        console.log(`   当前：${currentHash.slice(0, 16)}...`);
        passed = false;
      } else {
        console.log(`✅ ${key}: 一致 (${hash.slice(0, 16)}...)`);
      }
    }

    if (passed) {
      console.log(`\n✅ 基线校验通过 — 内容无漂移 (locked: ${baseline.locked_at})`);
      process.exit(0);
    } else {
      console.log('\n❌ 基线校验未通过 — 内容已变更，如需更新基线请运行 lock（不加 --check）');
      process.exit(1);
    }
  } else {
    // Lock mode
    fs.writeFileSync(lockPath, JSON.stringify(current, null, 2) + '\n', 'utf-8');
    console.log('  证据哈希：' + evidenceHash.slice(0, 16) + '...');
    console.log('  PRD 哈希：' + prdHash.slice(0, 16) + '...');
    console.log(`\n✅ 基线已锁定 → ${path.relative(ROOT, lockPath)}`);
    console.log(`   锁定时间：${current.locked_at}\n`);
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
