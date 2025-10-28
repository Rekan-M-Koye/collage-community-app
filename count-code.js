const fs = require('fs');
const path = require('path');

const stats = {
  totalFiles: 0,
  totalLines: 0,
  fileTypes: {
    js: { count: 0, lines: 0 },
    jsx: { count: 0, lines: 0 }
  }
};

const excludeDirs = ['node_modules', '.git', '.expo', 'android', 'ios', 'build', 'dist'];

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(item)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      
      if (ext === '.js' || ext === '.jsx') {
        const lines = countLines(fullPath);
        const type = ext.slice(1);
        
        stats.fileTypes[type].count++;
        stats.fileTypes[type].lines += lines;
        stats.totalFiles++;
        stats.totalLines += lines;
      }
    }
  });
}

console.log('\n========================================');
console.log('   Code Statistics');
console.log('========================================\n');

const projectRoot = __dirname;
scanDirectory(projectRoot);

console.log(`Total .js files:   ${stats.fileTypes.js.count}`);
console.log(`Total .jsx files:  ${stats.fileTypes.jsx.count}`);
console.log(`Total files:       ${stats.totalFiles}\n`);

console.log(`Lines in .js:      ${stats.fileTypes.js.lines.toLocaleString()}`);
console.log(`Lines in .jsx:     ${stats.fileTypes.jsx.lines.toLocaleString()}`);
console.log(`Total lines:       ${stats.totalLines.toLocaleString()}\n`);

console.log('========================================\n');
