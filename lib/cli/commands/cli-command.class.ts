
import * as jaxom from 'jaxom-ts';
import * as ct from '../cli-types';
import * as helpers from '../../utils/helpers';
import * as types from '../../types';

export abstract class CliCommand implements ct.ICliCommand {
  constructor (protected executionContext: ct.IExecutionContext) {

    this.parseInfoContent = assign(executionContext.inputs.parseInfoContent, 'parseInfoContent');
    this.xmlContent = assign(executionContext.inputs.xmlContent, 'xmlContent');
    this.xpath = executionContext.xpath;
    this.output = assign(executionContext.inputs.output, 'output');
  }

  protected readonly parseInfoContent: string;
  protected readonly xmlContent: string;
  protected readonly xpath: types.ISelectors;
  protected output: string;

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
    throw new Error(`"${name} is not a valid string value"`);
  }

  return result;
}
