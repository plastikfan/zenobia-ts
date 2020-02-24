
import * as yargs from 'yargs';
import * as jax from './commands/jax-command.class';
import * as path from 'path';
import * as ct from './cli-types';
import * as types from '../types';
import * as helpers from '../utils/helpers';

// --help on subcommand not showing options
// https://github.com/yargs/yargs/issues/1131
//

// https://github.com/yargs/yargs/blob/master/docs/typescript.md
//

export class CommandLine { // TODO: change to just be a function so we don't have to new it for no reason

  public build (instance: yargs.Argv,
    vfs: types.VirtualFS)
    : ct.ICommandLineInputs {

    instance = instance.scriptName('zenobia-cli')
      .help()
      .command('jax', 'invoke jaxom converter to build zenobia components on the fly',
        (yin: yargs.Argv): yargs.Argv => { // builder
          return yin
          .options(jax.Options)
          // .usage('$0: -x/--xml')
          .help('--xml')
          .demandOption(['xml', '--parseinfo'], 'Missing parameters, try again!');
        },
        (argv: { [key: string]: any}) => { // handler
          // ENTRY-POINT
          console.log('>>> Handler entry point for jax command ...');
        });

    const parseResult: ct.IZenobiaCli = instance.argv;

    console.log('=============================================================================================');

    const xmlOption: string = parseResult.xml ?? '';
    const xmlContent = helpers.containsText(xmlOption)
      ? vfs.readFileSync(xmlOption).toString()
      : '';

    const parseInfoOption = parseResult.parseinfo ?? '';
    const parseInfoContent = helpers.containsText(parseInfoOption)
      ? vfs.readFileSync(parseInfoOption).toString()
      : '';

    const inputs: ct.ICommandLineInputs = {
      applicationCommand: parseResult['_'][1] as ct.ApplicationCommand,
      xmlContent: xmlContent,
      resource: parseResult.res as ct.ResourceType,
      query: parseResult.query as string,
      parseInfoContent: parseInfoContent,
      output: parseResult.output as string,
      argv: parseResult
    };

    return inputs;
  }
}
