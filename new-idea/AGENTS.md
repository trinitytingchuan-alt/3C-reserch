# NEW IDEA — Agent 总纲

> **路径**：`new-idea/` 子项目，位于 3C-reserch 仓库 main 分支  
> **目标**：输入任意公司 → 场景/客群/痛点/竞品/趋势五维采集 → 三专家评审 → 交叉验证 → TOP5 产品需求 + PRD → 高科技 HTML 报告  
> **首例 demo**：安克 Anker Innovations

---

## 核心原则

### 三大硬规则（不可违反，QA 闸门强制执行）

1. **VERIFY_FIRST**（三级核验）：L1 端内实测/官方渠道 → L2 专业媒体/行业报告 → L3 社区/电商评论。不可采集即视为功能缺失。
2. **CLAIM_DISCIPLINE**（断言纪律）：不伪称"该公司无此能力"，不立不可观测行为的伪需求，所有差距须标核验方式+数据窗口。
3. **SCENE_FIRST**（场景优先）：严禁产品优先采样。需求必须源自客群真实生活场景痛点、或竞品已验证市场缺口、或跨行业迁移方案。每条 IDEA 必须标注发现路径（scene-pain | competitor-gap | cross-industry）。

---

## 流水线（Agent Pipeline）

```
输入公司名称
  └→ 阶段1：五维采集
      ├── 场景采集（客群真实生活/工作场景，非产品使用场景）
      ├── 客群画像（demographics + behaviors + pain quotients）
      ├── 产品参数（现有产品线 + 规格 + 售价 + 成本结构）
      ├── 竞品缺口（竞品已验证品类/功能，我方未跟进）
      └── 趋势扫描（搜索/社媒/购买量 YoY，行业报告，技术趋势）
  └→ 阶段2：需求 IDEA 池
      ├── 场景-痛点路径：场景 → 痛点 → 方案
      ├── 竞品-缺口路径：竞品已验证功能 → 我方无 → 评估跟进价值
      └── 跨行业-迁移路径：他行业已验证方案 → 本行业对应场景
  └→ 阶段3：证据链建设
      ├── 每条 IDEA 关联 E## 证据（最少3条，含1条趋势证据）
      ├── 三级核验标注 V##（L1/L2/L3）
      └── 数据源 Tier 登记（Tier0-3，≥2 个不同 Tier）
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
| `harness/rules.mjs` | 契约定义：评分阈值(TOP5>90/清单>75)、伪需求检测、八维权重、三级核验标准、证据门槛 |
| `harness/qa.mjs` | 质量闸门（15项）：TOP5 硬性5个、证据≥3条、趋势≥1条、数据源≥2 Tier、场景路径有效、无空降方案 |
| `harness/lock.mjs` | SHA-256 基线锁定，防止内容漂移 |
| `harness/build.mjs` | 构建程序：数据注入模板 + 自动 QA + 幽灵引用双保险 |

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
