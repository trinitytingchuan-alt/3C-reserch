<#
.SYNOPSIS
  初始化新品类工作区 — 在 data/ 下创建完整的子目录结构

.DESCRIPTION
  为 3C 竞品分析框架初始化新品类（耳机/手表/音箱/其他），
  自动创建 raw/ 子目录、evidence.json 骨架、prd-draft.md 模板。

.PARAMETER Name
  品类目录名（英文，如 headphones、smartwatch、speaker）

.PARAMETER DisplayName
  品类中文显示名（如 "耳机"、"智能手表"、"音箱"）

.EXAMPLE
  .\scripts\new-category.ps1 -Name "smartwatch" -DisplayName "智能手表"

.EXAMPLE
  .\scripts\new-category.ps1 -Name "earbuds" -DisplayName "真无线耳机"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Name,

    [Parameter(Mandatory=$true)]
    [string]$DisplayName
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot | Split-Path -Parent
$DataDir = Join-Path $Root "data" $Name

# Check if already exists
if (Test-Path $DataDir) {
    Write-Warning "品类目录已存在：$DataDir"
    $confirm = Read-Host "是否覆盖？（输入 yes 确认）"
    if ($confirm -ne "yes") {
        Write-Host "已取消。" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "`n🔧 初始化品类工作区：$DisplayName ($Name)`n" -ForegroundColor Cyan

# Create directory tree
$dirs = @(
    $DataDir,
    (Join-Path $DataDir "raw"),
    (Join-Path $DataDir "raw\ecommerce"),
    (Join-Path $DataDir "raw\media"),
    (Join-Path $DataDir "raw\community"),
    (Join-Path $DataDir "raw\official"),
    (Join-Path $DataDir "raw\database"),
    (Join-Path $DataDir "raw\social")
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  📁 $($dir.Replace($Root, '').TrimStart('\'))"
}

# Create evidence.json skeleton
$evidence = @{
    category = $Name
    category_display = $DisplayName
    version = "1.0.0-draft"
    created_at = (Get-Date -Format "yyyy-MM-dd")
    data_window = "$((Get-Date).AddMonths(-3).ToString('yyyy-MM-dd')) ~ $((Get-Date).ToString('yyyy-MM-dd'))"
    evidence = @()
    verifications = @()
    prd_draft = @{
        last_updated = (Get-Date -Format "yyyy-MM-dd")
        optimizations = @()
    }
} | ConvertTo-Json -Depth 4

$evidencePath = Join-Path $DataDir "evidence.json"
$evidence | Out-File -FilePath $evidencePath -Encoding utf8
Write-Host "  📄 evidence.json (骨架)" -ForegroundColor Green

# Create prd-draft.md skeleton
$prdContent = @"
# $DisplayName · 竞品分析 PRD 草案

> 数据窗口：$($evidence.data_window) | 版本：1.0.0-draft

## 1. 分析范围

- **品类**：$DisplayName
- **目标竞品**：（待填写）
- **分析维度**：（待填写）

## 2. 竞品现状总览

（待采集证据后填写）

## 3. 用户痛点

（待分析电商评论 / 社区讨论后填写）

## 4. TOP 优化建议

### P0 — 立即跟进
（待分析）

### P1 — 规划排期
（待分析）

### P2 — 持续观察
（待分析）

## 5. 数据源覆盖

（待标注各 Tier 覆盖情况）

---

*此文档由 Agent 辅助生成，所有断言均需标注证据编号。*
"@

$prdPath = Join-Path $DataDir "prd-draft.md"
$prdContent | Out-File -FilePath $prdPath -Encoding utf8
Write-Host "  📄 prd-draft.md (模板)" -ForegroundColor Green

# Create raw/ subdirectory README
$rawReadmeContent = @"
# $DisplayName — 原始证据

按来源类型分类存放：

| 子目录 | 来源类型 | 文件命名规范 |
|--------|----------|--------------|
| `ecommerce/` | Tier 2 · 京东/天猫/亚马逊 | `{平台}_{日期}_{主题}.md` |
| `media/` | Tier 1 · 专业媒体 | `{媒体}_{日期}_{主题}.md` |
| `community/` | Tier 2 · 社区讨论 | `{平台}_{日期}_{主题}.md` |
| `official/` | Tier 0 · 官方资料 | `{品牌}_{日期}_{主题}.md` |
| `database/` | Tier 3 · 数据库 | `{来源}_{日期}_{主题}.md` |
| `social/` | Tier 1 · B站/小红书/抖音 | `{平台}_{日期}_{主题}.md` |

将所有采集到的原始证据归档后，提取关键数据到 `../evidence.json`。
"@

$rawReadmePath = Join-Path $DataDir "raw" "README.md"
$rawReadmeContent | Out-File -FilePath $rawReadmePath -Encoding utf8

Write-Host "`n✅ 品类工作区已就绪：$DataDir`n" -ForegroundColor Green
Write-Host "下一步：" -ForegroundColor Yellow
Write-Host "  1. 采集原始证据到 data/$Name/raw/" -ForegroundColor Yellow
Write-Host "  2. 结构化证据写入 data/$Name/evidence.json" -ForegroundColor Yellow
Write-Host "  3. 编写 PRD → data/$Name/prd-draft.md" -ForegroundColor Yellow
Write-Host "  4. 运行 QA → node harness/qa.mjs --category $Name" -ForegroundColor Yellow
Write-Host "  5. 构建报告 → node harness/build.mjs --category $Name`n" -ForegroundColor Yellow
