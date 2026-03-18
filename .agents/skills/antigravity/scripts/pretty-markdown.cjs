#!/usr/bin/env node

/**
 * Antigravity Pretty-Markdown Formatter
 * Formatte les sorties JSON ou brutes de la CLI Gemini en Markdown pur et lisible.
 */

const fs = require('fs');

function formatToMarkdown(input) {
  try {
    const data = JSON.parse(input);
    let md = `### 🛰️ Rapport Antigravity : Analyse de Données\n\n`;
    
    if (Array.isArray(data)) {
      md += `| Propriété | Détails |\n| :--- | :--- |\n`;
      data.forEach((item, index) => {
        md += `| **Item ${index + 1}** | ${JSON.stringify(item)} |\n`;
      });
    } else {
      md += `#### Détails de l'Objet\n\n`;
      for (const [key, value] of Object.entries(data)) {
        md += `*   **${key}** : \`${typeof value === 'object' ? JSON.stringify(value) : value}\`\n`;
      }
    }
    return md;
  } catch (e) {
    // Si ce n'est pas du JSON, on entoure juste de blocs de code propres
    return `### 📄 Sortie Brute Antigravity\n\n\`\`\`text\n${input}\n\`\`\`\n`;
  }
}

const input = fs.readFileSync(0, 'utf-8');
process.stdout.write(formatToMarkdown(input));
