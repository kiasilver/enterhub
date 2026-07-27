import fs from 'fs';
import path from 'path';

const files = [
  'SafeBadges.tsx',
  'SafeButtons.tsx',
  'SafeCards.tsx',
  'SafeCarousel.tsx',
  'SafeTables.tsx'
];

const dir = 'c:/Users/parsa/Desktop/dashboard/src/components/SafeDashboard';

files.forEach(file => {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  
  let content = fs.readFileSync(p, 'utf-8');
  
  // Replace the dynamic primaryColor from useTheme with a fixed constant
  content = content.replace(/const \{ primaryColor \} = useTheme\(\);/g, "const primaryColor = '#8b5cf6';");
  
  // Replace CSS variables
  content = content.replace(/var\(--primary\)/g, '#8b5cf6');
  content = content.replace(/var\(--primary-hover\)/g, '#7c3aed');
  content = content.replace(/var\(--primary-rgb\)/g, '139, 92, 246');
  
  // Replace foreground vars
  content = content.replace(/var\(--primary-fg, white\)/g, '#ffffff');
  content = content.replace(/var\(--primary-fg, #fff\)/g, '#ffffff');
  
  fs.writeFileSync(p, content, 'utf-8');
  console.log(`Updated ${file}`);
});
