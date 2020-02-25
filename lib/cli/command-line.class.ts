
import * as yargs from 'yargs';
import * as ct from './cli-types';
import * as types from '../types';
import * as helpers from '../utils/helpers';

export function build (instance: yargs.Argv,
  vfs: types.VirtualFS)
  : ct.ICommandLineInputs {

  instance = instance.scriptName('zenobia-cli')
    .help()
    .command(require('./commands/jax-command.class'));

  const parseResult: ct.IZenobiaCli = instance.argv as ct.IZenobiaCli;

  const xmlOption: string = parseResult.xml;
  const xmlContent = helpers.containsText(xmlOption)
    ? vfs.readFileSync(xmlOption).toString()
    : '';

  const parseInfoOption = parseResult.parseInfo;
  const parseInfoContent = helpers.containsText(parseInfoOption)
    ? vfs.readFileSync(parseInfoOption).toString()
    : '';

  const inputs: ct.ICommandLineInputs = {
    applicationCommand: parseResult['_'][0] as ct.ApplicationCommand,
    xmlContent: xmlContent,
    resource: parseResult.res as ct.ResourceType,
    query: parseResult.query,
    parseInfoContent: parseInfoContent,
    output: parseResult.output ??
      /* istanbul ignore next: defaulted arg so can't be undefined */ ct.ConsoleTag,
    argv: parseResult
  };

  return inputs;
}
