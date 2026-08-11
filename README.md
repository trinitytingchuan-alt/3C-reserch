# 3C 竞品 & 用户声音分析框架

多品类 3C 电子消费品竞品分析框架 —— 从证据采集到 PRD 产出到 GitHub Pages 发布的完整管线。

## 支持的品类

| 品类 | 目录 | 状态 |
|------|------|------|
| 耳机 (Headphones) | `data/headphones/` | 就绪 |
| 智能手表 (Smartwatch) | `data/smartwatch/` | 待初始化 |
| 音箱 (Speaker) | `data/speaker/` | 待初始化 |

## 快速开始

```bash
# 1. 安装 harness 依赖
cd harness && npm install && cd ..

# 2. 初始化新品类
powershell -File scripts/new-category.ps1 -Name "smartwatch" -DisplayName "智能手表"

# 3. 采集证据到 data/smartwatch/raw/
# 4. 编写结构化证据 → data/smartwatch/evidence.json
# 5. 编写 PRD → data/smartwatch/prd-draft.md

# 6. QA 校验
node harness/qa.mjs --category smartwatch

# 7. 构建 HTML 报告
node harness/build.mjs --category smartwatch
```

## 核心链路

```
原始证据采集（raw/）
  → 结构化证据（evidence.json, E##+核验级别）
    → 竞品差距分析 → PRD 草稿（prd-draft.md）
      → harness QA 校验
        → build 注入模板 → index.html
          → git push gh-pages → 公网发布
```

## 数据来源

Tier 0（官方）→ Tier 1（专业媒体 & KOL，含 B站/小红书/抖音）→ Tier 2（电商 & 社区）→ Tier 3（数据库）

详见 `docs/data-source-map.md`

## 质量保障

完整 harness：`rules.mjs`（契约）→ `qa.mjs`（闸门）→ `lock.mjs`（基线）→ `build.mjs`（构建）

详见 `harness/README.md`

## 仓库

`https://github.com/trinitytingchuan-alt/3C-reserch.git`
