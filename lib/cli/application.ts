import * as ct from './cli-types';
import * as factory from './commands/command-factory';

export function run (executionContext: ct.IExecutionContext)
: number {
  const command = factory.construct(executionContext);
  return command.exec(executionContext);
}
