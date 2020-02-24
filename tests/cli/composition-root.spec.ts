
import { use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import 'xmldom-ts';
import * as path from 'path';
import * as memfs from 'memfs';
import * as ct from '../../lib/cli/cli-types';
import * as testHelpers from '../test-helpers';

const compositionRoot = require('../../lib/cli/composition-root');
const vol = memfs.vol;

describe('composition-root', () => {
  it('(coverage)', () => {

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
}); // composition-root
