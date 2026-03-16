const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Global replacements for page.tsx and layout
  content = content.replace(/'Syne',\s*sans-serif/g, 'var(--font-outfit)');
  content = content.replace(/'DM Serif Display',\s*serif/g, 'var(--font-outfit)');
  content = content.replace(/'DM Sans',\s*sans-serif/g, 'var(--font-jakarta)');
  content = content.replace(/'Sora',\s*'DM_Sans',\s*sans-serif/g, 'var(--font-jakarta)');
  // Tailwind custom class removal
  content = content.replace(/font-\['Sora','DM_Sans',sans-serif\]/g, 'font-sans');
  
  // Remove google fonts @imports
  content = content.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']+'\);?\n?/g, '');

  // For testimonials "fontFamily: "serif"" -> outfit
  content = content.replace(/fontFamily: "serif"/g, 'fontFamily: "var(--font-outfit)"');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

walk('c:\\projects\\WhatSapp App\\src\\app');
