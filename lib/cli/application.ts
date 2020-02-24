import { IExecutionContext, ICommandExecutionResult } from './cli-types';
import * as factory from './commands/command-factory';

export function run (executionContext: IExecutionContext)
: number {
  const command = factory.construct(executionContext);
  const executionResult: ICommandExecutionResult = command.exec(executionContext);
  return executionResult.resultCode;
}
