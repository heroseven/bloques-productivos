import fs from 'fs';
import path from 'path';

const componentsPath = path.join(process.cwd(), 'src', 'components');

const replacements = [
  { from: /bg-white/g, to: "bg-white dark:bg-slate-800" },
  { from: /bg-slate-50/g, to: "bg-slate-50 dark:bg-slate-800/50" },
  { from: /bg-slate-100/g, to: "bg-slate-100 dark:bg-slate-800" },
  
  { from: /border-slate-100/g, to: "border-slate-100 dark:border-slate-700" },
  { from: /border-slate-200/g, to: "border-slate-200 dark:border-slate-600" },
  
  { from: /text-slate-700/g, to: "text-slate-700 dark:text-slate-200" },
  { from: /text-slate-600/g, to: "text-slate-600 dark:text-slate-300" },
  { from: /text-slate-500/g, to: "text-slate-500 dark:text-slate-400" },
  { from: /text-slate-800/g, to: "text-slate-800 dark:text-slate-100" },
  { from: /text-slate-900/g, to: "text-slate-900 dark:text-slate-50" },
  
  { from: /hover:bg-slate-50/g, to: "hover:bg-slate-50 dark:hover:bg-slate-700" },
  { from: /hover:bg-slate-100/g, to: "hover:bg-slate-100 dark:hover:bg-slate-700" },
  { from: /hover:bg-slate-200/g, to: "hover:bg-slate-200 dark:hover:bg-slate-600" },
  
  { from: /hover:text-slate-700/g, to: "hover:text-slate-700 dark:hover:text-slate-200" },
  { from: /hover:text-slate-600/g, to: "hover:text-slate-600 dark:hover:text-slate-300" },
  { from: /hover:text-slate-500/g, to: "hover:text-slate-500 dark:hover:text-slate-400" },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  replacements.forEach(r => {
    // Avoid doubling if already processed
    // Actually using simple replace is risky if run multiple times, but this is a one-off.
    // Let's refine rules to avoid duplicates.
    content = content.replace(r.from, (match) => {
       return r.to;
    });
  });
  
  // Fix nested replacements like "bg-white dark:bg-slate-800 dark:bg-slate-800"
  content = content.replace(/dark:bg-slate-800 dark:bg-slate-800/g, "dark:bg-slate-800");
  content = content.replace(/dark:bg-slate-800\/50 dark:bg-slate-800\/50/g, "dark:bg-slate-800/50");
  content = content.replace(/dark:bg-slate-800 dark:bg-slate-800\/50/g, "dark:bg-slate-800");
  content = content.replace(/dark:border-slate-700 dark:border-slate-700/g, "dark:border-slate-700");
  content = content.replace(/dark:border-slate-600 dark:border-slate-600/g, "dark:border-slate-600");
  content = content.replace(/dark:text-slate-200 dark:text-slate-200/g, "dark:text-slate-200");
  content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, "dark:text-slate-300");
  content = content.replace(/dark:text-slate-400 dark:text-slate-400/g, "dark:text-slate-400");
  content = content.replace(/dark:text-slate-100 dark:text-slate-100/g, "dark:text-slate-100");
  content = content.replace(/dark:text-slate-50 dark:text-slate-50/g, "dark:text-slate-50");
  content = content.replace(/dark:hover:bg-slate-700 dark:hover:bg-slate-700/g, "dark:hover:bg-slate-700");
  content = content.replace(/dark:hover:bg-slate-600 dark:hover:bg-slate-600/g, "dark:hover:bg-slate-600");
  content = content.replace(/dark:hover:text-slate-[0-9]+ dark:hover:text-slate-[0-9]+/g, (m) => m.split(' ')[0]);
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

const files = fs.readdirSync(componentsPath);
files.forEach(file => {
  if (file.endsWith('.tsx')) {
    processFile(path.join(componentsPath, file));
  }
});
console.log('Applied dark mode variants manually via script.');
