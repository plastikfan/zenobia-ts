
import * as jaxom from 'jaxom-ts';
import * as ct from '../cli-types';
import * as helpers from '../../utils/helpers';

export abstract class CliCommand implements ct.ICliCommand {
  constructor (protected executionContext: ct.IExecutionContext) {

    this.out = assign(executionContext.inputs.out, 'out');
  }

  protected out: string;

  public abstract exec (): number;

  protected acquireParseInfo (content: string, parseInfoFactory: ct.IParseInfoFactory)
  : jaxom.IParseInfo {

    return parseInfoFactory.construct(content);
  }
}

export function assign (stringValue: null | undefined | string, name: string)
: string {
  let result: string;
  if (helpers.containsText(stringValue)) {
    result = stringValue!;
  } else {
    throw new Error(`"${name} is not correctly defined"`);
  }

  return result;
}
