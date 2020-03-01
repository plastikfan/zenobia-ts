
import * as jaxom from 'jaxom-ts';
import * as ct from '../cli-types';
import * as helpers from '../../utils/helpers';
import * as types from '../../types';

/**
 * @export
 * @abstract
 * @class CliCommand
 * @implements {ct.ICliCommand}
 */
export abstract class CliCommand implements ct.ICliCommand {
  /**
   * @description Creates an instance of CliCommand.
   * @param {ct.IExecutionContext} executionContext
   * @memberof CliCommand
   */
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

  public abstract exec (): ct.ICommandExecutionResult;

  /**
   * @description Creates an IParseInfo instance from JSON content
   *
   * @protected
   * @param {string} content JSON representation of Parse Info
   * @param {ct.IParseInfoFactory} parseInfoFactory
   * @returns {jaxom.IParseInfo}
   * @memberof CliCommand
   */
  protected acquireParseInfo (content: string, parseInfoFactory: ct.IParseInfoFactory)
  : jaxom.IParseInfo {
    return parseInfoFactory.construct(content);
  }
}

/**
 * @description performs a safe assignment of a string value, only allowing
 * not-empty valid string values.
 *
 * @export
 * @param {(null | undefined | string)} stringValue
 * @param {string} name
 * @returns {string}
 */
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
