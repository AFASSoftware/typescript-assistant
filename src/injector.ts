export interface Injector<Dependencies> {
  inject<T>(createFunction: (dependencies: Partial<Dependencies>) => T): T;
}

export let createInjector = <Dependencies>(
  dependencies: Partial<Dependencies>
): Injector<Dependencies> => {
  return {
    inject: <T>(createFunction: (dependencies: Partial<Dependencies>) => T) =>
      createFunction(dependencies),
  };
};
