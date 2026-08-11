# 分析全流程 SOP

## 概述

本文档定义 3C 竞品分析的标准操作流程，从确定分析目标到最终发布完整报告。

## 阶段一：启动 & 范围定义

### 1.1 确定品类与目标竞品
- 明确分析品类（耳机/手表/音箱/其他）
- 列出目标竞品列表（3-6 款，覆盖旗舰/中端/入门段位）
- 确定分析窗口（数据时间范围，通常近 3-6 个月）

### 1.2 初始化工作区
```powershell
.\scripts\new-category.ps1 -Name "headphones" -DisplayName "耳机"
```
自动创建 `data/headphones/` 完整子目录结构。

### 1.3 定义分析维度
针对 3C 品类确定关键分析维度（示例）：
- **耳机**：音质（频响/声场）、降噪（ANC 深度/通透模式）、佩戴舒适度、续航/快充、连接稳定性、通话质量、App 体验、生态兼容
- **手表**：健康监测精度（心率/GPS/血氧）、续航、屏幕素质、运动模式覆盖、App 生态、通知管理、材质/做工
- **音箱**：音质（频响/失真度）、声压级/覆盖、连接方式（蓝牙/多房间）、便携性/防水、智能助手集成

## 阶段二：证据采集

### 2.1 数据源扫描
按 Tier 0→3 优先级依次采集：

| Tier | 来源 | 采集方式 |
|------|------|----------|
| Tier 0 | 品牌官网 / 规格书 / 固件日志 | 直接抓取 |
| Tier 1 | B站 / 小红书 / 抖音 / RTINGS | 搜索 + 关键帧截图 |
| Tier 2 | 京东 / 天猫 / 亚马逊 / 社区 | 评论爬取 / 手动筛选 |
| Tier 3 | 参数数据库 / 价格追踪 | API 或手动录入 |

### 2.2 原始证据归档
每份采集到的原始证据放入 `data/{category}/raw/` 对应子目录，文件名格式：
`{Tier}_{来源}_{日期}_{关键词}.{ext}`

示例：`T1_bilibili_20260801_sony-xm5-anc-test.md`

### 2.3 关键证据提取
从原始证据中提取关键数据点：
- 实测数值（频响、续航、延迟等）
- 用户痛点高频词统计
- 竞品功能对比矩阵
- 价格走势与发布时间

## 阶段三：证据结构化

### 3.1 编写 evidence.json
按 `docs/evidence-standard.md` 规范，将关键发现结构化：
```json
{
  "E001": {
    "claim": "Sony WF-1000XM5 ANC 深度达 34dB（1kHz）",
    "source": "RTINGS 2026-07 实测",
    "tier": "T1",
    "verification_level": "L3",
    "verification_note": "RTINGS 实验室测量，A 级信源",
    "data_window": "2026-07-15",
    "category": "anc_performance"
  }
}
```

### 3.2 编写 verification.json
追踪每条证据的核验状态：
```json
{
  "E001": {
    "L1_tested": false,
    "L2_confirmed": false,
    "L3_confirmed": true,
    "final_level": "L3",
    "verified_at": "2026-08-11"
  }
}
```

## 阶段四：竞品分析

### 4.1 功能对比矩阵
构建 [竞品 × 维度] 矩阵，标注实测值 + 证据编号：
| 维度 | 产品 A | 产品 B | 产品 C |
|------|--------|--------|--------|
| ANC 深度 | 34dB (E001) | 30dB (E005) | 28dB (E008) |
| 续航(ANC开) | 8h (E002) | 6h (E006) | 7h (E009) |

### 4.2 用户痛点聚类
从电商差评 / 社区讨论中聚类高频痛点：
- 提取 Top N 痛点关键词
- 按严重度 × 频度排序
- 标注可落地优化方向

### 4.3 差距分析
基于矩阵 + 痛点，识别自身产品竞争力缺口：
- **绝对差距**：参数/功能明显落后（如 ANC 差 6dB）
- **感知差距**：参数接近但用户体验差（如 App 卡顿）
- **空白领域**：竞品已有、自身未覆盖的功能

## 阶段五：PRD 产出

### 5.1 TOP 可优化点排序
按 `影响面 × 可实现性 × 差异化价值` 三维度排序：
- P0：影响面大 + 可实现 + 竞品已证明可行 → 立即跟进
- P1：影响面中 + 需研发投入 → 规划排期
- P2：影响面小 / 技术不成熟 → 持续观察

### 5.2 编写 prd-draft.md
每项优化建议必须包含：
1. 现状描述（我方当前状态 + 证据）
2. 竞品参照（竞品同类功能 + 证据）
3. 优化方案（具体到功能规格 + 验收标准）
4. 优先级与预期收益

## 阶段六：质量保障

### 6.1 Harness QA 校验
```bash
node harness/qa.mjs --category headphones
```
通过后进入构建。

### 6.2 基线锁定
```bash
node harness/lock.mjs --category headphones
```

### 6.3 构建 & 发布
```bash
node harness/build.mjs --category headphones --time 2026-08-11
powershell -File scripts/publish.ps1 -Category headphones
```

## 迭代流程

分析窗口过后，按以下流程迭代更新：
1. 拉取新区间原始证据
2. 更新 evidence.json（仅新增/修订，不改已有 E## 描述）
3. 更新 prd-draft.md
4. 重新跑 qa → lock → build → publish
5. 在 releases.json 中记录新版本
