import * as R from 'ramda';
import * as xpath from 'xpath-ts';
import * as jaxom from 'jaxom-ts';
import * as ct from '../cli-types';
import { CliCommand, assign } from './cli-command.class';
import * as types from '../../types';

export const command = 'jax';
export const describe = 'invoke jaxom converter to build zenobia components on the fly';

export const builder = {
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
    default: 'com',
    choices: ['com', 'opt']
  },
  'q': {
    alias: 'query',
    describe: 'xpath query',
    default: '/Application/Cli/Commands',
    string: true
  },
  'p': {
    alias: 'parseInfo',
    describe: 'path to json file containing parse info to apply to xml document',
    string: true,
    normalize: true,
    demandOption: true
  },
  'o': {
    alias: 'output',
    describe: 'output file name, if not specified, display result to console',
    string: true,
    default: ct.ConsoleTag
  }
};

export const handler = (argv: ct.IZenobiaCli) => {
  console.log('jax command ...');
};

/**
 * @description The "jax" command invoked as zen jax ...
 *
 * @export
 * @class JaxCommand
 * @extends {CliCommand}
 */
export class JaxCommand extends CliCommand {
  constructor (executionContext: ct.IExecutionContext) {
    super(executionContext);

    this.query = assign(executionContext.inputs.query, 'query');
    this.resource = assign(executionContext.inputs.resource, 'resource');
  }

  private readonly query: string;
  private readonly resource: string;

  public exec (): ct.ICommandExecutionResult {
    let execResult: ct.ICommandExecutionResult = {
      resultCode: 0,
      payload: { }
    };

    try {
      const parseInfoFactory = this.executionContext.parseInfoFactory;
      const document: Document = this.executionContext.parser.parseFromString(
        this.xmlContent, 'text/xml');

      const parseInfo: jaxom.IParseInfo = this.acquireParseInfo(
        this.parseInfoContent, parseInfoFactory);

      const builder: types.ICommandBuilder = this.executionContext.builderFactory(
        this.executionContext.converter,
        this.executionContext.specSvc,
        parseInfo,
        this.executionContext.xpath);

      const options = this.buildOptions(document, parseInfo);
      const buildResult = this.resource === 'com'
        ? this.buildCommands(document, builder, options)
        : options;

      execResult = {
        resultCode: (this.output === ct.ConsoleTag)
          ? this.display(buildResult) : this.persist(buildResult),
        payload: buildResult
      };

    } catch (error) {
      execResult.resultCode = 1;
      execResult.error = error.message;
    }

    return execResult;
  }

  /**
   * @description builds all options
   *
   * @private
   * @param {Document} document
   * @param {jaxom.IParseInfo} parseInfo
   * @returns {{ [key: string]: any }}
   * @memberof JaxCommand
   */
  private buildOptions (document: Document, parseInfo: jaxom.IParseInfo)
  : { [key: string]: any } {

    // Options are always parallel to Commands
    //
    const optionsQuery = (R.endsWith('Commands')(this.query))
      ? this.query.replace('Commands', 'Options')
      : this.query; // this.query.substr(0, this.query.indexOf('Commands')) + 'Options';

    const optionsNode = this.xpath.select(optionsQuery, document, true);

    /* istanbul ignore next */
    if (!(optionsNode instanceof Node)) {
      throw new Error(`Bad options query: "${optionsQuery}", does not yield a Node instance`);
    }

    return this.executionContext.converter.build(optionsNode, parseInfo);
  }

  /**
   * @description build all commands
   *
   * @private
   * @param {Document} document
   * @param {types.ICommandBuilder} builder
   * @param {{ [key: string]: any }} optionDefs
   * @returns {types.StringIndexableObj}
   * @memberof JaxCommand
   */
  private buildCommands (document: Document, builder: types.ICommandBuilder,
    optionDefs: { [key: string]: any })
    : types.StringIndexableObj {

    let normalisedCommands = {};

    const selectResult = xpath.select(this.query, document, true);

    /* istanbul ignore else */
    if (selectResult instanceof Node) {
      let commands = builder.buildCommands(selectResult);

      normalisedCommands = builder.resolveCommandOptions(commands, {
        commandOptions: optionDefs
      });
    }

    return normalisedCommands;
  }

  /**
   * @description Write the build payload to a file
   *
   * @private
   * @param {types.StringIndexableObj} conversion
   * @returns {number}
   * @memberof JaxCommand
   */
  private persist (conversion: types.StringIndexableObj): number {
    this.executionContext.vfs.writeFileSync(this.executionContext.inputs.output,
      JSON.stringify(conversion, null, 2), 'utf8');

    return 0;
  }

  /**
   * @description Displays build payload on console
   *
   * @private
   * @param {types.StringIndexableObj} conversion
   * @returns {number}
   * @memberof JaxCommand
   */
  private display (conversion: types.StringIndexableObj): number {
    this.executionContext.applicationConsole.log(JSON.stringify(conversion, null, 2));

    return 0;
  }
} // JaxCommand
