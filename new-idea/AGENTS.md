# NEW IDEA — Agent 总纲

> **路径**：`new-idea/` 子项目，位于 3C-reserch 仓库 main 分支  
> **目标**：输入任意公司 → 场景/客群/痛点/竞品/趋势五维采集 → 三专家评审 → 交叉验证 → TOP5 产品需求 + PRD → 高科技 HTML 报告  
> **首例 demo**：安克 Anker Innovations

---

## 核心原则

### 四大硬规则（不可违反，QA 闸门强制执行）

1. **VERIFY_FIRST**（三级核验）：L1 端内实测/官方渠道 → L2 专业媒体/行业报告 → L3 社区/电商评论。不可采集即视为功能缺失。
2. **CLAIM_DISCIPLINE**（断言纪律）：不伪称"该公司无此能力"，不立不可观测行为的伪需求，所有差距须标核验方式+数据窗口。
3. **SCENE_FIRST**（场景优先）：严禁产品优先采样。需求必须源自客群真实生活场景痛点、或竞品已验证市场缺口、或跨行业迁移方案。每条 IDEA 必须标注发现路径（scene-pain | competitor-gap | cross-industry）。
4. **DATA_GEO**（数据源地理定向）：数据源必须按核心客群所在地理位置差异化配置（`company-profile.json.dataSourceStrategy`）。海外客群 → Amazon/Reddit/Trustpilot/Google Trends；国内客群 → 京东/知乎/小红书/百度指数。禁止用错地理渠道误判需求。见 `docs/data-source-strategy.md`。

### 四层 Agent 架构（基于 ECC + Superpowers）

本框架按专业 Agent 架构组织，四层解耦、可独立扩展。完整设计见 `docs/agent-architecture.md`：

- **感知层 Perception**：数据源差异化配置（按客群地理）+ 三级核验 + 原始素材归档（raw/）
- **推理层 Reasoning**：信息源推导逻辑（场景→痛点→竞品缺口→趋势→需求）+ 根因多点验证 + 三专家评审 + **市场验证闭环**
- **行动层 Action**：PRD 产出 + HTML 渲染 + QA/lock/build 质量闸门 + 发布
- **记忆层 Memory**：data/ 案例事实库 + docs/ 方法论 + harness 契约与基线 + skills 技能

**市场验证闭环（进入 TOP5 前置硬门槛）**：每条 IDEA 须满足五源强支撑——市场声音、竞品验证、行业验证、参考行业验证、用户声音（≥2 独立来源）。缺任一维度不得进 TOP5。见 `docs/market-validation-loop.md`。

---

## 流水线（Agent Pipeline）

```
输入公司名称
  └→ 阶段0：数据源差异化配置（感知层）
      ├── 判定核心客群地理（海外/国内/新兴市场）
      ├── 写入 company-profile.json.dataSourceStrategy
      └── 定向渠道：海外→Amazon/Reddit/Trustpilot/Google Trends；国内→京东/知乎/小红书/百度指数
  └→ 阶段1：五维采集（感知层）
      ├── 场景采集（客群真实生活/工作场景，非产品使用场景）
      ├── 客群画像（demographics + behaviors + pain quotients）
      ├── 产品参数（现有产品线 + 规格 + 售价 + 成本结构）
      ├── 竞品缺口（竞品已验证品类/功能，我方未跟进）
      └── 趋势扫描（搜索/社媒/购买量 YoY，行业报告，技术趋势）
  └→ 阶段2：需求 IDEA 池（推理层）
      ├── 场景-痛点路径：场景 → 痛点 → 方案
      ├── 竞品-缺口路径：竞品已验证功能 → 我方无 → 评估跟进价值
      └── 跨行业-迁移路径：他行业已验证方案 → 本行业对应场景
  └→ 阶段3：证据链建设 + 市场验证闭环（推理层）
      ├── 每条 IDEA 关联 E## 证据（最少3条，含1条趋势证据）
      ├── 三级核验标注 V##（L1/L2/L3）
      ├── 数据源 Tier 登记（Tier0-3，≥2 个不同 Tier）
      └── 市场验证闭环：validationChain 五维强支撑（市场声音/竞品/行业/参考行业/用户声音≥2），缺一不得进 TOP5
  └→ 阶段4：三专家评审
      ├── 产品专家（技术可行/UX潜力/创新溢价/竞争壁垒）
      ├── 市场投资专家（市场机会/趋势/竞争壁垒/单位经济）
      └── 用户专家（痛点强度/UX潜力）
  └→ 阶段5：交叉验证 + 评分排序
      ├── 八维加权聚合 → scores.json
      ├── TOP5（>90，硬性5个）
      └── 功能需求清单（>75，评分倒序）
  └→ 阶段6：PRD 草稿
      └── 标准大厂 PRD 格式（背景/用户/场景/方案/指标/风险/排期）
  └→ 阶段7：Harness 验收
      ├── `node harness/qa.mjs` → 0 ERROR
      └── `node harness/lock.mjs` → SHA-256 基线
  └→ 阶段8：HTML 报告生成
      ├── 整站框架 + 完整第一章（先确认风格）
      └── 5 屏章节 → output/index.html
  └→ 阶段9：发布
      ├── Git 提交 new-idea/ 到 main
      └── Push 至 https://github.com/trinitytingchuan-alt/3C-reserch.git
```

---

## 超级能力工作流（Superpowers — 软约束）

| 阶段 | 必须使用的 Skill | 目的 |
|------|-----------------|------|
| 启动任何新任务 | `using-superpowers` | 确立软流程，确保 brainstorming→writing-plans→executing-plans 顺序 |
| 设计框架/评分模型 | `brainstorming` | 对齐目标、约束、成功标准，产出设计文档 |
| 搭建框架/执行案例 | `writing-plans` + `executing-plans` | 拆解为可验证步骤 |
| 每个里程碑交付前 | `verification-before-completion` | 跑 harness QA/lock/build 并附证据 |
| 数据/PRD/报告产出后 | `requesting-code-review` | code-reviewer 逻辑合理性审查 |
| HTML 报告设计 | `web-design-engineer` | 反AI俗套 / oklch色彩 / 高科技风格 |

---

## ECC 硬循环（硬约束）

ECC（Agent Harness Performance Optimization System）循环：  
**plan → test → implement → review → verify → remember → improve**

- ECC_HOOK_PROFILE=standard
- Hooks 在模型上下文之外运行确定性检查
- 每次完成一个阶段，必须主动调用 ECC review 钩子

---

## Harness 文件说明

| 文件 | 作用 |
|------|------|
| `harness/rules.mjs` | 契约定义：评分阈值(TOP5>90/清单>75)、伪需求检测、八维权重、三级核验标准、证据门槛、**市场验证闭环契约(validationChain 五维)** |
| `harness/qa.mjs` | 质量闸门（16项）：TOP5 硬性5个、证据≥3条、趋势≥1条、数据源≥2 Tier、场景路径有效、**市场验证闭环五维强支撑**、无空降方案 |
| `harness/lock.mjs` | SHA-256 基线锁定，防止内容漂移 |
| `harness/build.mjs` | 构建程序：数据注入模板 + 自动 QA + 幽灵引用双保险 |

## 关键文档

- `docs/agent-architecture.md` — 四层 Agent 架构（感知/推理/行动/记忆）+ 信息源推导逻辑
- `docs/data-source-strategy.md` — 按核心客群地理位置定向配置采集渠道
- `docs/market-validation-loop.md` — 新功能 IDEA 市场验证闭环（五源强支撑）
- `docs/evidence-standard.md` — 证据链 E##/V## 规范
- `docs/claim-discipline.md` — 断言纪律
- `docs/scoring-model.md` — 评分模型

---

## 证据体系

```
E## = 证据编号（每证据全局唯一，不可删除/重用）
V## = 核验记录（L1/L2/L3 + 数据窗口）
数据窗口 = 2026 全年（或案例指定窗口）
数据源 Tier:
  Tier0 = 官方公告/财报/白皮书（权威）
  Tier1 = 行业报告/第三方审计/专业评测
  Tier2 = 社区/电商/社媒（用户声音）
  Tier3 = 趋势工具/搜索引擎（宏观信号）
```

---

## 禁止事项

- 禁止"先验产品采样"：不能先想产品再找场景，必须先有场景/痛点再设计方案
- 禁止伪需求：每条 TOP5 需求须有场景→痛点→方案→证据完整闭环
- 禁止跨维度混比：用户功能 vs 平台机制分列对比
- 禁止 AI 黑话：底座/赋能/抓手/组合拳/飞轮/侵蚀/降维打击/端到端
- 禁止编造统计数字：所有数字必须有出处
- 禁止幽灵证据：不可引用不存在的来源编号
