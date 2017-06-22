import { Logger } from '../logger';
import { npmInstall, packageJsonChanged } from '../helpers';

export let createPostCheckoutCommand = (deps: { logger: Logger }) => {
  let { logger } = deps;
  return {
    execute: () => {
      try {
        logger.log('hooks', 'postcheckout git hook running');

        let gitParams = process.env.GIT_PARAMS;

        if (!gitParams) {
          throw new Error('Expected GIT_PARAMS to be set by husky');
        }

        let [previousHead] = gitParams.split(' ');
        if (previousHead === '%1') {
          previousHead = 'ORIG_HEAD';
        }

        if (packageJsonChanged(previousHead, 'HEAD')) {
          logger.log('hooks', 'Running npm install...');
          npmInstall();
        } else {
          logger.log('hooks', 'No need to run npm install');
        }
      } catch (error) {
        logger.error('hooks', `post-checkout hook failed, continuing anyway ${error.message}`);
      }
    }
  };
};
