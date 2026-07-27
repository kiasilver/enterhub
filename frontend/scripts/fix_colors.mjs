import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, '../src/components/SafeDashboard');

// Recursively get all .tsx files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles(targetDir);

let filesModified = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf-8');
  let modified = original;

  // 1. Tailwind arbitrary opacity backgrounds
  // e.g. bg-[#8b5cf6]/10 -> bg-[rgba(var(--primary-rgb),0.10)]
  modified = modified.replace(/bg-\[#(8b5cf6|6366f1)\]\/(\d+)/gi, (match, hex, op) => {
    const alpha = (parseInt(op) / 100).toString();
    return `bg-[rgba(var(--primary-rgb),${alpha})]`;
  });

  // 2. text-purple-400 / text-indigo-500 -> text-[var(--primary)]
  modified = modified.replace(/text-(purple|indigo)-(400|500|600)/g, 'text-[var(--primary)]');

  // 3. bg-purple-500/10 -> bg-[rgba(var(--primary-rgb),0.1)]
  modified = modified.replace(/bg-(purple|indigo)-(400|500|600)\/(\d+)/g, (match, color, weight, op) => {
    const alpha = (parseInt(op) / 100).toString();
    return `bg-[rgba(var(--primary-rgb),${alpha})]`;
  });
  
  // 3.1 bg-purple-500 -> bg-[var(--primary)]
  modified = modified.replace(/bg-(purple|indigo)-(400|500|600)/g, 'bg-[var(--primary)]');
  
  // 3.2 border-indigo-500/60 -> border-[rgba(var(--primary-rgb),0.6)]
  modified = modified.replace(/border-(purple|indigo)-(400|500|600)\/(\d+)/g, (match, color, weight, op) => {
    const alpha = (parseInt(op) / 100).toString();
    return `border-[rgba(var(--primary-rgb),${alpha})]`;
  });

  // 4. rgba(139, 92, 246, X) -> rgba(var(--primary-rgb), X)
  modified = modified.replace(/rgba\(\s*(139|99)\s*,\s*(92|102)\s*,\s*(246|241)\s*,/g, 'rgba(var(--primary-rgb),');

  // 5. Hardcoded hex codes
  modified = modified.replace(/#(8b5cf6|6366f1)/gi, 'var(--primary)');

  if (original !== modified) {
    fs.writeFileSync(file, modified, 'utf-8');
    console.log(`Updated: ${path.basename(file)}`);
    filesModified++;
  }
}

console.log(`\nCompleted! Modified ${filesModified} files.`);
