# AGENTS.md — 新公司产品需求挖掘框架（Product Opportunity Mining）

本仓库对**任意公司**进行：市场/竞品分析 → 真实用户声音（VOC）→ 证据链推导（E##/V##）→ TOP5 产品功能需求（PRD）→ 单文件 HTML 报告。活跃实现 `new-idea/`，首例 `data/anker`（安克创新）。

## 项目结构（活跃部分）

```
new-idea/
├── AGENTS.md                 本文件（仓库根另有同名片级总纲）
├── docs/                     methodology / agent-architecture / data-source-strategy
│                            market-validation-loop / evidence-standard / claim-discipline
│                            scoring-model / data-quality-criteria / derivation-logic-standard
├── data/<company>/           raw/ + evidence.json / ideas.json / scores.json / verification.json
├── templates/report-template.html   渲染引擎+内联数据（新公司替换）
├── harness/                  rules / qa / build / lock（硬闸门）
├── scripts/                  new-company.{sh,ps1} / calc-scores / validate-html / serve.mjs
└── output/index.html         构建产物
```

## 新公司需求收集入口（禁止直接改死页面）

```powershell
# PowerShell（推荐）：
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\new-company.ps1 <company> [显示名]      # 例: xiaomi 小米
# git-bash/WSL： bash scripts/new-company.sh <company> [显示名]
```

AI 采集工作流（8 步，不可跳过）：
0. **数据源地理定向**：判定核心客群地理写入 `company-profile.json.dataSourceStrategy`（海外→Amazon/Reddit/Trustpilot/Google Trends；国内→京东/知乎/小红书/百度指数）。
1. **调研**：加载竞品/证据链类 skill 做市场/竞品/用户声音采集。
2. **用户声音**：真实痛点每条附可点击链接+真实日期，存 `raw/voices/`。
3. **竞品缺口**：3-5 竞品近 18 个月新品类/功能（带验证信号），存 `raw/competitors/`。
4. **趋势扫描**：行业报告/搜索趋势，存 `raw/research/`。
5. **结构化数据**：写 evidence/ideas/scores/verification.json；每条 TOP5 IDEA 填 `validationChain` 五源强支撑。
6. **PRD 草稿**：场景+根因，按大厂 PRD 格式（背景/用户/场景/方案/指标/风险/排期）。
7. **渲染**：替换 `report-template.html` 内联数据（IDEAS/EVIDENCE/PRDS/SCORES/DERIVATION/GTMS/VERIFICATIONS）。
8. **构建校验**：`node harness/build.mjs --company <company>` 要求 0 ERROR / 0 WARN，再浏览器实测链接。

## 硬性规则（数据可信度红线）

1. **证据链 E## 可溯源**：每条 `source`+真实可点击 URL+真实日期+`summary`，链接内容与 summary 一致；单点来源仅算假设，不得定义根因；伪造/失效链接须替换。
2. **根因多点验证**：标「→ 直接定义根因」须 ≥2 独立来源交叉验证，并在 DERIVATION 显式列 `cross`；单一来源降级为「假设/待验证」。
3. **场景挂真实数据源**：每场景附标签+链接+日期（用户声音/媒体报道/官方来源），禁止虚构，无来源不进 PRD。
4. **verify_first / claim_discipline / feature_compare_logic**：三级核验（L1 端内官方/L2 专业媒体/L3 社区社媒）；不伪称「竞品无某功能」；同类可比，严禁跨维度混比。
5. **市场验证闭环（进 TOP5 前置硬门槛）**：每条 TOP5 须五源强支撑——市场声音+竞品验证+行业验证+参考行业验证+用户声音(≥2 独立来源)；`validationChain` 显式列出，QA 强制校验。
6. **数据质量准则**：每条 TOP5 须 ≥10 条强相关数据（S 级直接支撑≥4、A 级间接强关联≥3、B 级背景≤3），来源类型≥4 种；被>3 个 IDEA 引用的通用证据自动降级 B 级。
7. **推导链路闭环**：用户声音须场景+痛点；竞品验证须竞品行动+缺口；`validationChain` 各维度填 `chainLink` 显式描述跨维度因果。
8. **报告透出红线**：正文严禁透出 AI/Agent 术语、内部工作流指令(pipeline/harness/QA)、方法论内部机制(子权重/五源规则)、给 AI 的约束指令、内部文件名；用结论性语言替代过程性描述。

## TOP5 强制规则（用户强约束）

- **固定 5 个**，且**每个综合分 ≥ 90**（阈值 `TOP5_MIN_SCORE=90`）。
- 达标即进、不足 5 个时，**必须补强真实证据**把第 5 个真实上调至 ≥90，禁止硬改分或占位。
- 评分模型：`finalAggregateScore` = 10 维 DIMS 权重 × 4 角色专家加权 W；进 TOP5 卡 <90 即 QA ERROR。
- 报告 `initRemaining()` 首屏只渲染 `renderTop5Flat()`，其余重块（list/gtm/evidence/method/scoring-final）用 IntersectionObserver 视口惰性渲染（单文件内部分块方案，兼容 gh-pages）。

## Harness 质量保障（硬闸门）

```bash
node harness/qa.mjs --company anker    # QA：evidence/ideas/scores 一致、TOP5=5且≥90
node harness/build.mjs --company anker # 构建（自动 QA，0 ERROR/0 WARN 才产出）
node harness/lock.mjs --update          # 内容评审通过后重建 SHA-256 基线
```

三阶段验收：采集后→QA(0 ERROR)；发布前→build(自动 QA)；变更后→lock 重建基线。

## 报告设计规范

- 沿用 `report-template.html` 内置设计系统（字体/色彩/留白令牌）。
- 来源以 `.src-link` 外链（`target="_blank"`），场景来源带类型标签。
- 产物后浏览器实测：渲染、链接跳转、无控制台错误。

## 工作模式速查

- **更新现有报告**：改模板内联数据或 `data/<company>/` JSON → `build.mjs` → 浏览器验证 → `lock.mjs --update`。
- **每次改动后**：新增/修改证据→补 V## 核验+联网核验 URL；新引 E##→确认存在且挂 URL（防幽灵/死链）。
- **发布（gh-pages）**：产物 `output/index.html` 复制到部署目录，`git rm -rf .` 后仅 add `index.html`+`.nojekyll`，commit 推 gh-pages；本地预览 `node scripts/serve.mjs`(5173)。
- **git 代理**：若 `http.proxy` 指向未运行代理导致 push 失败，用 `git -c http.proxy= -c https.proxy= push` 直连。
