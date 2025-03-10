const fs = require('node:fs');
const pirates = require('pirates');

pirates.addHook((code, filename) => `module.exports=\`${fs.readFileSync(filename, 'utf-8')}\``, {
  exts: ['.txt'],
  matcher: filename => filename.endsWith('.glsl.txt')
});
