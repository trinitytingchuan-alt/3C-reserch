const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
// 全局 E 残留（排除 evidence 数组与 gtm 卡片 ev 字段——这些是数据层，但渲染若展示则违规；先报全量）
const eAll = (s.match(/E\d{3}/g)||[]).length;
// gtms 块
const gStart = s.indexOf('"gtms": {');
const gEnd = s.indexOf('"scores": {', gStart);
const gtms = s.slice(gStart, gEnd);
const eGtms = (gtms.match(/E\d{3}/g)||[]).length;
// 残留空括号/孤立逗号
const badParen = (s.match(/（）/g)||[]).length;
// 去 E 残留逗号模式：中文字符后紧跟逗号加右括号/引号，如 "，）" 或 "，"
const orphanComma = (s.match(/，\s*[）"]/g)||[]).length;
// JSON 合法性：尝试用宽松方式定位 DATA 并 eval 结构（仅检查大括号平衡）
let depth=0, inStr=false, esc=false, ok=true;
for(let i=0;i<s.length;i++){const c=s[i];if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c==='"'&&!inStr){inStr=true;continue;}if(c==='"'&&inStr){inStr=false;continue;}if(!inStr){if(c==='{')depth++;else if(c==='}')depth--;if(depth<0){ok=false;break;}}}
const balanced = depth===0 && ok;
fs.writeFileSync('new-idea/scripts/_final_check.txt',
`全局 E 编号: ${eAll}\ngtms 块 E 编号: ${eGtms}\n空括号（）: ${badParen}\n孤立逗号(，)后接)或": ${orphanComma}\n括号平衡: ${balanced} (depth=${depth})`);
