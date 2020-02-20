
import * as yargs from 'yargs';
import * as jax from './commands/jax-command.class';
import * as ct from './cli-types';
import * as types from '../types';
import * as helpers from '../utils/helpers';

export class CommandLine { // TODO: change to just be a function so we don't have to new it for no reason

  public build (instance: yargs.Argv,
    vfs: types.VirtualFS,
    parseCallback?: (yin: yargs.Argv) => { [key: string]: any })
    : ct.ICommandLineInputs {
    instance = instance.scriptName('zenobia-cli')
      .command('jax', 'invoke jaxom converter to build zenobia components on the fly',
        (yin: yargs.Argv): yargs.Argv => { // builder
          return yin
          .options(jax.Options)
          .usage('$0: -x/--xml')
          .help('--xml')
          .demandOption(['xml'], 'Missing parameters, try again!');
        },
        (argv: { [key: string]: any}) => { // handler
          // ENTRY-POINT
          console.log('>>> Handler entry point for jax command ...');
        });

    const parseResult: any = parseCallback ? parseCallback(instance) : instance.argv;

    console.log('=============================================================================================');

    const xmlContent = helpers.containsText(parseResult.xml)
      ? vfs.readFileSync(parseResult.xml as string).toString()
      : '';

    const parseInfoContent = helpers.containsText(parseResult.parseinfo)
      ? vfs.readFileSync(parseResult.parseinfo as string).toString()
      : '';

    const inputs: ct.ICommandLineInputs = {
      applicationCommand: parseResult['_'][1] as ct.ApplicationCommand,
      xmlContent: xmlContent,
      query: parseResult.query as string,
      parseInfoContent: parseInfoContent,
      out: parseResult.output as string,
      argv: parseResult
    };

    return inputs;
  }
}
