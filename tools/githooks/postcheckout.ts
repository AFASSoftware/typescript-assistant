import { npmInstall } from '../helpers/helpers';
import { packageJsonChanged } from '../helpers/helpers';

console.log('postcheckout git hook running');

let gitParams = process.env.GIT_PARAMS;

let [ previousHead ] = gitParams.split(' ');
if (previousHead === '%1') {
  previousHead = 'ORIG_HEAD';
}

if (packageJsonChanged(previousHead, 'HEAD')) {
  console.log('Running npm install...');
  npmInstall();
} else {
  console.log('No need to run npm install');
}
