
import * as yargs from 'yargs';
import { JaxCommand } from './commands/jax-command.class';

export class CommandLine {

  public build (instance: yargs.Argv): any {

    instance = instance.scriptName('zenobia-cli')
      .command('jax', 'invoke jaxom converter to build zenobia components on the fly',
        (yin: yargs.Argv): yargs.Argv => {

          return yin;
        },
        (argv: { [key: string]: any}) => {
          // ENTRY-POINT
        });

    // do parse
    //
    const parseResult = instance.argv;

    return undefined;
  }
}
