import { Formatter } from '../code-style/formatter';

export interface FormatCommandDependencies {
  formatter: Formatter;
}

export let createFormatCommand = (deps: FormatCommandDependencies) => {
  return {
    execute: deps.formatter.format
  };
};
