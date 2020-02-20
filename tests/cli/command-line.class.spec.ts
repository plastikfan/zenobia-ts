
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

import * as testHelpers from '../test-helpers';
import * as types from '../../lib/types';
import * as ct from '../../lib/cli/cli-types';
import { CommandLine } from '../../lib/cli/command-line.class';
const vol = memfs.vol;
const parser = new dom();

const patchedFS = {
  writeFileSync: (path: fs.PathLike | number, data: any, options?: fs.WriteFileOptions): void => {
    throw new Error(`Something went wrong writing file to ${path}`);
  }
};

describe('command-line', () => {
  let instance: yargs.Argv;
  let mfs: memfs.IFs;

  beforeEach(() => {
    instance = require('yargs');
  });

  context('given: ', () => {
    it.skip('should: help should show user defined options', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const commandLine = new CommandLine();
      let inputs: ct.ICommandLineInputs = commandLine.build(instance, mfs,
        (yin: yargs.Argv): { [key: string]: any } => { // parseCallback

          return yin.parse(['zen', '--help']);
        });

      console.log(`>>> inputs: ${JSON.stringify(inputs, null, 2)}`);
      // yin.parse(['jax', '--xml']);
    });
  });

  context('given: ', () => {
    it('should: invoke with --xml option', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const commandLine = new CommandLine();
      let inputs: ct.ICommandLineInputs = commandLine.build(instance, mfs,
        (yin: yargs.Argv): { [key: string]: any } => { // parseCallback

          return yin.parse(['zen', 'jax', '--xml', './cli/commands.content.xml']);
        });

      console.log(`>>> inputs: ${JSON.stringify(inputs, null, 2)}`);
      // yin.parse(['jax', '--xml']);
    });
  });
});
