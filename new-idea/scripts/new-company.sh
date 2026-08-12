#!/usr/bin/env bash
#
# =============================================================================
#  新公司产品需求收集入口  new-company.sh
# =============================================================================
#  用法:
#    bash scripts/new-company.sh <company> [显示名]
#    例: bash scripts/new-company.sh anker 安克创新
#    例: bash scripts/new-company.sh xiaomi 小米
#
#  作用:
#    1. 为一家新公司搭建 data/<company>/ 数据工作区（原始素材采集目录 + 规范数据骨架）
#    2. 生成该公司的证据/需求/评分/核验 JSON 骨架，与 anker 结构完全一致
#    3. 打印 AI 后续采集工作流（必须遵守 docs/methodology.md 的根因多点验证与场景数据源规则）
#
#  关键不变式:
#    - 模板 templates/report-template.html 是「渲染引擎 + 示例数据」，新增公司时
#      按本脚本生成骨架后，把采集结果写入 data/<company>/ 各 JSON，
#      再把内联 IDEAS/EVIDENCE/PRDS/SCORES/DERIVATION/GTMS/VERIFICATIONS 数据换成新公司内容。
#    - 不得把页面写死：任何新公司都必须走「采集 -> 数据文件 -> 构建」流程。
# =============================================================================

set -euo pipefail

COMPANY="${1:-}"
if [ -z "$COMPANY" ]; then
  echo "用法: bash scripts/new-company.sh <company> [显示名]"
  exit 1
fi
DISPLAY="${2:-$COMPANY}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="$ROOT/data/$COMPANY"

mkdir -p "$DATA_DIR/raw/research" \
         "$DATA_DIR/raw/voices" \
         "$DATA_DIR/raw/competitors"

# 未完成标记：QA 会跳过带 .incomplete 的公司；数据采集完毕后删除该文件再 build
touch "$DATA_DIR/.incomplete"

# ---------- 1. 公司档案 ----------
if [ ! -f "$DATA_DIR/company-profile.json" ]; then
cat > "$DATA_DIR/company-profile.json" <<EOF
{
  "company": "$COMPANY",
  "displayName": "$DISPLAY",
  "business": "",
  "products": [],
  "revenue": null,
  "userBase": null,
  "annualReportUrl": "",
  "dataWindow": "",
  "dataSourceStrategy": {
    "coreAudienceGeography": "overseas-primary",
    "userVoiceChannels": [],
    "competitorValidationChannels": [],
    "industryValidationChannels": [],
    "trendSignalChannels": [],
    "crossIndustryRefChannels": [],
    "language": "en",
    "note": "按核心客群地理位置定向配置采集渠道：海外为主→Amazon/Reddit/Trustpilot/Google Trends；国内为主→京东/知乎/小红书/百度指数。详见 docs/data-source-strategy.md"
  },
  "notes": "（采集自：官网/年报/招股书，须附真实链接与日期）"
}
EOF
fi

# ---------- 2. 证据链骨架 ----------
if [ ! -f "$DATA_DIR/evidence.json" ]; then
cat > "$DATA_DIR/evidence.json" <<EOF
[
  {
    "id": "E001",
    "source": "",
    "tier": 0,
    "level": "L1",
    "url": "",
    "date": "",
    "summary": "",
    "verified": false,
    "verification_level": "L1"
  }
]
EOF
fi

# ---------- 3. 需求想法骨架 ----------
if [ ! -f "$DATA_DIR/ideas.json" ]; then
cat > "$DATA_DIR/ideas.json" <<EOF
[
  {
    "id": "ID-001",
    "title": "",
    "discoveryPath": "competitor-gap",
    "category": "",
    "scene": "",
    "targetSegment": "",
    "painPoint": "",
    "solution": "",
    "competitorSignal": "",
    "differentiation": "",
    "evidenceIds": [],
    "verificationIds": [],
    "trendSignal": "",
    "tamEstimate": "",
    "validationChain": {
      "marketVoice": { "evidenceIds": [], "logic": "" },
      "competitorValidation": { "evidenceIds": [], "logic": "" },
      "industryValidation": { "evidenceIds": [], "logic": "" },
      "crossIndustryRef": { "evidenceIds": [], "logic": "" },
      "userVoice": { "evidenceIds": [], "logic": "" }
    }
  }
]
EOF
fi

# ---------- 4. 评分骨架 ----------
if [ ! -f "$DATA_DIR/scores.json" ]; then
cat > "$DATA_DIR/scores.json" <<EOF
[
  {
    "ideaId": "ID-001",
    "discoveryPath": "competitor-gap",
    "scores": {
      "product_expert": { "marketOpp": 0, "pain": 0, "trend": 0, "techFeas": 0, "competitiveMoat": 0, "unitEcon": 0, "strategicFit": 0, "uxPotential": 0, "execRisk": 0, "innovation": 0 },
      "market_expert": { "marketOpp": 0, "pain": 0, "trend": 0, "techFeas": 0, "competitiveMoat": 0, "unitEcon": 0, "strategicFit": 0, "uxPotential": 0, "execRisk": 0, "innovation": 0 },
      "user_expert": { "marketOpp": 0, "pain": 0, "trend": 0, "techFeas": 0, "competitiveMoat": 0, "unitEcon": 0, "strategicFit": 0, "uxPotential": 0, "execRisk": 0, "innovation": 0 }
    },
    "finalScore": 0,
    "evidenceIds": [],
    "verificationIds": [],
    "gtm": { "audience": "", "channel": "", "pricing": "", "entry": "", "northStar": "", "first100": "" }
  }
]
EOF
fi

# ---------- 5. 核验骨架 ----------
if [ ! -f "$DATA_DIR/verification.json" ]; then
cat > "$DATA_DIR/verification.json" <<EOF
[
  {
    "id": "V001",
    "evidence_id": "E001",
    "level": "L1",
    "method": "",
    "data_window": "",
    "conclusion": "",
    "date": "",
    "url": ""
  }
]
EOF
fi

# ---------- 6. PRD 草稿模板 ----------
if [ ! -f "$DATA_DIR/prd-draft.md" ]; then
cat > "$DATA_DIR/prd-draft.md" <<EOF
# $DISPLAY 产品机会挖掘草稿

> 遵守 docs/methodology.md：根因须多点验证（≥2 独立来源）；用户场景须挂真实数据源。

## 一、原始素材采集
- 场景采集（raw/voices/）：真实用户声音，须附链接+日期
- 竞品缺口（raw/competitors/）：3-5 个竞品 18 个月内的新品类/功能，附验证信号
- 趋势扫描（raw/research/）：搜索趋势/社媒/行业报告，附链接+日期

## 二、需求候选（TOP5 雏形）
| ID | 需求 | 根因（≥2 独立来源验证） | 场景（挂数据源） | 竞品缺口 |
|----|------|------------------------|------------------|----------|
|    |      |                        |                  |          |

## 三、PRD 输出要求
- 场景全部来自真实用户声音收集，附数据源引用
- 推导链：竞品缺口 + 痛点强度（多点验证）→ 因果主链，市场/战略/趋势做支撑
EOF
fi

echo ""
echo "============================================================"
echo "  已为新公司 [$DISPLAY]($COMPANY) 创建数据工作区:"
echo "    $DATA_DIR"
echo "============================================================"
echo ""
echo "后续采集工作流（请 AI 按此执行）:"
echo "  0) 数据源差异化: 判定核心客群地理(海外/国内), 填 company-profile.json.dataSourceStrategy 定向渠道 (docs/data-source-strategy.md)"
echo "  1) 调研: 用 competitive-analysis-zh / gemini-deep-research 采集市场/竞品/用户声音"
echo "  2) 用户声音: 收集真实用户痛点(评论/社区/社媒), 每条附链接+日期, 存入 raw/voices/"
echo "  3) 竞品: 识别 3-5 竞品近 18 个月新品类/功能, 存入 raw/competitors/"
echo "  4) 趋势: 搜索趋势/行业报告, 存入 raw/research/"
echo "  5) 填数据: 把采集结果写入 $DATA_DIR/ 各 JSON (evidence/ideas/scores/verification), 每条 TOP5 IDEA 填 validationChain 五源强支撑 (docs/market-validation-loop.md)"
echo "  6) 写 PRD: 按 prd-draft.md 模板输出场景+根因(≥2独立来源)"
echo "  7) 渲染: 更新 templates/report-template.html 内联数据为新公司内容"
echo "  8) 构建校验: node harness/build.mjs --company $COMPANY  (0 ERROR / 0 WARN)"
echo ""
echo "硬性规则: 根因多点验证(≥2独立来源) · 场景挂真实数据源 · 市场验证闭环五源强支撑 · 数据源按客群地理定向 · 全部链接可点击可溯源"
