import fs from 'fs';
import path from 'path';

const file = 'c:/Users/parsa/Desktop/dashboard/src/components/SafeDashboard/SafeSweetAlerts.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf-8');

  // Basic -> Blue
  content = content.replace(/kind: 'basic', label: 'A Basic Message', color: primaryColor/g, "kind: 'basic', label: 'A Basic Message', color: '#0ea5e9'");
  
  // Title text -> Blue
  content = content.replace(/kind: 'title-text', label: 'A Title with a Text Under', color: primaryColor/g, "kind: 'title-text', label: 'A Title with a Text Under', color: '#0ea5e9'");
  
  // Toast error -> Red
  content = content.replace(/kind: 'toast-error', label: 'An Error Message', color: '#ef4444'/g, "kind: 'toast-error', label: 'An Error Message', color: '#ef4444'");
  
  // Long content -> Blue
  content = content.replace(/kind: 'long-content', label: 'A modal window with a long content inside', color: primaryColor/g, "kind: 'long-content', label: 'A modal window with a long content inside', color: '#0ea5e9'");
  
  // Custom HTML -> Blue
  content = content.replace(/kind: 'custom-html', label: 'Custom HTML description and buttons', color: '#0ea5e9'/g, "kind: 'custom-html', label: 'Custom HTML description and buttons', color: '#0ea5e9'");
  
  // Three buttons -> Blue
  content = content.replace(/kind: 'three-buttons', label: 'A dialog with three buttons', color: primaryColor/g, "kind: 'three-buttons', label: 'A dialog with three buttons', color: '#0ea5e9'");
  
  // Custom style -> Indigo
  content = content.replace(/kind: 'custom-style', label: 'A message with custom width, padding and background', color: 'var\(--primary\)'/g, "kind: 'custom-style', label: 'A message with custom width, padding and background', color: '#6366f1'");
  
  // Email verify -> Indigo
  content = content.replace(/kind: 'email-verify', label: 'Email Verification', color: primaryColor/g, "kind: 'email-verify', label: 'Email Verification', color: '#6366f1'");
  
  // Join community -> Purple
  content = content.replace(/kind: 'join-community', label: 'Join Our Community', color: 'var\(--primary\)'/g, "kind: 'join-community', label: 'Join Our Community', color: '#8b5cf6'");
  
  // Bottom-right toast -> Blue
  content = content.replace(/kind: 'toast-bottom-right', label: 'Bottom-Right Toast \(Web\)', color: primaryColor/g, "kind: 'toast-bottom-right', label: 'Bottom-Right Toast (Web)', color: '#0ea5e9'");
  
  // Toast success -> Green
  // It was already #10b981 in the list, but let's check its button inside the switch

  // Replace btn('var(--primary)') based on the case:
  
  // case 'basic':
  content = content.replace(/case 'basic':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?OK<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#0ea5e9')"));

  // case 'title-text':
  content = content.replace(/case 'title-text':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?OK<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#0ea5e9')"));

  // case 'long-content':
  content = content.replace(/case 'long-content':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?OK<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#0ea5e9')").replace("color: 'var(--primary)'", "color: '#0ea5e9'"));
  
  // case 'toast-error':
  content = content.replace(/case 'toast-error':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?OK<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#ef4444')"));

  // case 'custom-html':
  content = content.replace(/case 'custom-html':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?OK<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#0ea5e9')").replace(/var\(--primary\)/g, '#0ea5e9'));

  // case 'three-buttons':
  content = content.replace(/case 'three-buttons':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?Save<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#0ea5e9')"));

  // case 'toast-success':
  content = content.replace(/case 'toast-success':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?Awesome!<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#10b981')").replace("colorFilter('var(--primary)')", "colorFilter('#10b981')"));

  // case 'email-verify':
  content = content.replace(/case 'email-verify':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?Send Verification<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#6366f1')").replace(/fallbackColor=\{primaryColor\}/g, 'fallbackColor="#6366f1"'));

  // case 'join-community':
  content = content.replace(/case 'join-community':[\s\S]*?btn\('var\(--primary\)'\)[\s\S]*?Join Now<\/button>/, match => match.replace("btn('var(--primary)')", "btn('#8b5cf6')").replace(/var\(--primary\)/g, '#8b5cf6').replace(/primaryColor/g, "'#8b5cf6'"));

  // case 'custom-style':
  // Wait, I should also replace the btn('var(--primary)') in custom-style if it has any, but it probably doesn't.
  // Wait, custom-style has buttons? Let's check. No, the list I grepped didn't show a button for custom-style.

  fs.writeFileSync(file, content, 'utf-8');
  console.log('SafeSweetAlerts.tsx semantic colors fixed!');
} else {
  console.log('File not found');
}
