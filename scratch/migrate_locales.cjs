const fs = require('fs');

function migrateFile(filePath) {
    console.log(`Migrating ${filePath}...`);
    let data;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(content);
    } catch (e) {
        console.error(`Failed to parse ${filePath}: ${e.message}`);
        return;
    }

    const newData = {};
    const keys = Object.keys(data);

    keys.forEach(key => {
        if (key.includes('.')) {
            const parts = key.split('.');
            let current = newData;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    // Last part: set the value
                    current[part] = data[key];
                } else {
                    // Inner part: ensure object exists
                    if (!current[part]) {
                        current[part] = {};
                    }
                    if (typeof current[part] !== 'object') {
                        // Conflict: a key already exists with this name as a value?
                        // This shouldn't happen with our known keys like 'session.'
                        console.warn(`Conflict at ${part} for key ${key}`);
                    }
                    current = current[part];
                }
            }
        } else {
            // Root key without dot
            if (!newData[key]) {
                newData[key] = data[key];
            } else {
                // Merge if it already exists (e.g. 'session' root key vs 'session.x' flat key)
                if (typeof newData[key] === 'object' && typeof data[key] === 'object') {
                    Object.assign(newData[key], data[key]);
                } else {
                    console.warn(`Cannot merge non-object key: ${key}`);
                }
            }
        }
    });

    // Final merge for any root keys that might have been processed out of order
    // (e.g. if 'session.snapshots' was processed before 'session')
    // Wait, the logic above handles it correctly if we iterate all keys.
    // If 'session' comes later, it will be merged into newData['session'].

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
    console.log(`SUCCESS: Migrated ${filePath}`);
}

migrateFile('c:/Projet_David/GM-OS-v5/src/locales/fr/modules.json');
migrateFile('c:/Projet_David/GM-OS-v5/src/locales/en/modules.json');
