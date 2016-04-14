import {resolve} from 'path';

export let absolutePath = (path: string) => {
  return resolve(process.cwd(), path);
};
