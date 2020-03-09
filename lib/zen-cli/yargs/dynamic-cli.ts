
// import * as path from 'path';
import * as yargs from 'yargs';
import * as jaxom from 'jaxom-ts';
import { ICommandBuilder, ICommandBuilderFactory, VirtualFS } from '../../types';
import * as types from '../../types';
import { Selectors as xpath } from '../../utils/helpers';
// import { command } from '../../cli/commands/jax-command.class';
export interface IYargsArgumentsCli {
  [x: string]: unknown;
  _: string[] | string;
  $0: string;
}

const cliParseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    [
      'Commands',
      {
        descendants: {
          by: 'index',
          id: 'name',
          throwIfCollision: true,
          throwIfMissing: true
        }
      }
    ],
    [
      'Command',
      {
        id: 'name',
        recurse: 'inherits',
        discards: ['inherits', 'abstract']
      }
    ],
    [
      'Options',
      {
        descendants: {
          by: 'index',
          id: 'name',
          throwIfCollision: true,
          throwIfMissing: true
        }
      }
    ],
    [
      'OptionRef',
      {
        id: 'name'
      }
    ]
  ])
};

export class DynamicYargsCli<C extends IYargsArgumentsCli> implements types.IDynamicCli<C, yargs.Argv> {
  constructor (readonly instance: yargs.Argv,
    private factory: ICommandBuilderFactory,
    private converter: jaxom.IConverter,
    private specSvc: jaxom.ISpecService,
    private parser: DOMParser,
    private vfs: VirtualFS,
    private parseInfo: jaxom.IParseInfo = cliParseInfo) {

  }

  public load (applicationConfig: string): string {
    return this.vfs.readFileSync(applicationConfig).toString();
  }

  public peek (processArgv: string[] = process.argv): string {
    return processArgv.slice(2)[0];
  }

  public build (xmlContent: string, converter: jaxom.IConverter, processArgv: string[] = process.argv)
    : yargs.Argv {
    const commandName = processArgv.slice(2)[0];
    console.log(`Building zenobia command: ${commandName} for yargs.`);

    // const document: Document = this.parser.parseFromString(xmlContent, 'text/xml');
    // const builder = this.factory(this.converter, this.specSvc, this.parseInfo, xpath);

    // const selectResult = xpath.select('/Application/Cli/Commands', document, true);
    // const com = (selectResult instanceof Node)
    //   ? builder.buildNamedCommand(commandName, selectResult)[0]
    //   : builder.buildNamedCommand(commandName, selectResult[0])[0];

    // this.instance.command(commandName, com);
    // builder.buildNamedCommand(commandName);
    // do stuff with instance
    //
    return this.instance;
  }

  public create ()
    : ICommandBuilder {
    const builder = this.factory(this.converter, this.specSvc, this.parseInfo, xpath);

    return builder;
  }

  public argv (): C {
    return this.instance.argv as unknown as C;
  }
}

// When the command line is: "zen jax -x ./tests/cli/commands.content.xml -p tests/cli/test.parseInfo.all.json"
// argv:  [ /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/node,
//          /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/zen,
//          jax,
//          -x,
//          ./tests/cli/commands.content.xml,
//          -p,
//          tests/cli/test.parseInfo.all.json]
//
// index 0: /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/node
// index 1: /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/zen
// index 2: jax
// index 3: -x
// index 4: ./tests/cli/commands.content.xml
// index 5: -p
// index 6: tests/cli/test.parseInfo.all.json
//
// yargs.Argv is internally set to process.argv.slice(2), and therefore, we can see that the first
// argument is the name of the sub-command; argv._[0] is the subcommand
// so to peek into it to get the command name, just use process.argv.slice(2)[0]
//
