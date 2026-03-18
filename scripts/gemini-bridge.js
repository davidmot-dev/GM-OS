#!/usr/bin/env node
/**
 * Utility bridge to pass project context to Gemini CLI.
 * Usage: node scripts/gemini-bridge.js "Ask something about the project"
 */

import { spawn } from 'child_process';
import path from 'path';

const query = process.argv[2];

if (!query) {
  console.error('Please provide a query.');
  process.exit(1);
}

// Default context directories
const contextDirs = ['docs', 'documentation', 'src/modules/ai'];

const args = [
  '--context',
  ...contextDirs,
  query
];

console.log(`🚀 Sending query to Gemini CLI with context: ${contextDirs.join(', ')}...`);

const gemini = spawn('npx', ['@google/gemini-cli', ...args], {
  stdio: 'inherit',
  shell: true
});

gemini.on('close', (code) => {
  if (code !== 0) {
    console.error(`Gemini CLI exited with code ${code}`);
  }
});
