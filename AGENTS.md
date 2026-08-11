# AGENTS.md — 3C 竞品 & 用户声音分析框架

本目录是「专业 Agent 架构驱动的竞品分析与用户声音（VOC）研究框架」，用于对任意 3C 电子消费品（耳机、手表、音箱等）进行：同类竞品优缺点拆解 → TOP 可优化点挖掘 → PRD 文档产出 → GitHub Pages 发布的单文件 HTML 报告。

## 项目结构

```
3C/
├── AGENTS.md              ← 你在这里
├── docs/                  ← 方法论文档（分析 SOP / 证据标准 / 数据源地图 / 硬规则）
├── data/                  ← 多品类数据工作区（按品类组织：headphones/ smartwatch/ speaker/）
├── templates/             ← 报告模板（index-base.html + 可复用 HTML 模块）
├── harness/               ← 完整质量保障体系（Node: rules / build / qa / lock）
├── scripts/               ← 工具脚本（初始化品类 / 发布 gh-pages）
└── output/                ← 发布追踪（releases.json）
```

## 强制工作流（superpowers 方法论）

本项目已内置 `.codebuddy/skills/` 下的 superpowers 技能集（brainstorming / writing-plans / executing-plans / test-driven-development / systematic-debugging / verification-before-completion / requesting-code-review / receiving-code-review / finishing-a-development-branch / subagent-driven-development 等）。

**任何开发或分析任务开始前，必须先调用 `using-superpowers` 技能，再按以下流程推进：**

1. **brainstorming（必做）** — 写代码/采集/产出前，先与用户对齐目标、约束、成功标准；输出设计文档到 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` 并经用户审批。
2. **writing-plans** — 设计批准后拆解为 2–5 分钟粒度的实施计划。
3. **executing-plans** — 按计划执行，重大事项用 subagent-driven-development 并行推进。
4. **verification-before-completion** — 完成前必须通过验证，禁止"看起来完成了就交付"。
5. **requesting-code-review** — 任务间强制代码/产出审查，严重问题阻断进度。
6. **finishing-a-development-branch** — 收尾、合并/提交、GitHub 推送。

## 项目约定

- HTML 产出形式：单文件 `index.html`，采用 skill `web-design-engineer`。
- 发布方式：GitHub Pages（独立 `gh-pages` 分支仅含 `index.html` + `.nojekyll`）。
- 远程仓库：`https://github.com/trinitytingchuan-alt/3C-reserch.git`（注意原拼写为 reserch）。
- 数据溯源：所有断言必须带可追溯出处（证据编号 E## / 数据集来源），凡已有出处的表述禁止改写描述。
- **数据分析前，先查看 `docs/` 下的四份方法论文档**（methodology.md / evidence-standard.md / data-source-map.md / claim-discipline.md）。

## 三大硬规则

### 1. verify_first — 现状三级核验

任何关于竞品功能的断言，必须经过三级核验之一：
- **L1 端内实测**：用真机/模拟器/固件录制画面，可复现
- **L2 官方渠道**：官网规格书、固件更新日志、官方社区公告
- **L3 第三方**：专业媒体评测（RTINGS/DXOMARK/专业博主）、电商页参数

未经任一核验的断言不得作为对比依据。每个 E## 证据必须标注核验级别。

### 2. claim_discipline — 断言纪律

两条红线：
- **不伪称"竞品无某功能"**：只能说"未在 L1/L2/L3 中发现"，并标注核验方式 + 数据窗口
- **不立不可观测行为的伪需求**：只能分析可观测、可测量的功能/性能，不得推测内部算法或商业策略

### 3. feature_compare_logic — 同类可比

功能对比必须同类可比：
- **用户功能 vs 用户功能**（如：耳机降噪模式 vs 耳机降噪模式）
- **平台机制 vs 平台机制**（如：固件更新策略 vs 固件更新策略）
- **严禁跨维度混比**（如：把用户侧功能与供给侧平台机制对标）

如果某个竞品不具备某功能 → 定位为**升级/补全**，而非从零建设。

## 数据来源（3C 品类 · 2026 版）

### Tier 0 — 官方一手数据
- 品牌官网产品页与规格书
- 固件/FOTA 更新日志
- 官方社区公告与 Beta 程序
- 3C 认证数据库（CCC/SRRC/工信部型号核准）

### Tier 1 — 专业媒体与 KOL 测评
- 专业媒体：RTINGS、DXOMARK、SoundGuys、Linus Tech Tips
- 中国专业平台：B站 3C UP主深度测评、小红书硬核测评笔记、抖音 3C 测评号
- 拆解/拆机（iFixit、充电头网、楼斌等）

### Tier 2 — 电商与社区用户声音
- 电商评论与问答：京东、天猫、亚马逊（含差评分析）
- 用户社区：Reddit（r/headphones r/AndroidWear）、知乎、贴吧、酷安、什么值得买
- 产品论坛：各品牌官方社区、HiFi论坛（耳机大家坛等）

### Tier 3 — 第三方数据库与工具
- 参数对比：RTINGS Compare、GSMArena（手表）
- 性能测试：Geekbench（手表/平板）、频响测量工具
- 价格追踪：慢慢买、Keepa、骆驼

## Harness 质量保障

构建/发布流程必须通过 harness 校验：

```bash
# 1. 建立基线（证据或 PRD 变更后执行）
node harness/lock.mjs --category headphones

# 2. 构建 HTML 报告（自动跑 QA 闸门）
node harness/build.mjs --category headphones --time 2026-08-11

# 3. 单独跑 QA 校验
node harness/qa.mjs --category headphones
```

QA 闸门检验项：
- 证据数量 ≥ 阈值（可配置）
- 每个 PRD 优化点 ≥ 2 条证据支撑
- 数据源覆盖 ≥ 3 个 Tier
- 无跨维度混比（用户功能 vs 平台机制）
- 无无出处断言
- content hash 与 baseline 一致（非时间字段）

## 工作模式

### 初始化新品类
```powershell
.\scripts\new-category.ps1 -Name "smartwatch" -DisplayName "智能手表"
```

### 分析流程
1. 确定品类与目标竞品 → 初始化 data/ 工作区
2. 采集原始证据到 raw/ 子目录（电商/社区/social/媒体/官方/数据库）
3. 结构化证据写入 evidence.json（E## 编号 + 出处 + 核验级别）
4. 撰写 PRD draft → prd-draft.md
5. 跑 harness/qa.mjs 校验
6. 构建 index.html → 发布 gh-pages
