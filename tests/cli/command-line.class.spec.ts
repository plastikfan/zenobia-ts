
import { functify } from 'jinxed';
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import * as yargs from 'yargs';
import * as memfs from 'memfs';

import * as testHelpers from '../test-helpers';
import * as helpers from '../../lib/utils/helpers';
import * as ct from '../../lib/cli/cli-types';
import { CommandLine } from '../../lib/cli/command-line.class';

describe('command-line', () => {
  let mfs: memfs.IFs;

  context('given: ', () => {
    it.skip('should: help should show user defined options', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const commandLine = new CommandLine();
      let inputs: ct.ICommandLineInputs = commandLine.build(
        require('yargs')(['zen', '--help']), mfs);
    });
  });

  context('given: jax command invoked', () => {
    it('should: capture user defined options presented on command line', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const commandLine = new CommandLine();
      let inputs: ct.ICommandLineInputs = commandLine.build(
        require('yargs')(['zen', 'jax',
          '--res', 'com',
          '--xml', './cli/commands.content.xml',
          '--parseinfo', './cli/test.parseInfo.all.json',
          '--query', '/Application/Cli/Commands',
          '--output', '[CONSOLE]'
        ]), mfs);

      expect(inputs.resource).to.equal('com');
      expect(helpers.containsText(inputs.xmlContent)).to.be.true();
      expect(helpers.containsText(inputs.parseInfoContent)).to.be.true();
      expect(inputs.query).to.equal('/Application/Cli/Commands');
      expect(inputs.output).to.equal(ct.ConsoleTag);
    });
  });
});
