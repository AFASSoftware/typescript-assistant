import { resolve } from 'path';

export let absolutePath = (path: string) => {
  return resolve(process.cwd(), path);
};

export let isTypescriptFile = (fileName: string) => {
  return fileName.substr(fileName.length - 3) === '.ts';
};
