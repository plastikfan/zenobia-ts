import { expect, use } from 'chai';
import { DOMParserImpl as Parser } from 'xmldom-ts';
import * as jaxom from 'jaxom-ts';
import * as memfs from 'memfs';
import * as helpers from '../../lib/utils/helpers';
import * as testHelpers from '../test-helpers';
import * as ct from '../../lib/cli/cli-types';
import * as application from '../../lib/cli/application';
import * as factory from '../../lib/zen-cli/builders/command-builder-factory';
import dirtyChai = require('dirty-chai'); use(dirtyChai);

describe('Application', () => {
  const commandsQuery = '/Application/Cli/Commands';
  const spec: jaxom.ISpec = jaxom.Specs.default;
  let parseInfoFactory: jaxom.ParseInfoFactory;
  let converter: jaxom.IConverter;
  let specSvc: jaxom.ISpecService;
  let parser: DOMParser;
  let applicationConsole: ct.IApplicationConsole;
  let mfs: memfs.IFs;

  beforeEach(() => {
    parseInfoFactory = new jaxom.ParseInfoFactory();
    converter = new jaxom.XpathConverter();
    specSvc = new jaxom.SpecOptionService(spec);
    parser = new Parser();
    applicationConsole = new testHelpers.FakeConsole();
  });

  function init (files: string[]): void {
    mfs = testHelpers.setupFS(files);
  }

  context('given: jax command invoked', () => {
    it('should: execute the command', () => {
      init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
      const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

      const inputs: ct.ICommandLineInputs = {
        applicationCommand: 'jax',
        xmlContent: xmlContent,
        query: commandsQuery,
        parseInfoContent: parseInfoContent,
        output: ct.ConsoleTag,
        argv: {
          _: ['jax'],
          $0: 'zenobia-cli',
          parseInfo: './cli/test.parseInfo.all.json',
          query: commandsQuery,
          xml: './cli/commands.content.xml'
        }
      };

      const executionContext: ct.IExecutionContext = {
        inputs: inputs,
        parseInfoFactory: parseInfoFactory,
        converter: converter,
        specSvc: specSvc,
        xpath: helpers.Selectors,
        builderFactory: factory.construct,
        parser: parser,
        applicationConsole: applicationConsole,
        vfs: mfs
      };

      const result = application.run(executionContext);
      expect(result).to.equal(0);
    });
  });
});
