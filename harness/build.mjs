/**
 * build.mjs — 3C 竞品分析报告构建管线
 * 
 * 读取 data/{category}/evidence.json + prd-draft.md
 * 注入 templates/index-base.html 模板
 * 产出 data/{category}/index.html
 * 
 * 构建前自动运行 QA 闸门。
 * 
 * 用法：
 *   node harness/build.mjs --category headphones
 *   node harness/build.mjs --category headphones --time 2026-08-11
 *   node harness/build.mjs --category headphones --skip-qa  # 跳过 QA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import minimist from 'minimist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ============================================================
// Helpers
// ============================================================

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadText(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

/** Tier → CSS class */
function tierClass(tier) {
  return `ev-t${tier.slice(1).toLowerCase()}`;
}

/** Verification level → CSS class */
function vlevelClass(level) {
  return `ev-l${level.slice(1).toLowerCase()}`;
}

/** Priority → CSS class */
function prioClass(priority) {
  return priority.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ============================================================
// Renderers
// ============================================================

/** 竞品总览表格 */
function renderOverview(evidence, prdData) {
  if (!prdData.overview_table) {
    // Fallback: auto-generate from evidence grouped by category
    const categories = [...new Set(evidence.map(e => e.category))];
    let html = '<div class="table-wrap"><table><thead><tr><th>维度</th>';
    // Simple static competitors
    const competitors = ['Sony WF-1000XM5', 'Apple AirPods Pro 2', 'Bose QC Ultra Earbuds'];
    for (const c of competitors) {
      html += `<th>${c}</th>`;
    }
    html += '</tr></thead><tbody>';

    const dims = [
      { key: 'anc_performance', label: 'ANC 降噪深度' },
      { key: 'battery', label: '续航(ANC开)' },
      { key: 'pricing', label: '参考价格' },
    ];

    for (const dim of dims) {
      html += `<tr><td>${dim.label}</td>`;
      const related = evidence.filter(e => e.category === dim.key);
      for (let i = 0; i < 3; i++) {
        const ev = related[i];
        if (ev) {
          html += `<td>${escapeHtml(ev.claim.slice(0, 30))} <span class="ev ${tierClass(ev.tier)}">${ev.id}</span></td>`;
        } else {
          html += '<td>—</td>';
        }
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    return html;
  }
  return prdData.overview_table;
}

/** 用户痛点 */
function renderPainpoints(evidence) {
  const painEvidence = evidence.filter(e => e.category === 'user_painpoints');
  if (painEvidence.length === 0) {
    return '<p style="color:var(--text-muted)">暂无结构化痛点数据</p>';
  }
  let html = '';
  for (const ev of painEvidence) {
    html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-light)">${escapeHtml(ev.claim)} <span class="ev ${tierClass(ev.tier)}">${ev.id}</span></div>`;
  }
  return html;
}

/** 覆盖项 */
function renderCoverage(evidence) {
  const sources = new Set(evidence.map(e => e.source_type));
  const tiers = [...new Set(evidence.map(e => e.tier))].sort();
  let html = '';
  for (const tier of tiers) {
    const tierEvidence = evidence.filter(e => e.tier === tier);
    const num = tierClass(tier);
    html += `
    <div class="coverage-item">
      <span class="tier-badge tier-${tier.slice(1)}">${tier}</span>
      <span>${tierEvidence.length} 条证据</span>
      <span class="status status-done">●</span>
    </div>`;
  }
  return html;
}

/** 优化建议 */
function renderOptimizations(optimizations) {
  if (!optimizations || optimizations.length === 0) {
    return '<p style="color:var(--text-muted)">暂无 PRD 优化建议</p>';
  }
  let html = '';
  for (const opt of optimizations) {
    const evBadges = (opt.evidence_ids || [])
      .map(id => `<span class="ev ev-t1">${id}</span>`)
      .join(' ');
    html += `
    <div class="opt-item">
      <div class="opt-header">
        <h4>${escapeHtml(opt.id)} · ${escapeHtml(opt.title)}</h4>
        <span class="priority ${prioClass(opt.priority)}">${escapeHtml(opt.priority)}</span>
      </div>
      <div class="opt-body">
        <div class="field"><strong>现状：</strong>${escapeHtml(opt.status_current || '—')}</div>
        <div class="field"><strong>竞品参照：</strong>${escapeHtml(opt.competitor_reference || '—')}</div>
        <div class="field"><strong>目标：</strong>${escapeHtml(opt.target || '—')}</div>
        <div class="field"><strong>依据：</strong>${evBadges} | ${escapeHtml(opt.rationale || '')}</div>
      </div>
    </div>`;
  }
  return html;
}

/** 数据源覆盖说明 */
function renderSourceCoverage(evidence) {
  const sourceTypes = [...new Set(evidence.map(e => e.source_type))];
  const typeNames = {
    official: 'Tier 0 · 官方',
    media: 'Tier 1 · 专业媒体',
    social: 'Tier 1 · B站/小红书/抖音',
    ecommerce: 'Tier 2 · 电商',
    community: 'Tier 2 · 社区',
    database: 'Tier 3 · 数据库',
  };
  let items = '';
  for (const type of sourceTypes) {
    const count = evidence.filter(e => e.source_type === type).length;
    items += `<li style="padding:4px 0">${typeNames[type] || type}：${count} 条证据</li>`;
  }
  return `<ul style="list-style:none;padding:0;font-size:14px">${items}</ul>`;
}

/** 证据链附录 */
function renderEvidenceAppendix(evidence) {
  let html = '';
  for (const ev of evidence) {
    html += `
    <li>
      <span class="ev-id">${ev.id}</span>
      <span class="ev-detail">
        ${escapeHtml(ev.claim)}
        <span class="source-tag">[${ev.source_type}·${ev.tier}·${ev.verification_level}]</span>
      </span>
    </li>`;
  }
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// Main
// ============================================================
async function main() {
  const argv = minimist(process.argv.slice(2));
  const category = argv.category || argv.c || 'headphones';
  const buildTime = argv.time || argv.t || new Date().toISOString().split('T')[0];
  const skipQA = argv['skip-qa'] || false;

  console.log(`\n🔨 3C 构建管线 — 品类：${category} | 时间：${buildTime}\n${'─'.repeat(50)}`);

  // Step 1: QA (unless skipped)
  if (!skipQA) {
    console.log('\n📋 Step 1: QA 闸门');
    try {
      execSync(`node "${path.join(__dirname, 'qa.mjs')}" --category ${category}`, {
        cwd: ROOT,
        stdio: 'inherit',
      });
    } catch {
      console.error('\n❌ QA 未通过，构建中止。请修复后重试。');
      process.exit(1);
    }
  } else {
    console.log('\n⚠️ 跳过 QA 闸门（--skip-qa）');
  }

  // Step 2: Load data
  console.log('\n📂 Step 2: 加载数据');
  const dataDir = path.join(ROOT, 'data', category);
  const evidenceData = loadJSON(path.join(dataDir, 'evidence.json'));
  const evidence = evidenceData.evidence || [];
  const prdData = evidenceData.prd_draft || {};
  const verifications = evidenceData.verifications || [];

  console.log(`  证据：${evidence.length} 条`);
  console.log(`  核验记录：${verifications.length} 条`);
  console.log(`  PRD 优化点：${(prdData.optimizations || []).length} 个`);

  // Step 3: Load template
  console.log('\n📄 Step 3: 注入模板');
  const templatePath = path.join(ROOT, 'templates', 'index-base.html');
  let html = loadText(templatePath);

  // Step 4: Replace placeholders
  const replacements = {
    '{{CATEGORY_DISPLAY}}': (evidenceData.category_display || category),
    '{{CATEGORY_BADGE}}': `3C竞品分析 · ${(evidenceData.category_display || category)}`,
    '{{BUILD_DATE}}': buildTime,
    '{{DATA_WINDOW}}': evidenceData.data_window || `${buildTime}`,
    '{{VERSION}}': evidenceData.version || '1.0.0',
    '{{EVIDENCE_COUNT}}': String(evidence.length),
    '{{COMPETITOR_OVERVIEW_TABLE}}': renderOverview(evidence, prdData),
    '{{USER_PAINPOINTS}}': renderPainpoints(evidence),
    '{{COVERAGE_ITEMS}}': renderCoverage(evidence),
    '{{OPTIMIZATION_ITEMS}}': renderOptimizations(prdData.optimizations || []),
    '{{DATA_SOURCE_COVERAGE}}': renderSourceCoverage(evidence),
    '{{EVIDENCE_APPENDIX}}': renderEvidenceAppendix(evidence),
  };

  for (const [token, value] of Object.entries(replacements)) {
    html = html.replace(token, value);
  }

  // Step 5: Write output
  console.log('\n💾 Step 4: 写入输出');
  const outputPath = path.join(dataDir, 'index.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`  ✅ ${path.relative(ROOT, outputPath)} (${(html.length / 1024).toFixed(1)} KB)`);

  // Step 6: Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ 构建完成！\n`);
  console.log(`  报告：${path.relative(ROOT, outputPath)}`);
  console.log(`  预览：file://${outputPath}\n`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
