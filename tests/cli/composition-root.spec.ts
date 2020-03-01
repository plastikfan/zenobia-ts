
import { use } from 'chai';
import 'xmldom-ts';
import * as path from 'path';
import * as memfs from 'memfs';
import * as ct from '../../lib/cli/cli-types';
import * as testHelpers from '../test-helpers';
import dirtyChai = require('dirty-chai');
use(dirtyChai);

const compositionRoot = require('../../lib/cli/composition-root');
const vol = memfs.vol;

describe('composition-root', () => {
  context('given: non default yargs instance', () => {
    it('should: (coverage)', () => {
      const fakeConsole = new testHelpers.FakeConsole();
      const yin = require('yargs')([
        'jax',
        '--xml', path.resolve(__dirname, './commands.content.xml'),
        '--query', '/Application/Cli/Commands',
        '--res', 'com',
        '--parseInfo', path.resolve(__dirname, './test.parseInfo.all.json'),
        '--output', ct.ConsoleTag
      ]);

      const virtualFS = testHelpers.setupFS([
        path.resolve(__dirname, './commands.content.xml'),
        path.resolve(__dirname, './test.parseInfo.all.json')
      ]);

      compositionRoot(fakeConsole, virtualFS, yin);
      vol.reset();
    });
  });

  context('given: default yargs instance', () => {
    it('should: (coverage)', () => {
      const fakeConsole = new testHelpers.FakeConsole();
      const virtualFS = testHelpers.setupFS([
        path.resolve(__dirname, './commands.content.xml'),
        path.resolve(__dirname, './test.parseInfo.all.json')
      ]);

      compositionRoot(fakeConsole, virtualFS);
      vol.reset();
    });
  });
}); // composition-root
