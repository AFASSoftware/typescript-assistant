Work in progress

The idea behind typescript-assistant is as follows:

A typescript project typically uses different tools, like:

- The Typescript compiler
- Mocha to run unit tests
- tsfmt to format files
- tslint to check for problems

When developing a project using Typescript, it would be nice if the right things would happen automatically at the right time.

Right now typescript-assistant has the following 2 modes:

## Assist

When running `tsa` in a terminal, typescript-assistant will monitor changes to `.ts` files and compile these automatically.
It will also report formatting and linting violations and it will run tests and reports the failing ones.
If it finds problems with any of these things, it outputs the line with the problem in a way that IDE's can create clickable links.

## Commit

When running `tsa commit` in a terminal, the changed files (detected from git) will be formatted, the compiler will compile them
and the linter will find problems. As long as there are still compile or linting problems, typescript-assistant will keep watching
the `.ts` files until they are resolved. All changes are then added to a commit and a commit-message dialog will appear.

This utility is still under development. Future plans:

- Measuring coverage
- Running webpack-dev-server if a webpack config file is found
- adding a 'Push' mode which does more checks, like making sure all tests pass
- hosting a webserver which shows a graphical representation of problems, incoming commits, a 'format' button, etc...
