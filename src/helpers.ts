import { execSync, spawn } from 'child_process';
import { writeFileSync } from 'fs';
import * as path from 'path';

export let findChangedFiles = (refA?: string, refB?: string) => {
  if (refA === undefined) {
    refA = 'HEAD';
  }
  if (refB === undefined) {
    refB = '';
  }

  let output = execSync(`git diff --name-only --diff-filter=ACMR ${refA} ${refB}`, { encoding: 'utf8' });
  return output.split('\n').filter(fileName => fileName.length > 0);
};

let escapeSpaces = (filePath: string): string => {
  let escapeSequence = (path.sep === '/') ? '\\ ' : '^ ';
  return filePath.replace(/ /g, escapeSequence);
};

export let npmInstall = () => {
  let scriptPath = `${process.cwd()}/build/npm-install.js`;
  let currentDir = process.cwd().replace(/\\/g, '\\\\');

  writeFileSync(scriptPath, `
console.log('Updating dependencies, please wait...');
const child_process = require('child_process');
try {
  child_process.execSync('npm install', { cwd: '${currentDir}', encoding: 'UTF-8', stdio: [0, 1, 2] });
  child_process.execSync('npm dedupe', { cwd: '${currentDir}', encoding: 'UTF-8', stdio: [0, 1, 2] });
} catch (e) {
  console.error('npm install failed', e);
  console.log('Press enter to continue');
  process.stdin.once('data', function(){
    process.exit(1);
  });
}
`);
  let install = spawn('node', [escapeSpaces(scriptPath)], { stdio: 'ignore', shell: true, detached: true });
  install.unref();
};

export let packageJsonChanged = (refA: string, refB: string) => findChangedFiles(refA, refB).filter(f => f.indexOf('package.json') !== -1).length >= 1;

export let filterTsFiles = (files: string[]) => {
  return files.filter(f => f.slice(-3) === '.ts' && f.slice(-5) !== '.d.ts');
};
