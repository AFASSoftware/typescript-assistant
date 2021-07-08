import { resolve } from 'path';

export function absolutePath(path: string): string {
  return resolve(process.cwd(), path);
}

export function isTypescriptFile(fileName: string): boolean {
  return fileName.substr(fileName.length - 3) === '.ts';
}
