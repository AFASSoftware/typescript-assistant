import { execSync } from 'child_process';

export let findChangedFiles = (refA: string, refB: string) => {
  if (refB === undefined) {
    refB = '';
  }

  let output = execSync(`git diff --name-only --diff-filter=ACM ${refA} ${refB}`, { encoding: 'utf8' });
  return output.split('\n').filter(fileName => fileName.length > 0);
};

export let npmInstall = () => {
  try {
    execSync('npm install', { encoding: 'UTF-8', stdio: [0, 1, 2] });
  } catch (err) {
    console.error('npm install was not successful, ignoring', err);
  }
};

export let packageJsonChanged = (refA: string, refB: string) => findChangedFiles(refA, refB).filter(f => f.indexOf('package.json') !== -1).length >= 1;
