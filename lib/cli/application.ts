import { IExecutionContext, ICommandExecutionResult } from './cli-types';
import * as factory from './commands/command-factory';

/**
 * @description entry point into the cli application
 *
 * @export
 * @param {IExecutionContext} executionContext
 * @returns {number}
 */
export function run (executionContext: IExecutionContext)
: number {
  const command = factory.construct(executionContext);
  const executionResult: ICommandExecutionResult = command.exec(executionContext);
  return executionResult.resultCode;
}

// When the command line is: "zen jax -x ./tests/cli/commands.content.xml -p tests/cli/test.parseInfo.all.json"
// argv:  [ /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/node,
//          /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/zen,
//          jax,
//          -x,
//          ./tests/cli/commands.content.xml,
//          -p,
//          tests/cli/test.parseInfo.all.json]
//
// index 0: /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/node
// index 1: /Users/Plastikfan/.nvm/versions/node/v12.13.0/bin/zen
// index 2: jax
// index 3: -x
// index 4: ./tests/cli/commands.content.xml
// index 5: -p
// index 6: tests/cli/test.parseInfo.all.json
//
// yargs.Argv is internally set to process.argv.slice(2), and therefore, we can see that the first
// argument is the name of the sub-command; argv._[0] is the subcommand
// so to peek into it to get the command name, just use process.argv.slice(2)[0]
//
