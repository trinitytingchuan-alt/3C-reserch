# 3C Harness — 质量保障体系

## 概述

Harness 是 3C 竞品分析框架的质量保障模块，确保每份产出：
- 证据链完整且可追溯
- 断言遵守三大硬规则（verify_first / claim_discipline / feature_compare_logic）
- 内容无预期外漂移
- 构建产物可复现

## 安装

```bash
cd harness
npm install
cd ..
```

## 核心工具

### 1. QA 闸门 — `qa.mjs`

在构建前自动校验所有质量规则：

```bash
node harness/qa.mjs --category headphones
```

检查项：
- 证据数量 ≥ 5 条
- 每个 PRD 优化点 ≥ 2 条证据
- 数据源覆盖 ≥ 3 个 Tier
- 无跨维度混比（用户功能 vs 平台机制）
- 无"竞品无某功能"类断言
- 无 AI 黑话（底座/飞轮/赋能/抓手...）
- 证据字段完整性
- 数字化断言均有 E## 引用

### 2. 基线锁定 — `lock.mjs`

对 `evidence.json` 和 `prd-draft.md` 建立 SHA-256 基线：

```bash
# 建立/更新基线
node harness/lock.mjs --category headphones

# 仅校验（不更新基线）
node harness/lock.mjs --category headphones --check
```

使用时机：
- 每次修改 `evidence.json` 或 `prd-draft.md` 后
- 内容评审通过后
- 构建前（如果 QA 有变更警告）

### 3. 构建管线 — `build.mjs`

读取数据 → QA 校验 → 注入模板 → 产出 HTML：

```bash
# 构建报告（自动跑 QA）
node harness/build.mjs --category headphones

# 指定构建日期
node harness/build.mjs --category headphones --time 2026-08-11

# 跳过 QA（不推荐，仅调试用）
node harness/build.mjs --category headphones --skip-qa
```

## 典型工作流

```bash
# 1. 采集证据后，编写 evidence.json + prd-draft.md
# 2. 运行 QA
node harness/qa.mjs --category headphones

# 3. 修复 QA 发现的问题
# 4. 建立基线
node harness/lock.mjs --category headphones

# 5. 构建 HTML
node harness/build.mjs --category headphones --time 2026-08-11

# 6. 打开发布
# file://.../data/headphones/index.html
```

## 文件结构

```
harness/
├── package.json      # 依赖声明（minimist）
├── rules.mjs         # 契约定义（阈值/检测模式/字段要求）
├── qa.mjs           # 质量闸门
├── lock.mjs         # 基线锁定（SHA-256）
├── build.mjs        # 构建管线（数据→HTML）
├── README.md        # 本文件
└── node_modules/    # 依赖（npm install 后）
```

## 契约文件

`rules.mjs` 集中定义了所有可配置的规则：
- `EVIDENCE_THRESHOLDS` — 证据数量/覆盖阈值
- `CLAIM_PATTERNS` — 违规表述的正则检测模式
- `TIER_REQUIREMENTS` — 数据源覆盖要求
- `EVIDENCE_FIELD_REQUIRED` — 证据必填字段
- `SEVERITY` — 严重等级（ERROR/WARNING/INFO）

修改阈值或新增检测模式时，编辑 `rules.mjs` 即可。
