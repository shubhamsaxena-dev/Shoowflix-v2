// Simplified Next.js server startup
import { spawn } from 'child_process';

console.log('🎬 Starting Shoowflix...');

const nextProcess = spawn('npx', ['next', 'dev', '-H', '0.0.0.0', '-p', '5000'], {
  stdio: 'inherit'
});

nextProcess.on('close', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill();
  process.exit(0);
});