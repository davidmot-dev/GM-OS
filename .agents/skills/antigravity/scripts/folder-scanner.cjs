#!/usr/bin/env node

/**
 * Antigravity Folder Scanner & Gemini Prompt Generator
 * Scanne un dossier et génère un rapport Markdown prêt à être envoyé à Gemini.
 */

const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2] || '.';
const exclude = ['.git', 'node_modules', 'dist', '.agents'];

function scan(dir, depth = 0) {
    let report = '';
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        if (exclude.includes(file)) return;
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        
        const indent = '  '.repeat(depth);
        if (stats.isDirectory()) {
            report += `${indent}📂 **${file}/**\n`;
            report += scan(fullPath, depth + 1);
        } else {
            const size = (stats.size / 1024).toFixed(1);
            report += `${indent}📄 ${file} (\`${size} KB\`)\n`;
        }
    });
    return report;
}

try {
    const fullPath = path.resolve(targetDir);
    let mdReport = `### 🌌 Rapport de Structure Antigravity : \`${path.basename(fullPath)}\`\n\n`;
    mdReport += `**Date de scan :** ${new Date().toLocaleString()}\n`;
    mdReport += `**Chemin :** \`${fullPath}\`\n\n`;
    mdReport += `#### 🌳 Arborescence\n\n`;
    mdReport += scan(fullPath);
    mdReport += `\n---\n**Instructions Gemini :** Analyse l'architecture de ce dossier, identifie les composants clés et propose des pistes d'amélioration.\n`;
    
    process.stdout.write(mdReport);
} catch (err) {
    process.stderr.write(`❌ Erreur Antigravity : ${err.message}\n`);
    process.exit(1);
}
