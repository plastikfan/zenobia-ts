
import { functify } from 'jinxed';
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import { DOMParserImpl as dom } from 'xmldom-ts';
import * as R from 'ramda';
import * as path from 'path';
import * as yargs from 'yargs';
import * as jaxom from 'jaxom-ts';
import * as memfs from 'memfs';
import { patchFs } from 'fs-monkey';
import * as fs from 'fs';
import * as helpers from '../../lib/utils/helpers';
import * as testHelpers from '../test-helpers';
import * as types from '../../lib/types';
import * as ct from '../../lib/cli/cli-types';
import { CommandLine } from '../../lib/cli/command-line.class';
import * as application from '../../lib/cli/application';
const vol = memfs.vol;
const parser = new dom();

describe('Application', () => {
  const spec: jaxom.ISpec = jaxom.Specs.default;
  let instance: yargs.Argv;
  let parseInfoFactory: jaxom.ParseInfoFactory;
  let converter: jaxom.IConverter;
  let specSvc: jaxom.ISpecService;
  let xpath: types.ISelectors;
  let builderFactory: types.ICommandBuilderFactory;
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

  function init (files: string[]): void {
    mfs = testHelpers.setupFS(files);
  }

  context('given: ', () => {
    it('should: ', () => {
      init(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      // go into inputs:
      //
      const xmlContent: string = mfs.readFileSync('./cli/commands.content.xml').toString();
      const parseInfoContent: string = mfs.readFileSync('./cli/test.parseInfo.all.json').toString();

      let inputs: ct.ICommandLineInputs = {
        applicationCommand: 'jax',
        resource: 'com',
        xmlContent: xmlContent,
        query: '/Application/Cli/Commands',
        parseInfoContent: parseInfoContent,
        out: ct.ConsoleTag,
        argv: {
          _: '["jax"]',
          '$0': 'zenobia-cli'
        }
      };

      const executionContext: ct.IExecutionContext = {
        inputs: inputs,
        parseInfoFactory: parseInfoFactory,
        converter: converter,
        specSvc: specSvc,
        xpath: helpers.Selectors,
        builderFactory: builderFactory, // TODO: CHECK THIS!!!
        parser: parser,
        applicationConsole: applicationConsole,
        vfs: fs
      };

      application.run(executionContext);
      console.log(`>>> inputs: ${JSON.stringify(inputs, null, 2)}`);
    });
  });

  it('=== Option ===', () => {
    //
  });
});
