export type EventType =
  'compile-started' |
  'compile-compiled' |
  'compile-errored' |
  'lint-linted' |
  'lint-errored' |
  'format-verified' |
  'format-errored' |
  'source-files-changed';

export type Callback = () => void;

export interface Bus {
  signal(eventType: EventType): void;
  register(type: EventType, callback: Callback): void;
  registerAll(types: EventType[], callback: Callback): void;
  unregister(callback: Callback): void;
}

export let createBus = (): Bus => {
  let allSubscribers: { [index: string]: Callback[] } = {};
  let bus: Bus = {
    signal: (eventType) => {
      let subscribers = allSubscribers[eventType];
      if (subscribers) {
        subscribers.forEach(s => s());
      }
    },
    register: (type, callback) => {
      let subscribers = allSubscribers[type];
      if (!subscribers) {
        subscribers = allSubscribers[type] = [];
      }
      subscribers.push(callback);
    },
    registerAll: (types: EventType[], callback) => {
      types.forEach(type => bus.register(type, callback));
    },
    unregister: (callback) => {
      Object.keys(allSubscribers).forEach(eventType => {
        let subscribers = allSubscribers[eventType];
        let index = subscribers.indexOf(callback);
        if (index >= 0) {
          subscribers.splice(index, 1);
        }
      });
    }
  };
  return bus;
};
