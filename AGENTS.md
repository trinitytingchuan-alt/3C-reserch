# AGENTS.md — 新公司产品需求挖掘框架（Product Opportunity Mining）

本仓库对**任意公司**进行：市场/竞品分析 → 真实用户声音（VOC）收集 → 证据链推导（E##/V##）→ TOP5 产品功能需求（PRD）→ 单文件 HTML 报告。当前活跃实现为 `new-idea/`（参考案例：`data/anker`，安克创新）。

## 项目结构（活跃部分）

```
new-idea/
├── AGENTS.md（本文件在仓库根）
├── docs/                   ← 方法论文档
│   ├── methodology.md        分析 SOP（含根因多点验证 & 场景数据源规则）
│   ├── agent-architecture.md 四层 Agent 架构（感知/推理/行动/记忆）+ 信息源推导逻辑
│   ├── data-source-strategy.md 按核心客群地理定向配置采集渠道
│   ├── market-validation-loop.md 新功能 IDEA 市场验证闭环（五源强支撑）
│   ├── evidence-standard.md  证据链 E##/V## 规范
│   ├── claim-discipline.md   断言纪律
│   └── scoring-model.md      评分模型
├── data/                   ← 公司数据工作区（data/<company>/{raw,evidence.json,ideas.json,...}）
├── templates/report-template.html ← 渲染引擎 + 参考数据（新公司替换内联数据）
├── harness/                ← 质量保障 build/qa/rules/lock（QA 含市场验证闭环五维校验）
├── scripts/
│   ├── new-company.sh        ★ 新公司需求收集入口（见下）
│   ├── calc-scores.mjs       评分计算
│   ├── validate-html.mjs     产物校验
│   └── serve.mjs             本地预览
└── output/index.html        ← 构建产物
```

---

## ★ 新公司需求收集入口（不把页面写死）

**用户每次给出新公司，必须走以下流程，禁止直接改死页面：**

```powershell
# Windows PowerShell（推荐）：
Set-ExecutionPolicy -Scope Process Bypass          # 首次放行当前会话
.\scripts\new-company.ps1 <company> [显示名]
#    例: .\scripts\new-company.ps1 xiaomi 小米

# git-bash / WSL 环境：
bash scripts/new-company.sh <company> [显示名]

# 2. 按脚本打印的 8 步工作流采集与产出（见脚本输出）
# 3. 构建校验
node harness/build.mjs --company <company>    # 要求 0 ERROR / 0 WARN
```

**AI 采集工作流（不可跳过）：**
0. **数据源差异化配置**：判定核心客群地理（海外/国内），写入 `company-profile.json.dataSourceStrategy` 定向渠道（海外→Amazon/Reddit/Trustpilot/Google Trends；国内→京东/知乎/小红书/百度指数），见 `docs/data-source-strategy.md`
1. **调研**：加载并遵守所选分析 skill（见「技能引用」）做市场/竞品/用户声音采集
2. **用户声音**：收集真实用户痛点（评论/社区/社媒），每条附**可点击链接 + 真实日期**，存入 `data/<company>/raw/voices/`
3. **竞品缺口**：识别 3-5 竞品近 18 个月新品类/功能（带验证信号），存入 `raw/competitors/`
4. **趋势扫描**：搜索趋势/行业报告，存入 `raw/research/`
5. **结构化数据**：写入 `data/<company>/` 的 evidence.json / ideas.json / scores.json / verification.json；每条 TOP5 IDEA 填 `validationChain` 五源强支撑（市场声音/竞品验证/行业验证/参考行业验证/用户声音≥2），见 `docs/market-validation-loop.md`
6. **PRD 草稿**：按 `prd-draft.md` 模板写场景与根因（见下方硬性规则）
7. **渲染**：把 `templates/report-template.html` 内联数据（IDEAS/EVIDENCE/PRDS/SCORES/DERIVATION/GTMS/VERIFICATIONS）替换为新公司内容
8. **构建校验**：`node harness/build.mjs --company <company>`，QA 0 ERROR / 0 WARN，再浏览器实测链接

**Agent 架构**：本框架按四层专业 Agent 架构组织（感知/推理/行动/记忆），四层解耦可扩展，信息源推导逻辑详见 `docs/agent-architecture.md`（基于 ECC + Superpowers）。

---

## 技能引用（Skill Reference）

用户要求引用市场分析/竞品分析/证据链推导类 skill。**经检索，最符合当前场景的组合：**

| Skill | 作用 | 引用方式 |
|-------|------|----------|
| **competitive-analysis-zh**（SkillHub, @olina1ye） | 中文竞品分析：竞品对比矩阵、功能差异表、用户定位等多维情报，最贴合本报告「竞品缺口 → 需求形态」推导 | 每次新公司竞品调研时加载 |
| **gemini-deep-research**（SkillHub） | 深度多方信源收集与交叉验证，支撑「根因多点验证」 | 采集市场/趋势证据时加载 |
| 内置 **brainstorming / using-superpowers** | 产出前对齐目标与约束，复杂任务拆解 | 每次任务开始前 |

> 安装：`codebuddy skill install competitive-analysis-zh`（若未安装）。安装失败时，以本仓库 `docs/methodology.md` 的 SOP 为准（其根因多点验证规则即是对该能力的落地实现）。

---

## 硬性规则（数据可信度红线）

### 1. 证据链 E## 必须可溯源
- 每条证据：`source` + **真实可点击 URL** + **真实日期** + `summary`，且**链接内容与 summary 表述一致**
- 单点来源只能算「假设」，不得直接定义为「根因」
- 伪造/失效/内容不符的链接必须替换或修正（QA 前逐条联网核验）

### 2. 根因多点验证（Root-Cause Multi-Source Validation）
凡推导链标注「→ 直接定义根因」的结论必须满足：
- **≥ 2 个独立来源**交叉验证（不同发布方，非转载）
- 在 `DERIVATION` 中显式列出交叉证据（`cross` 字段）
- 单一来源 → 降级为「假设/待验证」，不得写入根因表述

### 3. 用户场景必须挂真实数据源
- 每个场景（User Scenario）附来源引用：`真实用户声音` / `媒体报道` / `官方来源`（标签 + 链接 + 日期）
- 场景来自真实用户声音收集，禁止虚构；无来源的场景不得进入 PRD

### 4. verify_first / claim_discipline / feature_compare_logic
- 现状三级核验（L1 端内/官方 / L2 专业媒体/行业报告 / L3 社区/电商/社媒）；不伪称「竞品无某功能」
- 同类可比：用户功能 vs 用户功能、平台机制 vs 平台机制，严禁跨维度混比

### 5. 市场验证闭环（五源强支撑）— 进入 TOP5 前置硬门槛
每条 TOP5 新功能 IDEA 必须满足五类数据源强支撑，缺任一维度 QA 报错并降级：
- **市场声音**（市场够大且在增长）+ **竞品验证**（同类已被接受）+ **行业验证**（上升通道）+ **参考行业验证**（路径可复用）+ **用户声音**（≥2 独立来源真实痛点）
- 在 `ideas.json` 的 `validationChain` 中显式列出，QA 强制校验，见 `docs/market-validation-loop.md`

---

## Harness 质量保障（硬闸门）

```bash
node harness/qa.mjs --company anker     # QA 校验（evidence/ideas/scores 一致性等）
node harness/build.mjs --company anker  # 构建（自动跑 QA，0 ERROR / 0 WARN 才产出）
node harness/lock.mjs --update          # 内容基线锁定（仅在内容评审通过后）
```

### 三阶段验收
| 阶段 | 触发条件 | 必须执行 |
|------|----------|----------|
| 采集后 | 写入 data/<company>/ JSON | QA（0 ERROR） |
| 发布前 | 生成报告 | build（自动 QA） |
| 变更后 | 修改 evidence/PRD | lock 重建基线 |

---

## 报告设计规范
- 沿用 `templates/report-template.html` 内置设计系统（字体/色彩/留白令牌），不另起风格
- 全部来源以 `.src-link` 外链呈现（`target="_blank"`，可点击跳转），场景来源带类型标签
- 产出后浏览器实测：页面渲染、链接可跳转、无控制台错误

---

## 工作模式速查

### 更新现有公司报告（如按当前时间更新）
1. 修改 `templates/report-template.html` 内联数据 或 `data/<company>/` JSON
2. `node harness/build.mjs --company <company>`（自动 QA）
3. 浏览器预览验证链接与渲染
4. 内容评审通过后 `node harness/lock.mjs --update` 重建基线

### 每次改动后
- 新增/修改证据 → 补全 V## 核验记录 + 联网核验 URL 有效性
- 新引用证据编号 → 确保该 E## 存在且已挂 URL（防幽灵引用/死链）
