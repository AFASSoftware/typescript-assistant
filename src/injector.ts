export interface Injector<Dependencies> {
  inject<T>(createFunction: (dependencies: Dependencies) => T): T;
}

export let createInjector = <Dependencies>(dependencies: Partial<Dependencies>): Injector<Dependencies> => {
  return {
    inject: <T>(createFunction: (dependencies: Dependencies) => T) => createFunction(dependencies as any as Dependencies)
  };
};
