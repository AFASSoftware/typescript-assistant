import { Toolbox } from '../toolbox';

export let format = (toolbox: Toolbox) => {
  return toolbox.formatter.format();
};
