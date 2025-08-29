// Just run Next.js dev server directly
import { spawn } from 'child_process';

console.log('🎬 Starting Shoowflix movie streaming platform...');

const nextDev = spawn('npx', ['next', 'dev', '-H', '0.0.0.0', '-p', '5000'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

nextDev.on('error', (error) => {
  console.error('Failed to start Next.js server:', error);
  process.exit(1);
});

nextDev.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code || 0);
});