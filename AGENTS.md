# AGENTS.md — 3C 竞品 & 用户声音分析框架

本目录是「专业 Agent 架构驱动的竞品分析与用户声音（VOC）研究框架」，用于对任意 3C 电子消费品（耳机、手表、音箱等）进行：同类竞品优缺点拆解 → TOP 可优化点挖掘 → PRD 文档产出 → GitHub Pages 发布的单文件 HTML 报告。

## 项目结构

```
3C/
├── AGENTS.md              ← 你在这里（流程总纲）
├── README.md              ← 项目说明 & 快速上手
├── docs/                  ← 方法论文档 + superpowers 审视记录
│   ├── methodology.md       分析 SOP
│   ├── evidence-standard.md 证据链 E##/V## 规范
│   ├── data-source-map.md   数据源地图（B站/小红书/抖音）
│   ├── claim-discipline.md  三大硬规则
│   └── superpowers/         工作流审视报告
├── data/                  ← 多品类数据工作区
├── templates/             ← 报告模板（含设计系统声明）
├── harness/               ← 完整质量保障（rules/qa/lock/build）
├── scripts/               ← 工具脚本（init/publish）
└── output/                ← 发布追踪（releases.json）
```

---

## 强制工作流（superpowers 方法论）

**任何任务开始前，必须先调用 `using-superpowers` 技能。** 本项目已内置 `.codebuddy/skills/` 下全套 superpowers 技能集。

### 硬性流程门槛（不可跳过）

1. **brainstorming（必做）** — 采集/产出前先对齐目标、约束、成功标准；设计文档到 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` 并经审批。
2. **verification-before-completion（必做）** — 完成前必须跑通全部 harness 校验，**禁止"看起来完成了就交付"**。
3. **requesting-code-review（产出后）** — 数据/PRD/报告产出后做一次逻辑合理性审查（可用 code-explorer 扮演产品经理）。
4. **writing-plans / executing-plans** — 复杂任务拆解推进。

> ⚠️ superpowers 是**软流程**（指引方法），harness 是**硬闸门**（强制校验）。两者必须同时满足才算完成。

---

## 三大硬规则（数据可信度红线）

### 1. verify_first — 现状三级核验
任何竞品功能断言必须经至少一级核验：
- **L1 端内实测**：真机/模拟器可复现
- **L2 官方渠道**：官网规格书/固件日志/官方公告
- **L3 第三方**：RTINGS/DXOMARK/专业博主/电商参数

未核验的断言不得作为对比依据。每个 E## 必须标注核验级别。

### 2. claim_discipline — 断言纪律
- **红线 1**：不伪称"竞品无某功能" → 只能说"未在 L1/L2/L3 中发现"并标注核验方式+数据窗口
- **红线 2**：不立不可观测行为的伪需求 → 只能分析可观测/可测量目标，**禁止推测内部算法/策略/运营/供应链**（QA 会自动拦截）

### 3. feature_compare_logic — 同类可比
- 用户功能 vs 用户功能、平台机制 vs 平台机制
- **严禁跨维度混比**（用户侧功能 ≠ 供给侧平台机制）

---

## Harness 质量保障（稳定输出的硬闸门）

Harness 提供 **13 项 QA 校验** + 基线锁定 + 构建管线，是质量稳定的核心。

### 13 项 QA 校验清单

| # | 检测 | 严重度 | 作用 |
|---|------|--------|------|
| 1 | 证据数量 ≥ 阈值 | ERROR | 数据充足性 |
| 2 | 每优化点 ≥ 2 证据 | ERROR | PRD 依据充分 |
| 3 | 数据源 Tier ≥ 3 | ERROR | 来源广度 |
| 4 | 无跨维度混比 | ERROR | 对比逻辑正确 |
| 5 | 无"竞品无X"断言 | ERROR | 断言纪律 |
| 6 | 无 AI 黑话 | WARNING | 去 AI 味 |
| 7 | 证据字段完整性 | ERROR | 结构规范 |
| 8 | 数字断言有出处 | WARNING | 数据溯源 |
| 9 | **无幽灵引用**（引用的 E## 必须存在） | ERROR | 引用真实性 |
| 10 | **无孤儿证据**（E## 都被使用） | WARNING | 证据利用 |
| 11 | **无不可观测推测**（算法/策略/供应链） | ERROR | 断言纪律 |
| 12 | **E##↔V## 一一对应 + final_level 合法** | ERROR | 核验可信 |
| 13 | **设计系统声明 + 反陈词滥调** | WARNING | 设计质量 |

### 命令

```bash
# QA 校验（13 项）
node harness/qa.mjs --category headphones

# 基线锁定（evidence/PRD 变更后必须执行）
node harness/lock.mjs --category headphones

# 构建报告（自动跑 QA + 幽灵引用双保险 + 注入设计系统）
node harness/build.mjs --category headphones --time 2026-08-11

# 基线校验（确认内容无漂移）
node harness/lock.mjs --category headphones --check
```

### 三阶段验收闸门

| 阶段 | 触发条件 | 必须执行 |
|------|----------|----------|
| **采集后** | 写入 evidence.json | QA（0 ERROR） |
| **发布前** | 生成报告 | build（自动 QA + 幽灵引用拦截） |
| **变更后** | 修改 evidence/PRD | lock 重新建立基线 |

---

## 报告设计规范（web-design-engineer）

报告 HTML 必须满足以下设计门槛，避免 AI 趋同设计（Inter 字体+蓝紫渐变+大圆角卡片）：

### 设计系统声明
- 模板内置 `:root` CSS 变量（字体/色彩/间距令牌），build 时注入详细设计声明
- 反陈词滥调：禁用默认蓝 `#3b82f6`、裸 `Inter` 堆叠、无目的居中

### 设计要求
1. **明确的字体选择**：font-sans/font-mono 令牌，非默认堆叠
2. **感知均匀色彩**：oklch/HSL 中性色阶，禁用紫粉渐变
3. **充足留白与层级**：8px 网格、卡片间距、层级清晰
4. **诚实占位符**：无素材用 `[icon]` 标记，不塞劣质 SVG

> 设计详细方法论参考 `web-design-engineer` skill（可用 `use_skill` 加载）。

---

## 数据来源（3C 品类 · 2026 版）

### Tier 0 — 官方一手数据
品牌官网规格书、固件/FOTA 日志、官方社区公告、3C 认证（CCC/SRRC/工信部）

### Tier 1 — 专业媒体 & KOL
RTINGS、DXOMARK、SoundGuys、LTT；**B站 3C UP主、小红书测评、抖音测评**；拆解（iFixit/充电头网）

### Tier 2 — 电商 & 社区用户声音
京东/天猫/亚马逊（差评分析）、Reddit/知乎/贴吧/酷安/什么值得买、HiFi 论坛

### Tier 3 — 第三方数据库
RTINGS Compare、GSMArena、Geekbench、慢慢买/Keepa

---

## 工作模式

### 初始化新品类
```powershell
# 注意：PowerShell 默认禁止脚本，首次需放行当前会话
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\new-category.ps1 -Name "smartwatch" -DisplayName "智能手表"
```

### 分析流程（必须按序，缺一不可）
1. **brainstorming** → 确定品类/竞品/分析维度
2. 初始化 `data/{category}/` 工作区
3. 采集原始证据到 `raw/` 子目录（按 Tier 分层）
4. 结构化证据 → `evidence.json`（E##+出处+核验级别）
5. 撰写核验记录 → `verification.json`（V##，与 E## 一一对应）
6. 撰写 PRD → `prd-draft.md`（每条优化点 ≥2 条证据）
7. **QA 校验**（13 项，0 ERROR）
8. **基线锁定** `lock`
9. **构建报告** `build` → 检查设计质量
10. **发布** `publish` → gh-pages

### 每次改动后
- 修改 `evidence.json` / `prd-draft.md` → **必须**重跑 `lock` 更新基线
- 新增证据 → 补全 V## 核验记录
- 新引用证据编号 → 确保该 E## 真实存在（防幽灵引用）
