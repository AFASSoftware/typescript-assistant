export interface Logger {
  log(category: string, message: string): void;
  error(category: string, message: string): void;
};

export let createConsoleLogger = (): Logger => {
  let currentCategory: string;
  let setCategory = (category: string) => {
    if (category !== currentCategory) {
      console.log(`${category}:`);
      currentCategory = category;
    }
  };
  return {
    log: (category, message) => {
      setCategory(category);
      console.log('  ' + message);
    },
    error: (category, message) => {
      setCategory(category);
      console.error('! ' + message);
    }
  };
};
