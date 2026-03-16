const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace colors
  content = content.replace(/#25D366/g, '#22C55E'); // WhatsApp green -> Landing green
  content = content.replace(/#1aab52/g, '#16A34A'); // Dark green
  content = content.replace(/#05080D/g, '#08070D'); // App background -> Landing background
  content = content.replace(/#080C10/g, '#08070D'); // Other background -> Landing background
  content = content.replace(/rgba\(37,211,102/g, 'rgba(34,197,94');

  // Update styles block
  content = content.replace(/\.btn-primary \{ background: linear-gradient.*? \}/, '.btn-primary { background: #22C55E; color: #08070D; font-family: var(--font-outfit); font-weight: 800; border-radius: 999px; transition: transform 0.25s, box-shadow 0.25s; }');
  
  content = content.replace(/\.btn-primary { background: linear-gradient.*? \}/, '.btn-primary { background: #22C55E; color: #08070D; font-family: var(--font-outfit); font-weight: 800; border-radius: 999px; transition: transform 0.25s, box-shadow 0.25s; }');
  
  content = content.replace(/\.btn-primary:not\(:disabled\):hover \{ transform: translateY\(-2px\); box-shadow: 0 8px 32px rgba.*? \}/, '.btn-primary:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(34,197,94,0.4); }');

  // Tag pill
  content = content.replace(/\.tag-pill \{ background: linear-gradient.*? \}/, '.tag-pill { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); }');
  
  // Number gradient
  content = content.replace(/\.number-gradient \{ background: linear-gradient.*? \}/, '.number-gradient { background: linear-gradient(125deg,#7C3AED 0%,#A855F7 35%,#22C55E 70%,#7C3AED 100%); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: sellix-shimmer 6s linear infinite; }');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

['login', 'signup', 'verify'].forEach(page => {
  processFile(`c:\\projects\\WhatSapp App\\src\\app\\(auth)\\${page}\\page.tsx`);
});
