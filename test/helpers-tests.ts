import * as childProcess from 'child_process';
import { SinonStub, stub } from 'sinon';
import { findChangedFiles, packageJsonChanged } from '../src/helpers';
import { expect } from 'chai';

describe('git-helper', () => {
  let execSync: SinonStub;

  beforeEach(() => {
    execSync = stub(childProcess, 'execSync');
  });

  afterEach(() => {
    execSync.restore();
  });

  it('can tell which files have changed', () => {
    execSync.returns(`package.json
tools/githooks/post-checkout.ts
tools/githooks/post-merge.ts`);
    expect(findChangedFiles('ORIG_HEAD', 'HEAD')).to.deep.equal(['package.json', 'tools/githooks/post-checkout.ts', 'tools/githooks/post-merge.ts']);
  });

  it('can tell if package.json has changed', () => {
    execSync.returns(`
package.json
package-lock.json
`);
    expect(packageJsonChanged('ORIG_HEAD', 'HEAD')).to.be.true;
  });

});
