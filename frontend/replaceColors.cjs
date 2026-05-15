const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Hex Colors
  { regex: /#006845/g, replacement: '#0A4174' },
  { regex: /#16A34a/gi, replacement: '#0D5A9E' },
  { regex: /#16a34a/g, replacement: '#0D5A9E' },
  { regex: /#E5F9E0/gi, replacement: '#E6F0FA' },
  { regex: /#e5f9e0/g, replacement: '#E6F0FA' },
  
  // Tailwind Green classes to Blue
  { regex: /bg-green-50/g, replacement: 'bg-blue-50' },
  { regex: /bg-green-100/g, replacement: 'bg-blue-100' },
  { regex: /bg-green-200/g, replacement: 'bg-blue-200' },
  { regex: /bg-green-300/g, replacement: 'bg-blue-300' },
  { regex: /bg-green-400/g, replacement: 'bg-blue-400' },
  { regex: /bg-green-500/g, replacement: 'bg-blue-500' },
  { regex: /bg-green-600/g, replacement: 'bg-blue-600' },
  { regex: /bg-green-700/g, replacement: 'bg-blue-700' },
  { regex: /bg-green-800/g, replacement: 'bg-blue-800' },
  { regex: /bg-green-900/g, replacement: 'bg-blue-900' },

  { regex: /text-green-500/g, replacement: 'text-blue-500' },
  { regex: /text-green-600/g, replacement: 'text-blue-600' },
  { regex: /text-green-700/g, replacement: 'text-blue-700' },
  { regex: /text-green-800/g, replacement: 'text-blue-800' },

  { regex: /border-green-500/g, replacement: 'border-blue-500' },
  { regex: /border-green-600/g, replacement: 'border-blue-600' },
  
  { regex: /ring-green-500/g, replacement: 'ring-blue-500' },
  
  { regex: /hover:bg-green-50/g, replacement: 'hover:bg-blue-50' },
  { regex: /hover:bg-green-500/g, replacement: 'hover:bg-blue-500' },
  { regex: /hover:bg-green-600/g, replacement: 'hover:bg-blue-600' },
  { regex: /hover:bg-green-700/g, replacement: 'hover:bg-blue-700' },
  
  { regex: /hover:text-green-500/g, replacement: 'hover:text-blue-500' },
  { regex: /hover:text-green-600/g, replacement: 'hover:text-blue-600' },
  
  { regex: /focus:ring-green-500/g, replacement: 'focus:ring-blue-500' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;
        
        for (const { regex, replacement } of replacements) {
          content = content.replace(regex, replacement);
        }
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      } catch (err) {
        console.error(`Error processing file ${fullPath}:`, err);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Color replacement complete.");
