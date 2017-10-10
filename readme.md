# Work in progress!

At *AFAS Software* we do our frontend coding in Typescript. We want our code to be of high quality, so we normalize/format our code, do
static linting, unit testing and code coverage. We also want code to be normalized/formatted and linted on each commit and we want
all tests to pass and code coverage thresholds met on every push.

Installing and configuring the tools for this on every project and keeping them up-to-date is cumbersome, so we created typescript-assistant.

Typescript assistant serves 3 purposes:

### A: A suite of tools for creating quality Typescript code

At *AFAS Software* we are use Typescript along with tslint and tsfmt for code style and mocha and nyc for unit-testing and code-coverage.
Typescript assistant has up-to-date dependencies on these tools, so all you need is one devDependency on typescript-assistant and these
tools are at your disposal.

### B: Verifying that code that is committed and pushed conforms to quality norms

TODO: explain git hooks

### C: A tool that reports violations on every file-save

When running `tsa` in a terminal, typescript-assistant will monitor changes to `.ts` files and compile these automatically.
It will also report formatting and linting violations and it will run tests and reports the failing ones.
If it finds problems with any of these things, it outputs the line with the problem in a way that IDE's can create clickable links.

## NOTE:

When typescript-assistant cannot find some of its dependencies, it may be required to run `npm dedupe` which makes sure all required dependencies will be located directly under `node_modules` of your project
