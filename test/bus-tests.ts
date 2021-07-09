import { expect } from "chai";
import * as sinon from "sinon";

import { Bus, createBus } from "../src/bus";

describe("bus", () => {
  let bus: Bus;

  beforeEach(() => {
    bus = createBus();
  });

  it("broadcasts events to subscribers", () => {
    let callback = sinon.stub();
    bus.register("compile-started", callback);
    bus.signal("compile-started");
    expect(callback.calledOnce).to.be.true;
  });
});
