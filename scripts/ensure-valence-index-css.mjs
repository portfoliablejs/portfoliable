import fs from 'node:fs';
import path from 'node:path';

const indexCssPath = path.resolve(
  process.cwd(),
  'node_modules',
  '@portfoliablejs',
  'valence',
  'src',
  'stories',
  'sub-atomic',
  'index.css'
);

try {
  if (fs.existsSync(indexCssPath)) {
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(indexCssPath), { recursive: true });
  fs.writeFileSync(indexCssPath, "@import '../../style.css';\n", 'utf8');
  console.log('Patched valence compatibility: created src/stories/sub-atomic/index.css');
} catch (error) {
  console.warn('Could not patch valence compatibility file:', error?.message || error);
}
