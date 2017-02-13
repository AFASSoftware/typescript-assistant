import { npmInstall, packageJsonChanged } from '../helpers/helpers';

/* tslint:disable:no-console */

console.log('postmerge git hook running');

if (packageJsonChanged('ORIG_HEAD', 'HEAD')) {
  console.log('Running npm install...');
  npmInstall();
} else {
  console.log('No need to run npm install');
}
