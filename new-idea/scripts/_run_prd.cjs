const { execSync } = require('child_process');
const fs = require('fs');
try {
  execSync('node new-idea/scripts/_selfcheck_prd.cjs', { stdio: 'pipe' });
} catch (e) {}
// 重新运行并捕获输出到文件
const cp = require('child_process');
const res = cp.execSync('node new-idea/scripts/_selfcheck_prd.cjs', { encoding: 'utf8' });
fs.writeFileSync('new-idea/scripts/_prd_res.txt', res);
