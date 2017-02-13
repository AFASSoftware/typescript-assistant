import * as childProcess from 'child_process';
import { SinonStub, stub } from 'sinon';
import { findChangedFiles, packageJsonChanged } from './helpers';
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
tools/githooks/postcheckout.ts
tools/githooks/postmerge.ts`);
    expect(findChangedFiles('ORIG_HEAD', 'HEAD')).to.deep.equal(['package.json', 'tools/githooks/postcheckout.ts', 'tools/githooks/postmerge.ts']);
  });

  it('can tell if package.json has changed', () => {
    execSync.returns(`package.json`);
    expect(packageJsonChanged('ORIG_HEAD', 'HEAD')).to.be.true;
  });

});
