import fs from 'fs';
import path from 'path';

const files = [
  'SafeBadges.tsx',
  'SafeButtons.tsx',
  'SafeCards.tsx',
  'SafeCarousel.tsx',
  'SafeTables.tsx',
  'SafeSweetAlerts.tsx',
  'SafeNestableList.tsx',
  'SafeTour.tsx',
  'SafeSwiper.tsx',
  'SafeRatings.tsx',
  'SafeScrollSpy.tsx'
];

const dir = 'c:/Users/parsa/Desktop/dashboard/src/components/SafeDashboard';

files.forEach(file => {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  
  let content = fs.readFileSync(p, 'utf-8');
  
  // 1. Restore useTheme
  content = content.replace(/const primaryColor = '#8b5cf6';/g, "const { primaryColor } = useTheme();");
  
  // 2. Restore var(--primary) and variants
  content = content.replace(/#8b5cf6/g, 'var(--primary)');
  content = content.replace(/#7c3aed/g, 'var(--primary-hover)');
  content = content.replace(/139, 92, 246/g, 'var(--primary-rgb)');
  
  // 3. Restore foreground
  // I replaced var(--primary-fg, white) with #ffffff
  content = content.replace(/#ffffff/g, 'var(--primary-fg, white)');
  
  // 4. Restore tailwind classes
  content = content.replace(/border-\[var\(--primary\)]/g, 'border-primary');
  content = content.replace(/bg-\[var\(--primary\)]/g, 'bg-primary');
  content = content.replace(/text-\[var\(--primary\)]/g, 'text-primary');

  fs.writeFileSync(p, content, 'utf-8');
  console.log(`Reverted ${file}`);
});
