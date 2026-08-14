# NEW IDEA — Agent 总纲

> **路径**：`new-idea/` 子项目，位于 3C-reserch 仓库 main 分支
> **目标**：输入任意公司 → 场景/客群/痛点/竞品/趋势五维采集 → 三专家评审 → 交叉验证 → TOP5 产品需求 + PRD → 单文件 HTML 报告
> **首例 demo**：安克 Anker Innovations

## 核心原则

### 四大硬规则（QA 闸门强制执行）
1. **VERIFY_FIRST**（三级核验）：L1 端内/官方 → L2 专业媒体/行业报告 → L3 社区/电商。不可采集即视为功能缺失。
2. **CLAIM_DISCIPLINE**：不伪称「该公司无此能力」，不立不可观测行为的伪需求，差距须标核验方式+数据窗口。
3. **SCENE_FIRST**（场景优先）：需求须源自客群真实场景痛点 / 竞品已验证缺口 / 跨行业迁移；每条 IDEA 标发现路径（scene-pain | competitor-gap | cross-industry）。
4. **DATA_GEO**（数据源地理定向）：按核心客群地理配置 `company-profile.json.dataSourceStrategy`（海外→Amazon/Reddit/Trustpilot/Google Trends；国内→京东/知乎/小红书/百度指数）。见 `docs/data-source-strategy.md`。

### 四层 Agent 架构（基于 ECC + Superpowers）
- **感知层**：数据源地理定向 + 三级核验 + 素材归档（raw/）
- **推理层**：场景→痛点→竞品缺口→趋势→需求 推导 + 根因多点验证 + 三专家评审 + 市场验证闭环
- **行动层**：PRD 产出 + HTML 渲染 + QA/lock/build 闸门 + 发布
- **记忆层**：data/ 案例库 + docs/ 方法论 + harness 契约基线 + skills

**市场验证闭环（进 TOP5 前置硬门槛）**：每条 IDEA 须五源强支撑——市场声音/竞品验证/行业验证/参考行业验证/用户声音(≥2 独立来源)，缺任一不得进 TOP5。见 `docs/market-validation-loop.md`。

## 流水线（Agent Pipeline）
```
输入公司 → 阶段0 数据源地理定向 → 阶段1 五维采集(场景/客群/参数/竞品缺口/趋势)
→ 阶段2 IDEA 池(场景-痛点/竞品-缺口/跨行业-迁移) → 阶段3 证据链+市场验证闭环
→ 阶段4 三专家评审(产品/市场投资/用户) → 阶段5 评分排序
→ 阶段6 PRD 草稿 → 阶段7 Harness 验收 → 阶段8 HTML 报告 → 阶段9 发布
```
- 阶段3：每条 IDEA 关联 E##(≥3 含 1 趋势) + V##(L1/L2/L3) + Tier 登记(≥2 不同 Tier) + validationChain 五维。
- 阶段5：10 维加权聚合→scores.json；**TOP5 固定 5 个且综合分 >90**（阈值 `TOP5_MIN_SCORE=90`）；功能清单 >75。
- 阶段7：`node harness/qa.mjs`(0 ERROR) → `node harness/lock.mjs`(SHA-256 基线)。
- 阶段8：模板首屏只 `renderTop5Flat()`，重块用 IntersectionObserver 惰性渲染（单文件内部分块，兼容 gh-pages）。

## 超级能力工作流（软约束）
| 阶段 | Skill | 目的 |
|------|-------|------|
| 启动任务 | `using-superpowers` | brainstorming→writing-plans→executing-plans |
| 设计/评分 | `brainstorming` | 对齐目标与约束 |
| 搭建/执行 | `writing-plans` + `executing-plans` | 可验证步骤 |
| 里程碑交付前 | `verification-before-completion` | harness QA/lock/build 附证据 |
| 产出后 | `requesting-code-review` | code-reviewer 逻辑审查 |
| 报告设计 | `web-design-engineer` | 高科技风格 / 反 AI 俗套 |

## ECC 硬循环
**plan → test → implement → review → verify → remember → improve**；每次完成阶段须主动调用 ECC review 钩子。

## Harness 文件
| 文件 | 作用 |
|------|------|
| `rules.mjs` | 契约：TOP5>90/清单>75、伪需求检测、10 维权重、三级核验、证据门槛、市场验证闭环契约 |
| `qa.mjs` | 闸门：TOP5 硬性 5 个、证据≥3、趋势≥1、Tier≥2、场景路径有效、五维强支撑、无空降方案、内联脚本语法解析 |
| `schema-validate.mjs` | 数据契约结构校验（build 前置）：字段缺失/类型错/幽灵引用，杜绝 schema 与渲染脱节 |
| `lock.mjs` | SHA-256 基线，防内容漂移 |
| `build.mjs` | 单一引擎渲染：读 data/<company>/ → schema 校验 → QA → 派生数据 → 注入占位符 → 产出；支持 `--stage` 分步 |
| `scripts/run-with-recovery.mjs` | 任务超时自动恢复运行器：10s 心跳看门狗，长任务无响应自动 kill+重试(≤3)，checkpoint 续跑 |
| `scripts/placeholderize.mjs` | 把模板内联数据常量占位化为 `__DATA_*__`（幂等） |

## 分模块产出（前后端分离）
- **单一渲染引擎** `templates/report-template.html`：只含 CSS+渲染函数+`__DATA_*__`/`__STAGE__` 占位，零产品数据；任何公司 build 都注入这一个引擎（不复制模板）。
- **数据层独立** `data/<company>/`：ideas/evidence/scores/verification/company-profile/stage.json 每产品独立，不共享。
- **分步产出**（`stage.json` 状态机）：demand → evidence → gtm → report。后置模块产出前前置必须 done（需求未确认不得产出 GTM）；build `--stage` 参数控制当前产出阶段，未 done 模块渲染"待确认"占位。
- **GTM 按 idea 差异化**：落地打法（渠道/发布节奏/营销/指标/风险）须落到各需求，不得整段复用。
- 新项目流程：`data/<company>/` 填 JSON → `--stage demand` 产出需求待验证 → 确认后 `--stage gtm` → `--stage report`。

## 任务中断自动恢复机制
长任务（QA/build/inject 等）可能卡死无响应。统一用 recovery runner 包裹执行：
```powershell
cd "new-idea"
node scripts/run-with-recovery.mjs --name <任务名> -- <命令...>
node scripts/run-with-recovery.mjs --resume        # 读取 .recovery-checkpoint.json 续跑失败步骤
```
规则：子进程 >10s 无 stdout/stderr 心跳 ⇒ 判定卡死 ⇒ SIGKILL 终止 ⇒ 自动重试（最多 3 次）；每步写 `.recovery-checkpoint.json`，中断后可 `--resume` 续跑。

## 关键文档
- `docs/agent-architecture.md` 四层架构 + 信息源推导
- `docs/data-source-strategy.md` 数据源地理定向
- `docs/market-validation-loop.md` 市场验证闭环
- `docs/evidence-standard.md` 证据链 E##/V## 规范
- `docs/claim-discipline.md` 断言纪律
- `docs/scoring-model.md` 评分模型
- `docs/data-quality-criteria.md` S/A/B 三级准则
- `docs/derivation-logic-standard.md` 推导链路闭环

## 证据体系
```
E## = 证据编号（全局唯一，不可删/重用）；V## = 核验记录(L1/L2/L3 + 数据窗口)
数据源 Tier: Tier0 官方/财报/白皮书；Tier1 行业报告/审计/评测；Tier2 社区/电商/社媒；Tier3 趋势/搜索
```

## 禁止事项
- 先验产品采样（须先场景/痛点再方案）
- 伪需求（TOP5 须场景→痛点→方案→证据完整闭环）
- 跨维度混比（用户功能 vs 平台机制分列）
- AI 黑话（底座/赋能/抓手/组合拳/飞轮/侵蚀/降维打击/端到端）
- 编造统计数字（须有出处）
- 幽灵证据（不可引用不存在来源编号）
