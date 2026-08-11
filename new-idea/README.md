# NEW IDEA — 产品机会挖掘与需求验证框架

输入任意公司名称 → 自动产出 TOP5 产品需求 + 大厂标准 PRD + 高科技 HTML 报告。

## 快速开始

```bash
# 以安克为例（首个 demo）
node harness/build.mjs --company anker
# HTML 报告产出 → new-idea/output/index.html
```

## 使用方法

1. 在 `data/<company-slug>/` 下创建案例文件夹
2. 填充公司信息至 `company-profile.json`
3. 运行采集脚本：`node scripts/collect.mjs --company <company-slug>`
4. 运行三专家评分：`node scripts/score.mjs --company <company-slug>`
5. 运行构建：`node harness/build.mjs --company <company-slug>`
6. 质检：`node harness/qa.mjs --company <company-slug>`（必须 0 ERROR）
7. 输出 HTML 报告至 `output/index.html`

## 方法论

参见 `docs/methodology.md` — 安克创新四步法 + 场景优先三路径 + 八维评分

## 文件结构

```
new-idea/
├── AGENTS.md              # Agent 总纲
├── README.md              # 本文件
├── docs/                  # 方法论与规范
├── harness/               # 质量保障（rules/qa/lock/build）
├── templates/             # HTML 模板
├── data/                  # 案例数据
├── scripts/               # 自动化脚本
├── output/                # 产出物
└── skill/                 # 可复用 skill 定义
```

## 贡献

遵循 AGENTS.md 中的 superpowers 工作流，任何改动先跑 harness QA。
