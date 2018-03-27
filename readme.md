## Introduction

While you write TypeScript code, you want it to compile, tests to succeed, 
code coverage to be upheld and the code should conform to formatting and linting rules. 
There are already great tools that help you do this. But running them manually can be time-consuming.

In order to be more productive, we ended up creating TypeScript Assistant, that takes care of running the right tools at the right time.

- Before commit: Check formatting and linting
- Before push: Compile, run unit test and check coverage
- After pull: Update packages

It also adds npm scripts to:

- Fix formatting and linting (`npm run fix`)
- Release to npm (`npm run release`)
- Run all tools on save in the background (`npm run assist`)
- Open code coverage (`npm run coverage-show`)
- Run continuous integration (`npm run ci`)
- Clean (`npm run clean`)

## Getting started

You can try TypeScript Assistant on a new project by running
```
git init && npm init && npm install typescript-assistant && ./node_modules/.bin/tsa init
```

On existing TypeScript projects, you can just run
```
npm install typescript-assistant && npm dedupe && ./node_modules/.bin/tsa init
```

TypeScript Assistant will not overwrite any configuration you already have. 

## Configuration 

Not everything is configurable in TypeScript Assistant.

- `/dist` contains artifacts that get distributed in a release. It is excluded from source control.
- `/build` contains build output and temporary artifacts. It is excluded from source control.
- `/test` contains (unit)tests written in mocha

TypeScript Assistant enforces \n as end-of-line on every platform. 
It does not have a configuration file of is own, it lets the underlying tools use their own configuration files.
`tsa init` prepares these files as follows:

- `.editorconfig` - End-of-line and tab size set to 2 spaces
- `.gitattributes` - End-of-line
- `.gitignore` - Exclude non-source files
- `.npmignore` - Configure what gets packaged, only `/dist` and `README.md` 
- `package.json` - Adds scripts for git hooks and tasks provided by TypeScript Assistant. Also contains configuration for `nyc` (code coverage)
- `src/tsconfig.json` - Strict TypeScript configuration for sources. Output is written to `/dist`
- `tsconfig.json` -  Lenient TypeScript configuration for unit tests, does not write output. (tests run fine using `ts-node`)
- `tsfmt.json` - End-of-line and tab size
- `tslint.json` - Contains the linting rules you prefer. By default it is set to inherit from the AFAS Software rules shipped by TypeScript Assistant. It can
 be modified to suit your needs
- `tslint.editor.json` - Extends `tslint.json` and disables some rules to make your IDE (vscode/webstorm) easier to work with.

The folder `/src` is assumed to contain source files, but this can be modified by changing the `tsconfig.json` files and the `nyc` section in `package.json`.
All configuration files should be able to be changed as needed.

If you are creating a browser package, you can get inspiration from maquette on how you can put browser bundles in the `dist` folder using TypeScript Assistant.
See the `dist` task in the [package.json](https://github.com/AFASSoftware/maquette/blob/master/package.json).

## NOTE:

When typescript-assistant cannot find some of its dependencies, 
it may be required to run `npm dedupe` which makes sure all required 
dependencies will be located directly under `node_modules` of your project
