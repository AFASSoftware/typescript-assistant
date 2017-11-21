import { execSync, spawn } from 'child_process';
import { writeFileSync } from 'fs';

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

export let npmInstall = () => {
  let scriptPath = `${process.cwd()}/build/npm-install.js`;
  let currentDir = process.cwd().replace(/\\/g, '\\\\');

  writeFileSync(scriptPath, `
var fs = require('fs');

var tryNpmInstall = function() {
  if (fs.existsSync('.git/index.lock')) {
    return false;
  }
  console.log('Updating dependencies, please wait...');
  const child_process = require('child_process');
  try {
    child_process.execSync('npm install', { encoding: 'UTF-8', stdio: [0, 1, 2] });
    child_process.execSync('npm dedupe', { encoding: 'UTF-8', stdio: [0, 1, 2] });
  } catch (e) {
    console.error('npm install failed', e);
    console.log('Press enter to continue');
    process.stdin.once('data', function(){
      process.exit(1);
    });
  }
  process.exit(0);
}

fs.watch('.git', {persistent: true}, tryNpmInstall);

if (!tryNpmInstall()) {
  console.log('waiting for git before running npm install');
}
`);
  let install = spawn('node', ['./build/npm-install.js'], { stdio: 'ignore', shell: true, detached: true, cwd: currentDir });
  install.unref();
};

export let packageJsonChanged = (refA: string, refB: string) => findChangedFiles(refA, refB).filter(f => f.indexOf('package.json') !== -1).length >= 1;

export let filterTsFiles = (files: string[]) => {
  return files.filter(f => f.slice(-3) === '.ts' && f.slice(-5) !== '.d.ts');
};
