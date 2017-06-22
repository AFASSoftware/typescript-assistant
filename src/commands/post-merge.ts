// post-checkout and post-merge are used to run 'npm install' if needed

import { npmInstall, packageJsonChanged } from '../helpers';
import { Logger } from '../logger';

/* tslint:disable:no-console */

export let createPostMergeCommand = (deps: { logger: Logger }) => {
  let { logger } = deps;
  return {
    execute: () => {
      logger.log('hooks', 'postmerge git hook running');

      try {
        if (packageJsonChanged('ORIG_HEAD', 'HEAD')) {
          logger.log('hooks', 'Running npm install...');
          npmInstall();
        } else {
          logger.log('hooks', 'No need to run npm install');
        }
      } catch (error) {
        logger.error('hooks', `post-merge hook failed, continuing anyway ${error.message}`);
      }
    }
  };
};
