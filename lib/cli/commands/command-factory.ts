import * as ct from '../cli-types';
import { JaxCommand } from './jax-command.class';

export function construct (executionContext: ct.IExecutionContext): ct.ICliCommand {
  let command;
  const applicationCommand: ct.ApplicationCommand = executionContext.inputs.applicationCommand;

  switch (applicationCommand) {
    case 'jax': {
      command = new JaxCommand(executionContext);
    } break;

    default:
      throw new Error(`Invalid command type: "${applicationCommand}" requested`);
  }

  return command;
}
