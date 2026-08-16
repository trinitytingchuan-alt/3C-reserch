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
0. **数据源地理定向**：判定核心客群地理写入 `company-profile.json.dataSourceStrategy`（海外→Amazon/Reddit/Trustpilot/Google Trends/x/facebook；国内→京东/知乎/小红书/百度指数）。
1. **调研**：加载竞品/证据链类 skill 做市场/竞品/用户声音采集。
2. **用户声音**：真实痛点每条附可点击链接+真实日期，存 `raw/voices/`。
3. **竞品缺口**：3-5 竞品近 12 个月新品类/功能（带验证信号），存 `raw/competitors/`。
4. **趋势扫描**：行业报告/搜索趋势，存 `raw/research/`。
5. **结构化数据**：写 evidence/ideas/scores/verification.json；每条 TOP5 IDEA 填 `validationChain` 五源强支撑。
6. **PRD 草稿**：场景+根因，按大厂 PRD 格式（背景/用户/场景/方案/指标/风险/排期），详实。
7. **渲染**：替换 `report-template.html` 内联数据（IDEAS/EVIDENCE/PRDS/SCORES/DERIVATION/GTMS/VERIFICATIONS）。
8. **构建校验**：`node harness/build.mjs --company <company>` 要求 0 ERROR / 0 WARN，再浏览器实测链接。

## 硬性规则（数据可信度红线）

1. **证据链 E## 可溯源**：每条 `source`+真实可点击 URL+真实日期+`summary`，链接内容与 summary 一致；单点来源仅算假设，不得定义根因；伪造/失效链接须替换。
2. **根因多点验证**：标「→ 直接定义根因」须 ≥2 独立来源交叉验证，并在 DERIVATION 显式列 `cross`；单一来源降级为「假设/待验证」。
3. **场景挂真实数据源**：每场景附标签+链接+日期（用户声音/媒体报道/官方来源），禁止虚构，无来源不进 PRD。
4. **verify_first / claim_discipline / feature_compare_logic**：三级核验（L1 端内官方/L2 专业媒体/L3 社区社媒）；不伪称「竞品无某功能」；同类功能可比，严禁跨维度混比。
5. **市场验证闭环（进 TOP5 前置硬门槛）**：每条 TOP5 须五源强支撑——市场声音+竞品验证+行业验证+参考行业验证+用户声音(≥2 独立来源)；`validationChain` 显式列出，QA 强制校验。
6. **数据质量准则**：每条 TOP5 须 ≥10 条强相关数据（S 级直接支撑≥4、A 级间接强关联≥3、B 级背景≤3），来源类型≥4 种；被>3 个 IDEA 引用的通用证据自动降级 B 级。
7. **推导链路闭环**：用户声音须场景+痛点；竞品验证须竞品行动+缺口；`validationChain` 各维度填 `chainLink` 显式描述跨维度因果。
8. **报告透出红线**：正文严禁透出 AI/Agent 术语、内部工作流指令(pipeline/harness/QA)、方法论内部机制(子权重/五源规则)、给 AI 的约束指令、内部文件名；用结论性语言替代过程性描述。

## TOP5 强制规则（用户强约束）

- **固定 5 个**，且**每个综合分 ≥ 90**（阈值 `TOP5_MIN_SCORE=90`）。
- 达标即进、不足 5 个时，**必须补强真实证据**重新收集新功能，直到收集到新的大于90评分的功能，禁止硬改分或占位。
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

### ⚠️ 强制规则：每次 UI/前端改动必须加载 `web-design-engineer` skill

任何对 `new-idea/output/index.html` 及其模板的**视觉/交互/排版改动**（包括一级页、二级界面 PRD/GTM、导航、卡片、证据链、颜色/字体/留白/间距、图片、动效等），**必须先调用 `use_skill("web-design-engineer")` 加载该 skill**，并按其完整工作流执行，禁止跳过：

1. **先声明设计读解（Design Read）**：artifact/audience/visual-language/mode，再动手。
2. **Step 3 声明设计系统**（Design Read + 设计方向五表盘），对照 `references/design-calibration.md`。
3. **Step 4 出 v0 草稿** → **Checkpoint 2** 自查（对照 `references/failure-patterns.md` 的失败模式：Cardification / Repeated section header / Micro-label noise / Shape drift / Decoration-drift / Toolbar-cheese 等）。
4. **自我迭代修复**后再输出，不直接"跑完就交付"。
5. **禁止**：跑完命令直接交付、跳过设计系统声明、用花哨渐变/阴影/emoji/过多圆角堆砌替代真正的设计判断。

违反即视为交付不合格，需重做。此规则由用户 2026-08-16 强制加入。

## 工作模式速查

- **更新现有报告**：改模板内联数据或 `data/<company>/` JSON → `build.mjs` → 浏览器验证 → `lock.mjs --update`。
- **每次改动后**：新增/修改证据→补 V## 核验+联网核验 URL；新引 E##→确认存在且挂 URL（防幽灵/死链）。
- **发布（gh-pages）**：产物 `output/index.html` 复制到部署目录，`git rm -rf .` 后仅 add `index.html`+`.nojekyll`，commit 推 gh-pages；本地预览 `node scripts/serve.mjs`(5173)。
- **git 代理**：若 `http.proxy` 指向未运行代理导致 push 失败，用 `git -c http.proxy= -c https.proxy= push` 直连。

## 自我进化机制（Self-Evolution Loop）

本机制用**外部权威标尺**持续校准产出，而非 AI 自写规则自查（自写自查无法进化）。每次改动产物后，必须运行进化闭环，未全绿禁止交付。

### 运行方式（WSL 环境）

```bash
# WSL 中执行（Windows 盘挂载于 /mnt/c、/mnt/d）
SK=/mnt/c/Users/Administrator/Desktop/zg/workbuddy/skills/self-evolution
cd "$SK"
# 1) 第三方标尺审计（html-validate v11 + axe-core v4 + AGENTS 红线）
node bin/audit.mjs "/mnt/c/Users/Administrator/Desktop/zg/NEW IDEA/new-idea/output/index.html" --report _audit.json
# 2) 进化闭环：审计 FAIL → 自动把问题沉淀为下方经验库 LESSON 并阻断交付；全 PASS → 允许交付
node bin/evolve.mjs
```

### 标尺来源（成熟、高验证、非自写）

- **html-validate v11**（GitLab 官方维护，推荐规则集 + WCAG 规则）：校验 HTML 结构合法性与 WCAG 可访问性基本项。
- **axe-core v4**（Deque Labs，GitHub 7280+★，WCAG 2.1/2.2 AA 引擎）：无障碍审计（alt / lang / 标题层级 / 链接文本 / 表格语义）。
- **AGENTS.md 红线**（本项目契约，对照第 1/5/8 条）：证据可溯源、TOP5 固定 5 个且 ≥90、正文严禁透出内部工作流/方法论机制词。

### 进化逻辑

1. 每次产出改动 → 跑 `evolve.mjs` → 调用 `audit.mjs` 取外部标尺结果。
2. 若标尺报 FAIL：自动将「问题 / 根因 / 修复」写入下方**经验库**，并 return 1（阻断交付），AI 须先修复再重跑。
3. 若全 PASS：记录达标，允许交付。
4. 经验库随每次失败持续累积——这就是「学习」：同类问题下次由标尺直接拦下，不再需要人工口头指出。

### 经验库（LESSONS — 由 self-evolution 自动沉淀）
> L6 [2026-08-16] AGENTS-redline/no-leak: 正文透出红线词: pipeline（AGENTS.md 第8条）
> 　根因：违反本项目 AGENTS.md 硬性契约（红线/数据可信度）
> 　修复：将透出词改为结论性语言，不暴露内部工作流/方法论机制
> L7 [2026-08-16] AGENTS-redline/contract: AGENTS.md 红线 1 项不通过
> 　根因：违反本项目 AGENTS.md 硬性契约（红线/数据可信度）
> 　修复：人工复核并修复

> L4 [2026-08-16] AGENTS-redline/no-leak: 正文透出红线词: pipeline（AGENTS.md 第8条）
> 　根因：违反本项目 AGENTS.md 硬性契约（红线/数据可信度）
> 　修复：将透出词改为结论性语言，不暴露内部工作流/方法论机制
> L5 [2026-08-16] AGENTS-redline/contract: AGENTS.md 红线 1 项不通过
> 　根因：违反本项目 AGENTS.md 硬性契约（红线/数据可信度）
> 　修复：人工复核并修复


> L1 [2026-08-16] AGENTS-redline/no-leak: 正文透出红线词 "QA 强制校验"（方法论页 m-cfg-i）
> 　根因：违反 AGENTS.md 第8条——向读者透出了内部工作流指令词（QA），应用结论性语言替代。
> 　修复：改为"每条入选需求须在市场/竞品/行业/参考行业/用户五类来源上均有可被核验的支撑"。[已修复]

> L2 [2026-08-16] html-validate/config: 配置中误写 wcag/h35、wcag/h24、wcag/h65 规则名（v11 不存在）
> 　根因：html-validate v11 的 WCAG 规则命名与旧版不同，无效规则名导致配置加载失败、标尺整体失效。
> 　修复：移除无效规则名，仅保留 v11 实际支持的 wcag/h37、h36、h63、h71；标尺恢复真实校验。[已修复]

> L3 [2026-08-16] 自我进化机制上线：标尺来自 html-validate v11（GitLab 官方）+ axe-core v4（Deque，7280+★），非自写规则；每次改动产物后须 `node bin/evolve.mjs`，未全绿禁止交付；审计 FAIL 自动沉淀为上方 LESSON。
> 　根因：此前为"自写规则自查"，永远在现状内打转、无法进化；改用外部权威标尺后才具备持续校准能力。
> 　修复：建立 workbuddy/skills/self-evolution（audit.mjs + evolve.mjs + lib 配置），并写入本机制章节。[已上线]

_（以下条目由 `bin/evolve.mjs` 在审计失败时自动追加，AI 不得手工编造；人工复核后可将已修复条目标注 `[已修复]`）_
