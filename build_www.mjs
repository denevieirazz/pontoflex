import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, 'www');

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest, { recursive: true });

function copyRecursive(src, dst) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dst, item));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

const itemsToCopy = ['index.html', 'app.js', 'manifest.webmanifest', 'sw.js', 'design', 'logica', 'ferramentas', 'icons'];
for (const item of itemsToCopy) {
  const srcPath = path.join(__dirname, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, path.join(dest, item));
  }
}
console.log('Pasta www construída com sucesso para o Android!');
