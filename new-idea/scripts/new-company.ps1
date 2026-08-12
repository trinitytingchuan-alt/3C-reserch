# =============================================================================
#  新公司产品需求收集入口  new-company.ps1  (Windows PowerShell 版)
# =============================================================================
#  用法:
#    Set-ExecutionPolicy -Scope Process Bypass   # 首次放行当前会话
#    .\scripts\new-company.ps1 <company> [显示名]
#    例: .\scripts\new-company.ps1 anker 安克创新
#
#  作用: 搭建 data/<company>/ 数据工作区（raw 采集目录 + 5 个 JSON 骨架 + PRD 草稿）
#  对应 bash 版: scripts/new-company.sh（git-bash / WSL 下使用）
# =============================================================================
param(
  [Parameter(Mandatory=$true)][string]$Company,
  [string]$Display = $Company
)

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dataDir = Join-Path $root "data\$Company"

foreach ($sub in @("raw\research", "raw\voices", "raw\competitors")) {
  New-Item -ItemType Directory -Force -Path (Join-Path $dataDir $sub) | Out-Null
}
# 未完成标记：QA 会跳过带 .incomplete 的公司；数据采集完毕后删除该文件再 build
New-Item -ItemType File -Force -Path (Join-Path $dataDir ".incomplete") | Out-Null

# 无 BOM UTF-8 写入（Windows PowerShell 5.1 的 Set-Content -Encoding UTF8 会带 BOM，
# 导致 node JSON.parse 失败），改用 .NET WriteAllText + UTF8Encoding(false)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
function Write-Skeleton($file, $content) {
  if (-not (Test-Path $file)) { [System.IO.File]::WriteAllText($file, $content, $utf8NoBom) }
}

Write-Skeleton (Join-Path $dataDir "company-profile.json") @"
{
  "company": "$Company",
  "displayName": "$Display",
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
"@

Write-Skeleton (Join-Path $dataDir "evidence.json") @"
[
  { "id": "E001", "source": "", "tier": 0, "level": "L1", "url": "", "date": "", "summary": "", "verified": false, "verification_level": "L1" }
]
"@

Write-Skeleton (Join-Path $dataDir "ideas.json") @"
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
"@

Write-Skeleton (Join-Path $dataDir "scores.json") @"
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
"@

Write-Skeleton (Join-Path $dataDir "verification.json") @"
[
  { "id": "V001", "evidence_id": "E001", "level": "L1", "method": "", "data_window": "", "conclusion": "", "date": "", "url": "" }
]
"@

Write-Skeleton (Join-Path $dataDir "prd-draft.md") @"
# $Display 产品机会挖掘草稿

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
"@

Write-Host ""
Write-Host "============================================================"
Write-Host "  已为新公司 [$Display]($Company) 创建数据工作区:"
Write-Host "    $dataDir"
Write-Host "============================================================"
Write-Host ""
Write-Host "后续采集工作流（请 AI 按此执行）:"
Write-Host "  0) 数据源差异化: 判定核心客群地理(海外/国内), 填 company-profile.json.dataSourceStrategy 定向渠道 (docs/data-source-strategy.md)"
Write-Host "  1) 调研: 用 competitive-analysis-zh / gemini-deep-research 采集市场/竞品/用户声音"
Write-Host "  2) 用户声音: 收集真实用户痛点(评论/社区/社媒), 每条附链接+日期, 存入 raw/voices/"
Write-Host "  3) 竞品: 识别 3-5 竞品近 18 个月新品类/功能, 存入 raw/competitors/"
Write-Host "  4) 趋势: 搜索趋势/行业报告, 存入 raw/research/"
Write-Host "  5) 填数据: 把采集结果写入 $dataDir 各 JSON (evidence/ideas/scores/verification), 每条 TOP5 IDEA 填 validationChain 五源强支撑 (docs/market-validation-loop.md)"
Write-Host "  6) 写 PRD: 按 prd-draft.md 模板输出场景+根因(≥2独立来源)"
Write-Host "  7) 渲染: 更新 templates/report-template.html 内联数据为新公司内容"
Write-Host "  8) 构建校验: node harness/build.mjs --company $Company  (0 ERROR / 0 WARN)"
Write-Host ""
Write-Host "硬性规则: 根因多点验证(≥2独立来源) · 场景挂真实数据源 · 市场验证闭环五源强支撑 · 数据源按客群地理定向 · 全部链接可点击可溯源"
