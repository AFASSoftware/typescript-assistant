import * as fs from 'fs';
import { Logger } from '../logger';
import { compile as handlebarsCompile } from 'handlebars';
import { Command } from './command';

export function createInitCommand(dependencies: { logger: Logger }): Command<boolean> {
  function log(msg: string) { return dependencies.logger.log('init', msg); }

  function addLinesToFile(filePath: string, linesToAdd: { line: string, ifNotExists: RegExp }[]) {
    let lines: string[] = [];
    if (fs.existsSync(filePath)) {
      lines = fs.readFileSync(filePath, { encoding: 'utf-8' }).split('\n');
    }
    let count = 0;
    linesToAdd.forEach(lineToAdd => {
      if (lines.every(line => !lineToAdd.ifNotExists.test(line))) {
        count++;
        lines.push(lineToAdd.line);
      }
    });
    if (count > 0) {
      fs.writeFileSync(filePath, lines.join('\n'), { encoding: 'utf-8' });
      log(`Added ${count} instructions to '${filePath}'`);
    }
  }

  function addPackageJsonScripts(scripts: { [index: string]: string }): void {
    let packageJson = fs.readFileSync('package.json', { encoding: 'utf-8' });
    let data = JSON.parse(packageJson);
    data.scripts = data.scripts || {};
    let count = 0;
    for (let scriptName of Object.keys(scripts)) {
      if (!data.scripts[scriptName]) {
        data.scripts[scriptName] = scripts[scriptName];
        count++;
      }
    }
    if (count > 0) {
      fs.writeFileSync('package.json', JSON.stringify(data, undefined, 2), { encoding: 'utf-8' });
      log(`Added ${count} script entries to package.json`);
    }
  }

  function addPackageJsonSectionFromTemplate(sectionName: string, templateData: any): void {
    let packageJson = fs.readFileSync('package.json', { encoding: 'utf-8' });
    let data = JSON.parse(packageJson);
    if (!data[sectionName]) {
      let template = fs.readFileSync(
        `${__dirname}/../../templates/package-json/${sectionName}.hbs`,
        { encoding: 'utf-8' }
      );
      let result = JSON.parse(handlebarsCompile(template)(templateData));
      data[sectionName] = result;

      fs.writeFileSync('package.json', JSON.stringify(data, undefined, 2), { encoding: 'utf-8' });

      log(`Added section ${sectionName} to package.json`);
    }
  }

  function writeFromTemplateIfNotExists(filePath: string, info: any) {
    if (fs.existsSync(filePath)) {
      return;
    }
    let template = fs.readFileSync(
      `${__dirname}/../../templates/${filePath.replace(/\//, '-')}.hbs`,
      { encoding: 'utf-8' }
    );
    let result = handlebarsCompile(template)(info);
    fs.writeFileSync(filePath, result, { encoding: 'utf-8' });
    log(`Wrote '${filePath}'`);
  }

  return {
    execute(library: boolean) {
      addLinesToFile('.gitignore', [
        { line: '/build', ifNotExists: /\/?build/ },
        { line: '/dest', ifNotExists: /\/?dest/ },
        { line: 'node_modules', ifNotExists: /\/?node_modules/ },
        { line: '/.idea', ifNotExists: /\/?.idea/ },
        { line: '/.vscode', ifNotExists: /\/?.vscode/ }
      ]);

      addLinesToFile('.gitattributes', [
        { line: '* text eol=lf', ifNotExists: /.*eol=lf.*/ }
      ]);

      addLinesToFile('.editorconfig', [
        {
          line: `[*]
indent_style = space
indent_size = 2
charset = utf-8
end_of_line = lf
trim_trailing_whitespace = true
insert_final_newline = true`,
          ifNotExists: /.*indent_style.*/
        }
      ]);

      let templateData = {
        library,
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        typescriptAssistantVersion: require('../../package.json').version
      };

      writeFromTemplateIfNotExists('package.json', templateData);

      if (library) {
        addLinesToFile('.npmignore', [
          {
            line: `/**/*
!/dist/**/*
!/README.md`,
            ifNotExists: /.*dist.*/
          }
        ]);
      }

      addPackageJsonScripts({
        prepublishOnly: 'tsa clean && npm -s run dist',
        assist: 'tsa assist',
        release: 'tsa release',
        fix: 'tsa fix',
        clean: 'tsa clean',
        dist: 'tsc -p ./src/tsconfig.json',
        ci: 'tsa ci',
        test: 'tsa ci',
        'coverage-show': 'open-cli build/coverage/index.html',
        precommit: 'tsa pre-commit',
        prepush: 'npm run dist && tsa pre-push',
        postcheckout: 'tsa post-checkout || exit 0',
        postmerge: 'tsa post-merge || exit 0'
      });

      addPackageJsonSectionFromTemplate('nyc', templateData);

      if (!fs.existsSync('src')) {
        fs.mkdirSync('src');
        writeFromTemplateIfNotExists('src/example.ts', templateData);
      }

      if (!fs.existsSync('test')) {
        fs.mkdirSync('test');
        writeFromTemplateIfNotExists('test/example-tests.ts', templateData);
      }

      writeFromTemplateIfNotExists('tsconfig.json', templateData);

      writeFromTemplateIfNotExists('src/tsconfig.json', templateData);

      writeFromTemplateIfNotExists('tsfmt.json', templateData);

      writeFromTemplateIfNotExists('tslint.json', templateData);

      writeFromTemplateIfNotExists('tslint.editor.json', templateData);

      return Promise.resolve(true);
    }
  };
}
