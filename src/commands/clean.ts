import * as fs from 'fs';
import * as glob from 'glob';
import { Command } from './command';

function deleteFolderRecursive(path: string) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file, index) => {
      let curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

export function createCleanCommand(): Command<void> {
  return {
    execute() {
      deleteFolderRecursive('./build');
      deleteFolderRecursive('./dist');
      let rogueFiles = glob.sync('{src,test}/**/*.js{,.map}', {});
      rogueFiles.forEach((file) => fs.unlinkSync(file));

      return Promise.resolve(true);
    }
  };
}
