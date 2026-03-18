const { spawn } = require('child_process');
const path = require('path');

async function testSpawn(name, cmd, args, options = {}) {
  console.log(`\n--- Testing: ${name} ---`);
  console.log('Command:', cmd);
  console.log('Options:', JSON.stringify(options));
  
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, options);
      child.on('error', (err) => {
        console.error('Spawn error event:', err.message || err);
        resolve();
      });
      child.on('close', (code) => {
        console.log('Process closed with code:', code);
        resolve();
      });
    } catch (e) {
      console.error('Catch error:', e.message || e);
      resolve();
    }
  });
}

const electronCmd = path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe');

(async () => {
  await testSpawn('System CMD', 'cmd.exe', ['/c', 'ver']);
  await testSpawn('Electron (Direct)', electronCmd, ['--version']);
  await testSpawn('Electron (Shell:true)', electronCmd, ['--version'], { shell: true });
})();
