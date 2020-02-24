
import { DOMParserImpl as dom } from 'xmldom-ts';
import * as jaxom from 'jaxom-ts';
import * as types from '../types';
import { IExecutionContext, ICommandLineInputs } from './cli-types';
import { IApplicationConsole } from '../cli/cli-types';
import * as commandLine from './command-line.class';
import * as application from './application';
import * as factory from '../zen-cli/builders/command-builder-factory';
import { Selectors } from '../utils/helpers';
import yargs = require('yargs');

module.exports = (applicationConsole: IApplicationConsole, vfs: types.VirtualFS,
  yin: yargs.Argv = require('yargs')): number => {
  // setup
  //
  const parseInfoFactory: jaxom.IParseInfoFactory = new jaxom.ParseInfoFactory();
  const spec: jaxom.ISpec = jaxom.Specs.default;
  const converter: jaxom.IConverter = new jaxom.XpathConverter(spec);
  const specSvc: jaxom.ISpecService = new jaxom.SpecOptionService(spec);
  const parser: DOMParser = new dom();

  // acquire inputs
  //
  const inputs: ICommandLineInputs = commandLine.build(yin, vfs);

  // inject dependencies
  //
  const executionContext: IExecutionContext = {
    inputs: inputs,
    parseInfoFactory: parseInfoFactory,
    converter: converter,
    specSvc: specSvc,
    xpath: Selectors,
    builderFactory: factory.construct,
    parser: parser,
    applicationConsole: applicationConsole,
    vfs: vfs
  };

  const executionResult = application.run(executionContext);
  process.exitCode = executionResult;
  return executionResult;
};
