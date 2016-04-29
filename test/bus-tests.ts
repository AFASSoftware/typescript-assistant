import {Bus, createBus} from '../src/bus';
import * as sinon from 'sinon';
import {expect} from 'chai';

describe('bus', () => {

  let bus: Bus;

  beforeEach(() => {
    bus = createBus();
  });

  it('broadcasts events to subscribers', () => {
    let callback = sinon.stub();
    bus.register('compile-started', callback);
    bus.signal('compile-started');
    expect(callback.calledOnce).to.be.true;
  });

});
