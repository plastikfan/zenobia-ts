import * as R from 'ramda';
import * as xpath from 'xpath-ts';
import * as jaxom from 'jaxom-ts';
import * as ct from '../cli-types';
import { CliCommand, assign } from './cli-command.class';
import * as types from '../../types';

export const Options = {
  'x': {
    alias: 'xml',
    describe: 'path to xml file',
    string: true,
    demandOption: true,
    normalize: true
  },
  'r': {
    alias: 'res',
    describe: 'type of resource being built (command|option)',
    string: true,
    choices: ['com', 'opt']
  },
  'q': {
    alias: 'query',
    describe: 'xpath query',
    string: true
  },
  'p': {
    alias: 'parseinfo',
    describe: 'path to json file containing parse info to apply to xml document',
    string: true,
    normalize: true
  },
  'o': {
    alias: 'output',
    describe: 'output file name, if not specified, display result to console',
    string: true,
    normalize: true,
    default: ct.ConsoleTag
  }
};

export class JaxCommand extends CliCommand {
  constructor (executionContext: ct.IExecutionContext) {
    super(executionContext);

    this.parseInfoContent = assign(executionContext.inputs.parseInfoContent, 'parseInfoContent');
    this.xmlContent = assign(executionContext.inputs.xmlContent, 'xmlContent');
    this.query = assign(executionContext.inputs.query, 'query');
    this.resource = assign(executionContext.inputs.resource, 'resource');
  }

  private readonly parseInfoContent: string;
  private readonly xmlContent: string;
  private readonly query: string;
  private readonly resource: string;

  public exec ()
  : number {
    console.log('====== [ JAX COMMAND ] ======');
    let result = 0;
    try {
      const factory = this.executionContext.parseInfoFactory;
      const document: Document = this.executionContext.parser.parseFromString(
        this.xmlContent, 'text/xml');

      const parseInfo: jaxom.IParseInfo = this.acquireParseInfo(
        this.parseInfoContent, factory);

      let builder: types.ICommandBuilder = this.executionContext.builderFactory(
        this.executionContext.converter,
        this.executionContext.specSvc,
        parseInfo,
        this.executionContext.xpath);

      const options = this.buildOptions(document, parseInfo);
      const commands = this.buildCommands(document, builder, options);

      result = (this.out === ct.ConsoleTag) ? this.display(commands) : this.persist(commands);
    } catch (error) {
      result = 1;
    }

    return result;
  }

  private buildOptions (document: Document, parseInfo: jaxom.IParseInfo)
  : { [key: string]: any } {

    // Options are always parallel to Commands
    //
    let optionsQuery = this.query;

    if (this.resource === 'com') {
      optionsQuery = (R.endsWith('Commands')(this.query))
        ? this.query.replace('Commands', 'Options')
        : this.query.substr(0, this.query.indexOf('Commands')) + 'Options';
    }

    // TODO: select the options node, and pass this into converter.build instead
    // of the document.
    //

    return this.executionContext.converter.build(document, parseInfo);
  }

  private buildCommands (document: Document, builder: types.ICommandBuilder,
    optionDefs: { [key: string]: any })
    : types.StringIndexableObj {

    let normalisedCommands = {};

    if (this.resource === 'com') {
      const selectResult = xpath.select(this.query, document, true);

      if (selectResult instanceof Node) {
        let commands = builder.buildCommands(selectResult);

        normalisedCommands = builder.resolveCommandOptions(commands, {
          commandOptions: optionDefs
        });
      }
    }

    return normalisedCommands;
  }

  private persist (conversion: types.StringIndexableObj): number {
    this.executionContext.vfs.writeFileSync(this.executionContext.inputs.out,
      JSON.stringify(conversion, null, 2), 'utf8');

    return 0;
  }

  private display (conversion: types.StringIndexableObj): number {
    this.executionContext.applicationConsole.log(JSON.stringify(conversion, null, 2));

    return 0;
  }
}
