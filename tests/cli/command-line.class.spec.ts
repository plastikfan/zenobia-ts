
import { functify } from 'jinxed';
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import * as memfs from 'memfs';

import * as testHelpers from '../test-helpers';
import * as helpers from '../../lib/utils/helpers';
import * as ct from '../../lib/cli/cli-types';
import * as commandLine from '../../lib/cli/command-line.class';

describe('command-line', () => {
  let mfs: memfs.IFs;

  context('given: jax command invoked', () => {
    it('should: capture user defined options presented on command line', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const inputs: ct.ICommandLineInputs = commandLine.build(
        require('yargs')([ct.ZenobiaExecutable, 'jax',
          '--xml', './cli/commands.content.xml',
          '--parseInfo', './cli/test.parseInfo.all.json',
          '--query', '/Application/Cli/Commands',
          '--output', '[CONSOLE]'
        ]), mfs);

      expect(helpers.containsText(inputs.xmlContent)).to.be.true();
      expect(helpers.containsText(inputs.parseInfoContent)).to.be.true();
      expect(inputs.query).to.equal('/Application/Cli/Commands');
      expect(inputs.output).to.equal(ct.ConsoleTag);
    });
  });

  context('given: empty --xml option', () => {
    it('should: do nothing', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const inputs: ct.ICommandLineInputs = commandLine.build(
        require('yargs')([ct.ZenobiaExecutable, 'jax',
          '--xml', '', // <-- empty
          '--parseInfo', './cli/test.parseInfo.all.json',
          '--query', '/Application/Cli/Commands',
          '--output', '[CONSOLE]'
        ]), mfs);
    });
  });

  context('given: empty --parseInfo option', () => {
    it('should: do nothing', () => {
      mfs = testHelpers.setupFS(['./cli/commands.content.xml', './cli/test.parseInfo.all.json']);

      const inputs: ct.ICommandLineInputs = commandLine.build(
        require('yargs')([ct.ZenobiaExecutable, 'jax',
          '--xml', './cli/commands.content.xml',
          '--parseInfo', '', // <-- empty
          '--query', '/Application/Cli/Commands',
          '--output', '[CONSOLE]'
        ]), mfs);
    });
  });

  // This is what the argv looks like after being parsed:
  //
  const zenobiaArgv = {
    '_': [
      'jax'
    ],
    'q': '/Application/Cli/Commands',
    'query': '/Application/Cli/Commands',
    'x': 'tests/cli/commands.content.xml',
    'xml': 'tests/cli/commands.content.xml',
    'p': 'tests/cli/test.parseInfo.all.json',
    'parseInfo': 'tests/cli/test.parseInfo.all.json',
    'parse-info': 'tests/cli/test.parseInfo.all.json',
    'o': '[CONSOLE]',
    'output': '[CONSOLE]',
    '$0': 'zenobia-cli'
  };
});
