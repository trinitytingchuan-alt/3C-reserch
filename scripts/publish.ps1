<#
.SYNOPSIS
  发布品类分析报告到 GitHub Pages

.DESCRIPTION
  将 data/{category}/index.html 推送到 gh-pages 分支，
  GitHub Pages 会自动部署（约 1 分钟生效）。

.PARAMETER Category
  品类目录名（如 headphones、smartwatch）

.EXAMPLE
  .\scripts\publish.ps1 -Category headphones

.NOTES
  前提条件：
  - 远程仓库已配置（origin）
  - gh-pages 分支已存在
  - GitHub Pages 源已设为 gh-pages 分支根目录
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Category
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot | Split-Path -Parent
$SourceFile = Join-Path $Root "data" $Category "index.html"

# Check source exists
if (-not (Test-Path $SourceFile)) {
    Write-Error "报告文件不存在：$SourceFile`n请先运行：node harness/build.mjs --category $Category"
    exit 1
}

Write-Host "`n🚀 发布报告：$Category`n" -ForegroundColor Cyan
Write-Host "  源文件：$SourceFile" -ForegroundColor Gray
Write-Host "  大小：$((Get-Item $SourceFile).Length / 1KB) KB" -ForegroundColor Gray

# Check remote
try {
    $remote = git remote get-url origin 2>&1
    Write-Host "  远程仓库：$remote" -ForegroundColor Gray
} catch {
    Write-Error "未配置远程仓库（git remote get-url origin 失败）"
    exit 1
}

# Stash current work if any
$stashed = $false
$status = git status --porcelain 2>&1
if ($status) {
    Write-Host "  ⚠️ 工作区有未提交更改，将暂存 (git stash)" -ForegroundColor Yellow
    git stash push -m "publish-$Category-auto-stash" 2>&1 | Out-Null
    $stashed = $true
}

# Switch to gh-pages
$currentBranch = git branch --show-current 2>&1
Write-Host "  当前分支：$currentBranch" -ForegroundColor Gray

try {
    git checkout gh-pages 2>&1 | Out-Null
    Write-Host "  已切换到 gh-pages 分支" -ForegroundColor Gray
} catch {
    Write-Host "  gh-pages 分支不存在，正在创建..." -ForegroundColor Yellow
    git checkout --orphan gh-pages 2>&1 | Out-Null
    git rm -rf . 2>&1 | Out-Null
}

# Clean and copy
Write-Host "  清理 gh-pages 分支内容..." -ForegroundColor Gray
git rm -rf . 2>&1 | Out-Null

# Copy report + .nojekyll
$targetDir = Join-Path $Root "data" $Category
Copy-Item $SourceFile -Destination "$Root\index.html" -Force
New-Item -ItemType File -Path "$Root\.nojekyll" -Force | Out-Null

# Commit and push
git add index.html .nojekyll 2>&1 | Out-Null
$commitMsg = "publish: $Category report ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
git commit -m $commitMsg 2>&1 | Out-Null
Write-Host "  提交：$commitMsg" -ForegroundColor Gray

Write-Host "  正在推送到远程..." -ForegroundColor Gray
git push -u origin gh-pages --force 2>&1 | Out-Null
Write-Host "  ✅ 已推送！" -ForegroundColor Green

# Switch back
git checkout $currentBranch 2>&1 | Out-Null
Write-Host "  已切回分支：$currentBranch" -ForegroundColor Gray

# Pop stash
if ($stashed) {
    git stash pop 2>&1 | Out-Null
    Write-Host "  已恢复暂存更改" -ForegroundColor Gray
}

# Determine URL from remote
$repoName = ($remote -replace '.*[:/]([^/]+/[^/]+?)(\.git)?$', '$1')
$githubIO = ($repoName -split '/')[0] + ".github.io"
$repoShort = ($repoName -split '/')[1]
$url = "https://$githubIO/$repoShort/"

Write-Host "`n✅ 发布完成！" -ForegroundColor Green
Write-Host "  🔗 公网地址：$url" -ForegroundColor Cyan
Write-Host "  ⏱️ GitHub Pages 部署约需 1 分钟生效`n" -ForegroundColor Yellow
