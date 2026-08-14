// inject-rayneo.mjs
// 把 rayneo 的 JSON 数据注入 report-template-rayneo.html（替代 anker 内联数据），生成独立 HTML。
// 与安克基准模板 report-template.html 的 JS 常量 schema 完全对齐，杜绝 undefined/幽灵引用。
// 通过 brace-matching 定位 `const NAME = ` 到匹配右括号 `;` 精确替换。
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = process.cwd();
const D = join(BASE, 'data', 'rayneo');
const ANKER_TPL = join(BASE, 'templates', 'report-template.html'); // 安克基准模板（含完整渲染契约）
const tplPath = join(BASE, 'templates', 'report-template-rayneo.html');

if (!existsSync(ANKER_TPL)) {
  console.error('❌ 缺少安克基准模板 report-template.html（作为渲染契约基准）');
  process.exit(1);
}

const evidence = JSON.parse(readFileSync(join(D, 'evidence.json'), 'utf8'));
const ideas = JSON.parse(readFileSync(join(D, 'ideas.json'), 'utf8'));
const scores = JSON.parse(readFileSync(join(D, 'scores.json'), 'utf8'));
const verification = JSON.parse(readFileSync(join(D, 'verification.json'), 'utf8'));
const companyProfile = JSON.parse(readFileSync(join(D, 'company-profile.json'), 'utf8'));

// ---------- 1. 派生 IDEAS（补 anker 契约字段 eng/path） ----------
const IDEAS = ideas.map(it => ({
  id: it.id,
  title: it.title,
  eng: it.eng || '', // 英文副标题（契约需要）
  path: it.discoveryPath || it.path, // 契约用 path（scene-pain | competitor-gap | cross-industry）
  category: it.category,
  scene: it.scene,
  painPoint: it.painPoint,
  solution: it.solution,
  differentiation: it.differentiation || '',
  competitorSignal: it.competitorSignal || '',
  trendSignal: it.trendSignal || '',
  tamEstimate: it.tamEstimate || '',
}));

// ---------- 2. 派生 SCORES（含 position/pseudoReason） ----------
const SCORES = {};
for (const s of scores) {
  SCORES[s.ideaId] = {
    expert: s.scores,
    evidenceIds: s.evidenceIds,
    verificationIds: s.verificationIds,
    position: '四专家加权评估',
  };
  if (s.isPseudo) {
    SCORES[s.ideaId].isPseudo = true;
    SCORES[s.ideaId].pseudoReason = '硬件专家(第四角色)判定：AR 眼镜内嵌生物识别支付需支付牌照+隐私合规+离线可靠校验，与轻量 AR 眼镜形态、雷鸟无支付栈能力冲突，技术不可行，不予立项';
  }
}

// ---------- 3. 派生 EVIDENCE（原样；确认 trend 字段来自 isTrend） ----------
const EVIDENCE = evidence.map(e => {
  const { id, source, tier, level, date, url, dim, summary, evergreen } = e;
  const out = { id, source, tier, level, date, url, dim, summary };
  if (e.isTrend) out.trend = true; // 契约读 .trend
  if (evergreen) out.evergreen = true;
  return out;
});

// ---------- 4. 派生 DERIVATION（对象 {id:{market/competitor/user/strategic:[{ev,claim,logic,cross}]}}） ----------
// 从 ideas.validationChain 派生四维推导链
const DERIVATION = {};
const evIdx = new Set(EVIDENCE.map(e => e.id));
const dimMap = {
  marketVoice: 'market',
  competitorValidation: 'competitor',
  userVoice: 'user',
  industryValidation: 'market',
  crossIndustryRef: 'strategic',
  hardware: 'strategic',
};
for (const it of ideas) {
  const vc = it.validationChain || {};
  const d = { market: [], competitor: [], user: [], strategic: [] };
  for (const [vcKey, dim] of Object.entries(dimMap)) {
    const slot = vc[vcKey];
    if (!slot || !Array.isArray(slot.evidenceIds)) continue;
    const evs = slot.evidenceIds.filter(e => evIdx.has(e));
    if (evs.length === 0) continue;
    // claim：复用该维度 logic 首句作为结论；logic：整句
    const logic = slot.logic || '';
    d[dim].push({
      ev: evs[0],
      claim: logic.split(/[，。；]/)[0] || '该维度证据支撑需求成立',
      logic,
      cross: evs.slice(1),
    });
  }
  DERIVATION[it.id] = d;
}

// ---------- 5. 派生 PRDS（与 renderPrdBody 契约字段对齐） ----------
const PRDS = {};
for (const it of ideas) {
  PRDS[it.id] = {
    decision: `【${it.isPseudo ? '不予立项（技术不可行）' : '建议立项'}】${(it.trendSignal || it.painPoint || '').slice(0, 60)}。综合分 ${(scores.find(s => s.ideaId === it.id)?.finalScore ?? 0).toFixed(1)}/100。`,
    background: [it.painPoint, it.competitorSignal || '', it.trendSignal || ''].filter(Boolean),
    users: [it.targetSegment || '', it.scene ? `在「${it.scene}」场景中的核心用户` : ''].filter(Boolean),
    scenarios: [it.scene].filter(Boolean),
    solution: [it.solution].filter(Boolean),
    metrics: [
      { k: '北极星', v: '目标客群渗透率 ≥ 5%（发布后 12 个月）' },
      { k: '留存', v: '月活跃留存 ≥ 30%' },
      { k: 'NPS', v: '≥ 35' },
    ],
    risks: [
      ['工程可行性', '中', '中', '先做软硬分离验证，再整机量产'],
      ['供应链', '中', '高', '预留第二供应商，关键器件双备份'],
      ['竞品跟进', '中', '中', '专利布局 + 快速迭代保持先发'],
    ],
    timeline: ['0-3 月：立项与可行性验证', '3-6 月：原型开发与用户内测', '6-12 月：量产与渠道铺货'],
  };
}

// ---------- 6. 派生 VALIDATION（chainDef + byIdea[id][key].ev/logic） ----------
const VALIDATION = {
  chainDef: [
    { key: 'marketVoice', label: '① 市场声音', color: 'var(--cyan)', desc: '市场够大且在增长', min: '≥1' },
    { key: 'competitorValidation', label: '② 竞品验证', color: 'var(--blue)', desc: '同类已被市场接受', min: '≥1' },
    { key: 'industryValidation', label: '③ 行业验证', color: 'var(--green)', desc: '处于上升通道', min: '≥1' },
    { key: 'crossIndustryRef', label: '④ 参考行业验证', color: 'var(--violet)', desc: '路径可复用', min: '≥1' },
    { key: 'userVoice', label: '⑤ 用户声音', color: 'var(--amber)', desc: '真实痛点·≥2 独立来源', min: '≥2' },
  ],
  byIdea: {},
};
for (const it of ideas) {
  const vc = it.validationChain || {};
  const by = {};
  for (const key of VALIDATION.chainDef.map(c => c.key)) {
    const slot = vc[key];
    by[key] = {
      ev: (slot?.evidenceIds || []).filter(e => evIdx.has(e)),
      logic: slot?.logic || '',
    };
  }
  VALIDATION.byIdea[it.id] = by;
}

// ---------- 7. 派生 GTMS（大厂 GTM 策略详细结构，公司级真实数据 + 各 idea 差异化） ----------
// 真实数据来源：Counterpoint(IDC 全球29%/Q4北美+456.5%)、CINNO(中国32%四连冠)、洛图(线上35.4%/观影42%)、
// 官方产品线价格、2026Q1超10亿元融资、运营商eSIM合作、DC蝙蝠侠IP联名、25+国家渠道。
const GTM_BASE = {
  tamSamSom: 'TAM：智能眼镜大盘(IDC 2025Q3)中雷鸟整体占比<5%，Meta独占75.7%；SAM：消费级AR观影眼镜，雷鸟2025全球出货29%居首、中国32%连续四年第一；SOM：观影/拍摄/轻量AI三个细分场景的头部份额(线上35.4%、观影品类42%)。国补2026首次纳入智能眼镜，SOM上行窗口打开。',
  channels: [
    { k: '线上电商(主量)', v: '京东/天猫AR+智能眼镜全品类销量榜首(618)；海外入驻Amazon/Best Buy，Air系列包揽数十国BestSeller' },
    { k: '运营商(渠道绑定)', v: '与中国移动/联通/德国电信深度合作，eSIM+AI大模型+云服务，充话费送眼镜(类似合约机逻辑)，2026Q1获运营商链长基金超10亿融资' },
    { k: 'IP联名(品牌造势)', v: '华纳DC蝙蝠侠限定版(Air 4 Pro)海外发售即售罄，国内2026-03-27发布，现象级科技潮品' },
    { k: '海外直营+分销', v: '覆盖25+国家；北美在Meta主导下同比+456.5%破局(IDC)，2026目标海外收入>中国(占比>50%)' },
  ],
  launchCadence: [
    { phase: '0-1月 静默期', todo: '雷鸟社区/粉丝群100人内测，收集续航/AI拍摄/佩戴真实反馈，打磨案例与首批KOL测评' },
    { phase: '2-4月 Beta', todo: '定向给数码KOL/B站UP主/科技媒体(如93913、IT之家)封闭体验，产出首发评测与场景内容' },
    { phase: '5-7月 公开发布', todo: '旗舰(如X3 Pro)走"技术秀肌肉"媒体发布会+观影走量款618大促；国补话术造势' },
    { phase: '8-12月 规模化', todo: '运营商渠道全国铺开+IP联名款放量；依据用户口碑驱动复购，推动从尝鲜到日常使用' },
  ],
  smarketing: '营销(SDR)与销售(SLA)对齐：营销负责MQL(首批测评线索/社区预约/国补咨询)交销售48h内跟进；内容侧重"观影大屏+AI拍摄+轻量佩戴"三条主线案例；CRM/营销自动化打通，共同考核SQL→新客转化与国补核销率；B站/抖音/小红书KOL矩阵投放。',
  metrics: [
    { k: '出货/份额', v: '全球出货29%第一(IDC)；中国销量32%连续四年第一(CINNO)；线上35.4%(洛图)' },
    { k: '增长', v: '北美Q4同比+456.5%(IDC)；全球累计用户超50万，年均约10万量级' },
    { k: '经济性', v: 'LTV:CAC>3目标；国补核销率；毛利率受低价走量压制，需靠旗舰展示+生态变现对冲' },
    { k: '健康度', v: 'NPS≥35；月活留存≥30%；生态应用适配率(安卓应用虚拟机迁移进度)与好评复购率' },
  ],
  risks: [
    ['定价激进', '高', '高', '万元旗舰走量难、千元低价品利润薄，Counterpoint评"激进定价"，盈利模型未跑通'],
    ['国补退坡', '中', '高', '高度依赖国补话术，一旦退坡价格体系可能崩塌；需建立非补贴价值锚'],
    ['品控售后', '中', '高', '广东省消委会测续航较差；用户反馈鼻托易断、售后无配件、退换货难'],
    ['生态短板', '中', '中', '安卓应用靠虚拟机搬入，适配远未成熟；需加速原生应用与开发者生态'],
    ['资本掉队', '中', '中', 'XREAL已递表港交所、Rokid获境外上市备案，雷鸟仅"内部筹备"，融资依赖输血'],
  ],
  first100: '雷鸟社区/粉丝群首批100名内测用户：定向数码尝鲜者，赠送续航/AI拍摄优先体验名额，采集真实痛点与复购意愿，作为后续KOL与口碑素材',
};
const GTMS = {};
// 各 idea 差异化 GTM：人群/切入/定价/锚点
const GTM_DIFF = {
  'ID-001': { audience: '移动办公与商旅通勤族：高频长时间佩戴眼镜，对续航与随身充电敏感', entry: '以X系列/Air系列续航痛点切入，主打"一天一充/热插拔备电"升级款，捆绑配件包', pricing: '随走量款定价(1499-1899元)，续航升级件作为加购配件(299-599元)；国补后更具性价比', anchor: '竞品Meta/XREAL续航普遍2-4h，雷鸟以持久续航+快充差异化' },
  'ID-002': { audience: '短视频创作者/记录生活者：需要解放双手的AI第一视角拍摄', entry: 'V系列AI拍摄眼镜切入，主打"第一视角AI成片"，对标Meta Ray-Ban拍摄', pricing: '1799-2200元档(对标拍摄眼镜)；AI成片服务按内容订阅或内置', anchor: '对比Meta拍摄眼镜(国内不可用)与手机自拍，突出AI后期与隐私屏显' },
  'ID-003': { audience: '全天候佩戴者：从尝鲜走向日常，对重量/形态敏感', entry: '轻量化Air/轻量款切入，主打"重量<30g、久戴无感"，攻占通勤与办公', pricing: '走量定价1499-1899元；轻量版本溢价200-300元', anchor: '对标Rokid/友商一体式偏重，突出轻量与光学自研的佩戴优势' },
  'ID-005': { audience: '户外/强光场景用户：观影与骑行、驾驶遮阳双重需求', entry: '电致变色镜片作为旗舰X系列选配切入，主打"观影+墨镜"二合一', pricing: '旗舰8999元(国补7649)选配变色镜片，或走量款加配499-899元', anchor: '对比竞品需外挂墨镜片，突出镜片智能调光一体化' },
  'ID-006': { audience: '尝鲜用户与开发者：需要内容与应用生态解锁眼镜价值', entry: 'X3 Pro等旗舰打造生态样板，接入AI大模型+运营商云服务', pricing: '旗舰定价不追求走量，生态服务/应用订阅为后续变现', anchor: '对标Meta生态碾压与安卓虚拟机短板，自建原生应用+运营商5G+AR+AI闭环' },
};
for (const s of scores) {
  if (!s.gtm) continue;
  const diff = GTM_DIFF[s.ideaId] || {};
  GTMS[s.ideaId] = {
    audience: diff.audience || s.gtm.audience || '目标客群',
    channel: diff.channel || s.gtm.channel || '线上电商+运营商+IP联名+海外25国',
    pricing: diff.pricing || s.gtm.pricing || '—',
    entry: diff.entry || s.gtm.entry || '—',
    anchor: diff.anchor || '—',
    northStar: '目标客群渗透率 ≥ 5%（发布后 12 个月）；出货份额守住全球第一梯队',
    first100: GTM_BASE.first100,
    tamSamSom: GTM_BASE.tamSamSom,
    channels: GTM_BASE.channels,
    launchCadence: GTM_BASE.launchCadence,
    smarketing: GTM_BASE.smarketing,
    metrics: GTM_BASE.metrics,
    risks: GTM_BASE.risks,
  };
}

// ---------- 8. 派生 VERIFICATIONS（补 ev 字段，取 evidenceIds 首个） ----------
const VERIFICATIONS = verification.map(v => {
  const ev = (v.evidenceIds && v.evidenceIds[0]) || v.ev || '';
  const evObj = EVIDENCE.find(e => e.id === ev);
  return {
    id: v.id,
    ev,
    level: v.level,
    method: v.method,
    window: v.window,
    conclusion: v.conclusion,
    url: evObj?.url || '',
  };
});

// ---------- 9. 派生 SCEN_SRC（{id:[{t,label,url,date}]}，从证据回填） ----------
const SCEN_SRC = {};
for (const it of ideas) {
  const vc = it.validationChain || {};
  const uvIds = (vc.userVoice?.evidenceIds || []).filter(e => evIdx.has(e));
  const items = uvIds.map(evId => {
    const ev = EVIDENCE.find(e => e.id === evId);
    return ev ? { t: 'voice', label: ev.source, url: ev.url, date: ev.date } : null;
  }).filter(Boolean);
  SCEN_SRC[it.id] = items;
}

// ---------- 10. 派生 DATASOURCE（channels 对象数组） ----------
const dsGeo = (companyProfile.dataSourceStrategy && (companyProfile.dataSourceStrategy.coreAudienceGeography || companyProfile.dataSourceStrategy.geo)) || 'CN';
const DATASOURCE = {
  coreAudienceGeography: dsGeo,
  geographyLabel: dsGeo === 'CN' ? '国内客群为主' : '海外客群为主',
  language: dsGeo === 'CN' ? 'zh' : 'en',
  channels: [
    { role: '用户声音 L3', overseas: ['Amazon Reviews', 'Reddit r/RayNeo', 'Trustpilot', 'Best Buy Reviews'], domestic: ['京东/天猫评价', '知乎', '小红书', 'B站/抖音评论区'] },
    { role: '竞品验证 L2', overseas: ['RTINGS', 'The Verge', 'Android Central'], domestic: ['中关村在线', 'IT之家', 'PChome'] },
    { role: '行业验证 L1/L2', overseas: ['Counterpoint', 'IDC', 'Grand View Research'], domestic: ['洛图科技 RUNTO', 'IDC 中国', '奥维云网'] },
    { role: '趋势信号 Tier3', overseas: ['Google Trends', 'SimilarWeb'], domestic: ['百度指数', '七麦数据'] },
    { role: '参考行业验证', overseas: ['Gartner', 'McKinsey', 'AR 行业报告'], domestic: ['中国信通院', '前瞻产业研究院'] },
  ],
  note: '雷鸟 RayNeo 为 TCL 孵化消费级 AR 眼镜公司，国内客群为主，用户声音以京东/知乎/小红书/B站为主渠道，行业验证用洛图科技/Counterpoint/IDC，避免用错地理渠道误判需求。',
};

// ---------- 11. 组装并注入 ----------
const blocks = [
  ['IDEAS', IDEAS],
  ['SCORES', SCORES],
  ['EVIDENCE', EVIDENCE],
  ['GTMS', GTMS],
  ['VERIFICATIONS', VERIFICATIONS],
  ['SCEN_SRC', SCEN_SRC],
  ['DATASOURCE', DATASOURCE],
  ['VALIDATION', VALIDATION],
  ['PRDS', PRDS],
  ['DERIVATION', DERIVATION],
];

// 以安克基准模板为底，确保渲染契约完整（渲染函数、TOP5 动态逻辑、DIM_ORDER 等）
let html = readFileSync(ANKER_TPL, 'utf8');

// 替换函数：定位 `const NAME = ` 到匹配右括号的 `;`
function replaceConst(src, name, valueObj) {
  const marker = `const ${name} = `;
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error(`未找到 ${name}`);
  let i = idx + marker.length;
  const open = src[i];
  if (open !== '[' && open !== '{') throw new Error(`${name} 起始字符异常: ${open}`);
  const closeCh = open === '[' ? ']' : '}';
  let depth = 0, inStr = false, esc = false, inTmpl = false;
  let end = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"' && !inTmpl) { inStr = !inStr; continue; }
    if (c === '`' && !inStr) { inTmpl = !inTmpl; continue; }
    if (inStr || inTmpl) continue;
    if (c === open) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error(`${name} 未找到匹配右括号`);
  const before = src.slice(0, idx);
  const after = src.slice(end + 1);
  return before + marker + JSON.stringify(valueObj, null, 2) + ';' + after;
}

// 标题与描述
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${companyProfile.displayName || '雷鸟创新 RayNeo'} · 产品机会挖掘报告</title>`);
html = html.replace(/<meta name="description"[\s\S]*?>/, `<meta name="description" content="NEW IDEA 产品机会挖掘框架 · 雷鸟创新 RayNeo · 深色高科技数据面板">`);
// 可见文案：安克 → 雷鸟
html = html.split('安克创新').join('雷鸟创新').split('安克').join('雷鸟').split('Anker').join('RayNeo').split('anker').join('rayneo');

// 清理 openPrdDoc 内硬编码的 RAW_EV 幽灵引用（E017-E026 为安克证据编号，雷鸟只有 E001-E016）
// 用雷鸟各 idea 的真实 user/competitor 维度证据重映射，避免 openPrdDoc 渲染出无 tier/无链接的幽灵徽标
const RAW_EV = {
  'ID-001': { scene: 'E005', pain: 'E005', competitor: 'E007' },
  'ID-002': { scene: 'E012', pain: 'E016', competitor: 'E009' },
  'ID-003': { scene: 'E006', pain: 'E006', competitor: 'E007' },
  'ID-005': { scene: 'E012', pain: 'E001', competitor: 'E007' },
  'ID-006': { scene: 'E012', pain: 'E016', competitor: 'E008' },
  'ID-004': { scene: 'E009', pain: 'E012', competitor: 'E007' },
};
// 定位 RAW_EV 常量块并整体替换（匹配 `const RAW_EV = {` 到 `};` 结束，对象内无顶层分号）
{
  const marker = 'const RAW_EV = {';
  const idx = html.indexOf(marker);
  if (idx > -1) {
    // anker 模板 RAW_EV 以 `  };` 结束（`}` 后换行缩进再 `;`），定位到 `};` 即可
    const end = html.indexOf('};', idx);
    if (end > -1) {
      // 保留 `const RAW_EV = `，去掉旧对象 `{...}`，换上新 JSON 对象 + `;`
      const prefixEnd = idx + 'const RAW_EV = '.length;
      html = html.slice(0, prefixEnd) + JSON.stringify(RAW_EV, null, 2) + html.slice(end + 2);
      console.log('✅ 已清理 openPrdDoc RAW_EV 幽灵引用（E017-E026 → 雷鸟真实 E 编号）');
    }
  }
}
// 清理"充电宝/SSD"等安克残留文案（若模板可见层仍有）
html = html.split('充电宝+SSD').join('生物识别支付').split('SSD').join('生物识别模组').split('充电宝集成').join('眼镜内嵌');
// 修正证据范围标题（雷鸟仅 E001-E016，勿宣称到 E026）
html = html.split('E001-E026').join('E001-E016');

// 注入数据块（marker 基于内容定位，不受位置影响）
for (const [name, val] of blocks) {
  html = replaceConst(html, name, val);
}

writeFileSync(tplPath, html, 'utf8');
console.log(`✅ 已按安克契约注入 rayneo 数据 → ${tplPath}`);
