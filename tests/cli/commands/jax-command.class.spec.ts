
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import * as jaxom from 'jaxom-ts';
import * as memfs from 'memfs';
import * as R from 'ramda';
import * as fs from 'fs';
import * as types from '../../../lib/types';
import * as helpers from '../../../lib/utils/helpers';
import * as ct from '../../../lib/cli/cli-types';
import * as testHelpers from '../../test-helpers';
import { JaxCommand } from './../../../lib/cli/commands/jax-command.class';
import * as factory from '../../../lib/zen-cli/builders/command-builder-factory';
const vol = memfs.vol;

const writeErrorFS = {
  writeFileSync: (path: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): void => {
    throw new Error(`Something went wrong writing file to ${path}`);
  }
};

describe('jax-command', () => {
  const commandsQuery = '/Application/Cli/Commands';
  const spec: jaxom.ISpec = jaxom.Specs.default;
  const xpath: types.ISelectors = helpers.Selectors;
  const builderFactory: types.ICommandBuilderFactory = factory.construct;
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
    parser = new DOMParser();
    applicationConsole = new testHelpers.FakeConsole();
  });

  afterEach(() => {
    vol.reset();
  });

  function init (files: string[], patch?: {}): void {
    mfs = testHelpers.setupFS(files, patch);
  }

  // given, should, query, resource, asserter
  interface IUnitTest {
    given: string;
    should: string;
    query: string;
    resource: ct.ResourceType;
    output: string;
    patch?: {};
    asserter: (result: ct.ICommandExecutionResult) => void;
  }

  const tests: IUnitTest[] = [
    {
      given: 'writing to file',
      should: 'persist output to file',
      query: commandsQuery,
      resource: 'com',
      output: './output.commands.json',
      asserter: (result: ct.ICommandExecutionResult): void => {
        expect(result.resultCode).to.equal(0);
        const exists = mfs.existsSync('./output.commands.json');
        expect(exists).to.be.true();
      }
    },
    {
      given: 'an error occurs during write',
      should: 'return failure result',
      query: commandsQuery,
      resource: 'com',
      output: './output.commands.json',
      patch: writeErrorFS,
      asserter: (result: ct.ICommandExecutionResult): void => {
        expect(result.resultCode).to.equal(1);
      }
    },
    {
      given: 'displaying to console',
      should: 'display to console',
      query: commandsQuery,
      resource: 'com',
      output: ct.ConsoleTag,
      asserter: (result: ct.ICommandExecutionResult): void => {
        expect(result.resultCode).to.equal(0);
      }
    },
    {
      given: 'resource = "opt"',
      should: 'only build the options',
      query: commandsQuery,
      resource: 'opt',
      output: ct.ConsoleTag,
      asserter: (result: ct.ICommandExecutionResult): void => {
        expect(R.view(R.lensProp('_'), result.payload)).to.equal('Options');
      }
    },
    {
      given: 'resource = "opt" and query selects Options',
      should: 'only build the options',
      query: '/Application/Cli/Options',
      resource: 'opt',
      output: ct.ConsoleTag,
      asserter: (result: ct.ICommandExecutionResult): void => {
        expect(R.view(R.lensProp('_'), result.payload)).to.equal('Options');
      }
    }
  ];

  tests.forEach(t => {
    context(`given: ${t.given}`, () => {
      it(`should: ${t.should}`, () => {
        init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json'], t.patch);

        const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
        const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

        const inputs: ct.ICommandLineInputs = {
          applicationCommand: 'jax',
          parseInfoContent: parseInfoContent,
          query: t.query,
          resource: t.resource,
          xmlContent: xmlContent,
          output: t.output,
          argv: {
            _: ['jax'],
            '$0': 'zenobia-cli',
            parseInfo: './cli/test.parseInfo.all.json',
            query: t.query,
            resource: t.resource,
            xml: './cli/commands.content.xml'
          }
        };

        const executionContext: ct.IExecutionContext = {
          inputs: inputs,
          parseInfoFactory: parseInfoFactory,
          converter: converter,
          specSvc: specSvc,
          xpath: xpath,
          builderFactory: builderFactory,
          parser: parser,
          applicationConsole: new testHelpers.FakeConsole(),
          vfs: mfs
        };

        const command = new JaxCommand(executionContext);
        const execResult = command.exec();
        t.asserter(execResult);
      });
    });
  });
}); // jax-command
