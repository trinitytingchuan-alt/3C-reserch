// run-with-recovery.mjs — 任务超时自动恢复运行器
// 解决长任务(如 QA / build / inject)卡死无响应的问题：
//   - 对子进程设 10s 心跳看门狗：若 >10s 无任何 stdout/stderr 输出，判定卡死 → 自动 kill
//   - 自动重试（默认 3 次），每步写 checkpoint.json（断点续跑）
//   - 中断后可用 --resume 从上次未完成步骤继续
//
// 用法:
//   node scripts/run-with-recovery.mjs --name <任务名> -- <命令...>
//   node scripts/run-with-recovery.mjs --resume            # 读取 checkpoint 续跑
//
// 退出码: 0=成功 / 1=失败(超重试上限)

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');
const CHECKPOINT = join(BASE, '.recovery-checkpoint.json');

const HEARTBEAT_MS = 10_000;   // 10s 无响应即判定卡死
const MAX_RETRY = 3;

function loadCheckpoint() {
  if (!existsSync(CHECKPOINT)) return { steps: [], done: false };
  try { return JSON.parse(readFileSync(CHECKPOINT, 'utf-8')); } catch { return { steps: [], done: false }; }
}
function saveCheckpoint(cp) {
  writeFileSync(CHECKPOINT, JSON.stringify(cp, null, 2), 'utf-8');
}

// 运行单条命令，带心跳看门狗 + 自动重试
function runStep(label, cmdArgs) {
  return new Promise((resolve) => {
    let attempt = 0;
    const tryOnce = () => {
      attempt++;
      console.log(`\n▶ [${label}] 尝试 ${attempt}/${MAX_RETRY}  ::  ${cmdArgs.join(' ')}`);
      const child = spawn(cmdArgs[0], cmdArgs.slice(1), { cwd: BASE, encoding: 'utf-8' });
      let lastActivity = Date.now();
      let heartbeat = setInterval(() => {
        const idle = Date.now() - lastActivity;
        if (idle >= HEARTBEAT_MS) {
          console.error(`  ⏱ 超过 ${HEARTBEAT_MS / 1000}s 无响应，判定卡死，强制终止...`);
          try { process.kill(child.pid, 'SIGKILL'); } catch {}
          clearInterval(heartbeat);
          if (attempt < MAX_RETRY) { setTimeout(tryOnce, 500); }
          else { resolve({ ok: false, label, reason: 'timeout-exceeded' }); }
        }
      }, 1000);

      child.stdout.on('data', (d) => { lastActivity = Date.now(); process.stdout.write(d); });
      child.stderr.on('data', (d) => { lastActivity = Date.now(); process.stderr.write(d); });
      child.on('error', (e) => {
        clearInterval(heartbeat);
        console.error(`  ✗ 进程错误: ${e.message}`);
      });
      child.on('close', (code) => {
        clearInterval(heartbeat);
        if (code === 0) resolve({ ok: true, label });
        else if (attempt < MAX_RETRY) { setTimeout(tryOnce, 500); }
        else resolve({ ok: false, label, reason: `exit-${code}` });
      });
    };
    tryOnce();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const resumeIdx = args.indexOf('--resume');
  const nameIdx = args.indexOf('--name');
  const name = nameIdx > -1 ? args[nameIdx + 1] : 'task';
  const sep = args.indexOf('--');
  const cmd = sep > -1 ? args.slice(sep + 1) : null;

  let cp = loadCheckpoint();
  if (resumeIdx === -1) {
    cp = { name, steps: [], done: false };
  }

  if (!cmd && resumeIdx === -1) {
    console.error('用法: node scripts/run-with-recovery.mjs --name <任务名> -- <命令...>');
    process.exit(1);
  }

  // 单次运行模式
  if (cmd) {
    const r = await runStep(name, cmd);
    cp.steps.push({ label: name, ok: r.ok, at: new Date().toISOString() });
    cp.done = r.ok;
    saveCheckpoint(cp);
    process.exit(r.ok ? 0 : 1);
  }

  // 续跑模式:重新执行 checkpoint 中失败的/未完成的步骤
  if (resumeIdx > -1) {
    console.log('🔄 续跑模式: 重新执行上次未完成的步骤');
    const failed = cp.steps.filter(s => !s.ok);
    if (failed.length === 0) { console.log('✅ 无未完成步骤'); process.exit(0); }
    for (const s of failed) {
      const r = await runStep(s.label, s.cmd || [s.label]);
      s.ok = r.ok; s.at = new Date().toISOString();
    }
    saveCheckpoint(cp);
    process.exit(cp.steps.every(s => s.ok) ? 0 : 1);
  }
}

main();
