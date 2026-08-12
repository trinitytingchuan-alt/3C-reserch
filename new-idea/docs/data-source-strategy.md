# 数据源差异化配置（按核心客群地理位置定向采集）

> 核心原则：**同一框架，不同公司的数据采集渠道必须按核心客群所在地理位置差异化定制**。
> 数据源不是"一套模板打天下"，而是"客群在哪，数据源就在哪"。

---

## 一、为什么要差异化

不同公司的核心客群分布在不同地理市场，其真实用户声音、竞品信号、趋势信号会出现在**不同的渠道**上：

| 客群地理 | 用户声音 (L3) | 竞品验证 (L2) | 趋势信号 (Tier3) |
|---------|--------------|--------------|-----------------|
| **海外为主**（安克 Anker） | Amazon Reviews、Reddit、Trustpilot、Best Buy、海外社媒(Twitter/YouTube/IG/TikTok) | RTINGS、Wirecutter、The Verge、Amazon Best Seller | Google Trends、SimilarWeb、Apptopia |
| **国内为主**（小米） | 京东/天猫评价、知乎、小红书、B站、抖音评论区 | 中关村在线、IT之家、盖得排行、亿邦动力 | 百度指数、七麦数据、极光 |
| **出海东南亚** | Shopee/Lazada Review、Lazada 评价、Facebook Group | 泰国/印尼本地科技媒体 | Google Trends(区域)、SimilarWeb |

若仍用统一中文渠道去采集海外客群，会系统性丢失真实用户声音，导致**伪需求误判**（把"国内未讨论"误判为"无需求"）。

---

## 二、配置模型（写入 company-profile.json）

在 `data/<company>/company-profile.json` 新增顶层 `dataSourceStrategy` 字段：

```json
"dataSourceStrategy": {
  "coreAudienceGeography": "overseas-primary",   // overseas-primary | domestic-primary | emerging-asia
  "userVoiceChannels": ["Amazon Reviews", "Reddit", "Trustpilot", "Best Buy", "海外社媒(Twitter/YouTube/IG/TikTok)"],
  "competitorValidationChannels": ["RTINGS", "Wirecutter", "The Verge", "Amazon Best Seller"],
  "industryValidationChannels": ["Canalys", "IDC", "Verified Market Research", "GM Insights"],
  "trendSignalChannels": ["Google Trends", "SimilarWeb", "Apptopia"],
  "crossIndustryRefChannels": ["Gartner", "McKinsey", "ESG/清洁能源行业报告"],
  "language": "en",                            // 采集语言偏好
  "note": "安克 180+ 国家，主要营收来自海外 (充电储能类海外占比高)，必须覆盖海外渠道，避免只用中文渠道误判"
}
```

### 安克示例（已内置 data/anker/company-profile.json）

```json
"dataSourceStrategy": {
  "coreAudienceGeography": "overseas-primary",
  "userVoiceChannels": ["Amazon Reviews", "Reddit r/anker / r/chargers", "Trustpilot", "Best Buy Reviews", "YouTube/Twitter 海外社媒"],
  "competitorValidationChannels": ["RTINGS", "The Wirecutter", "The Verge", "Amazon Best Sellers"],
  "industryValidationChannels": ["Canalys", "IDC", "Verified Market Research", "GM Insights"],
  "trendSignalChannels": ["Google Trends", "SimilarWeb", "Apptopia"],
  "crossIndustryRefChannels": ["Gartner", "McKinsey 消费电子", "清洁能源/户外经济报告"],
  "language": "en",
  "note": "海外客群为主，用户声音以 Amazon/Reddit/Trustpilot 为主，中文渠道仅作补充验证"
}
```

---

## 三、采集工作流集成（写入 AGENTS.md 与 new-company.ps1）

1. **新公司初始化**时：脚本询问/默认按 `coreAudienceGeography` 生成差异化渠道清单，写入 `dataSourceStrategy`
2. **用户声音采集**：`raw/voices/` 文件命名带渠道 + 市场标签，如 `T2_amazon_20260801_anker-magnetic-battery-back.md`
3. **竞品缺口**：`raw/competitors/` 优先从 `competitorValidationChannels` 采集，验证信号需与目标市场一致
4. **趋势扫描**：`raw/research/` 优先用 `trendSignalChannels`（Google Trends 区域/全球维度），附搜索链接
5. **QA 校验**：`qa.mjs` 检查 `dataSourceStrategy` 已配置，且每条 TOP5 需求的证据 Tier 覆盖应反映该地理市场

---

## 四、判定规则（verify_first 在地理维度上的落地）

- **客群在海外**：禁止只用中文渠道（京东/知乎/微博）判定"用户无此痛点"。必须先查 Amazon/Reddit/Trustpilot。
- **客群在国内**：禁止只用 Amazon/Reddit 判定需求，应以京东/天猫/小红书/知乎为主。
- 每条"用户声音"证据须标注**采集渠道 + 市场**，否则 QA 拦截。
