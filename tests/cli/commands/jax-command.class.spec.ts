
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

  context('persist to file', () => {
    context('given: writing to file', () => {
      it('should: persist output to file', () => {
        init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

        const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
        const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

        const inputs: ct.ICommandLineInputs = {
          applicationCommand: 'jax',
          resource: 'com',
          xmlContent: xmlContent,
          query: commandsQuery,
          parseInfoContent: parseInfoContent,
          output: './output.commands.json',
          argv: {
            _: ['jax'],
            '$0': 'zenobia-cli',
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
          xpath: xpath,
          builderFactory: builderFactory,
          parser: parser,
          applicationConsole: applicationConsole,
          vfs: mfs
        };

        const command = new JaxCommand(executionContext);
        const execResult = command.exec();
        expect(execResult.resultCode).to.equal(0);

        const exists = mfs.existsSync('./output.commands.json');
        expect(exists).to.be.true();
      });
    }); // given: writing to file

    context('given: an error occurs during write', () => {
      it('should: return failure result', () => {
        const writeErrorFS = {
          writeFileSync: (path: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): void => {
            throw new Error(`Something went wrong writing file to ${path}`);
          }
        };
        init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json'], writeErrorFS);

        const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
        const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

        const inputs: ct.ICommandLineInputs = {
          applicationCommand: 'jax',
          resource: 'com',
          xmlContent: xmlContent,
          query: commandsQuery,
          parseInfoContent: parseInfoContent,
          output: './output.commands.json',
          argv: {
            _: ['jax'],
            '$0': 'zenobia-cli',
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
          xpath: xpath,
          builderFactory: builderFactory,
          parser: parser,
          applicationConsole: applicationConsole,
          vfs: mfs
        };

        const command = new JaxCommand(executionContext);
        const execResult = command.exec();
        expect(execResult.resultCode).to.equal(1);
      });
    });
  }); // persist to file

  context('display to console', () => {
    context('given: displaying to console', () => {
      it('should: persist output to file', () => {
        init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

        const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
        const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

        const inputs: ct.ICommandLineInputs = {
          applicationCommand: 'jax',
          resource: 'com',
          xmlContent: xmlContent,
          query: commandsQuery,
          parseInfoContent: parseInfoContent,
          output: ct.ConsoleTag,
          argv: {
            _: ['jax'],
            '$0': 'zenobia-cli',
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
          xpath: xpath,
          builderFactory: builderFactory,
          parser: parser,
          applicationConsole: new testHelpers.FakeConsole(),
          vfs: mfs
        };

        const command = new JaxCommand(executionContext);
        const execResult = command.exec();
        expect(execResult.resultCode).to.equal(0);
      });
    }); // given: writing to file
  }); // display to console

  context('given: query = "opt"', () => {
    it('should: only build the options', () => {
      init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
      const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

      const inputs: ct.ICommandLineInputs = {
        applicationCommand: 'jax',
        resource: 'opt',
        xmlContent: xmlContent,
        query: commandsQuery,
        parseInfoContent: parseInfoContent,
        output: ct.ConsoleTag,
        argv: {
          _: ['jax'],
          '$0': 'zenobia-cli',
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
        xpath: xpath,
        builderFactory: builderFactory,
        parser: parser,
        applicationConsole: new testHelpers.FakeConsole(),
        vfs: mfs
      };

      const command = new JaxCommand(executionContext);
      const execResult = command.exec();
      expect(R.view(R.lensProp('_'), execResult.payload)).to.equal('Options');
    });
  });
}); // jax-command
