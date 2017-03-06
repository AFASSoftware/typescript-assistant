import { Dependencies } from '../dependencies';

export let format = (toolbox: Dependencies) => {
  return toolbox.formatter.format();
};
