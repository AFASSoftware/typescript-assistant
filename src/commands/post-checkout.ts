import { Logger } from '../logger';
import { npmInstall, packageJsonChanged } from '../helpers';
import { Command } from './command';

export function createPostCheckoutCommand(deps: { logger: Logger }): Command<void> {
  const { logger } = deps;

  return {
    execute() {
      try {
        logger.log('hooks', 'postcheckout git hook running');

        let gitParams = process.env.HUSKY_GIT_PARAMS;

        if (!gitParams) {
          throw new Error('Expected HUSKY_GIT_PARAMS to be set by husky');
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

      return Promise.resolve(true);
    }
  };
}
