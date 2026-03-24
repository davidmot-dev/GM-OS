
import path from 'node:path';
import fs from 'fs-extra';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Mock a minimal version of RAGEngine logic to verify retrieval
async function testRetrieval(systemId, campaignName) {
    const docsPath = path.resolve('./docs');
    console.log(`Checking retrieval for System: ${systemId}, Campaign: ${campaignName}`);
    console.log(`Docs path: ${docsPath}`);

    if (!fs.existsSync(docsPath)) {
        console.error("Docs folder not found!");
        return;
    }

    const getAllFiles = async (dir) => {
        let results = [];
        const list = await fs.readdir(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat && stat.isDirectory()) {
                results.push(...await getAllFiles(filePath));
            } else {
                const ext = path.extname(file).toLowerCase();
                if (['.md', '.txt', '.pdf'].includes(ext)) {
                    results.push(filePath);
                }
            }
        }
        return results;
    };

    const files = await getAllFiles(docsPath);
    console.log(`Found ${files.length} candidate files.`);

    const sys = systemId.toLowerCase();
    const camp = campaignName.toLowerCase();
    const matches = [];

    for (const filePath of files) {
        const relPath = path.relative(docsPath, filePath);
        const lowerPath = relPath.toLowerCase();
        
        const isSystemFile = lowerPath.includes(`systems/${sys}`) || lowerPath.includes(`systems\\${sys}`);
        const isCampaignFile = lowerPath.includes(`campaigns/${camp}`) || lowerPath.includes(`campaigns\\${camp}`);
        const isMatchedByName = lowerPath.includes(sys) || lowerPath.includes(camp);

        if (isSystemFile || isCampaignFile || isMatchedByName) {
            matches.push(relPath);
        }
    }

    console.log(`\n--- Matches found for "${systemId}" ---`);
    matches.sort().forEach(m => console.log(`[MATCH] ${m}`));
    
    if (matches.length > 0) {
        console.log(`\nExtracted content preview from first match (${matches[0]}):`);
        const firstMatchPath = path.join(docsPath, matches[0]);
        const ext = path.extname(firstMatchPath).toLowerCase();
        
        if (ext === '.md') {
            const content = await fs.readFile(firstMatchPath, 'utf8');
            console.log(content.substring(0, 500) + "...");
        } else if (ext === '.pdf') {
            const dataBuffer = await fs.readFile(firstMatchPath);
            const data = await pdf(dataBuffer);
            console.log(data.text.substring(0, 500) + "...");
        }
    } else {
        console.log("No specific matches found. Check your file structure in /docs.");
    }
}

testRetrieval('alien', 'coc7');
