
import * as jaxom from 'jaxom-ts';
import * as types from '../../types';

/**
 * @export
 * @class ArgumentBuilder
 */
export class ArgumentBuilder {
  constructor (private converter: jaxom.IConverter, private parseInfo: jaxom.IParseInfo) { }

  /**
   * @method buildArguments
   * @description: builds <Argument> definitions. There are used by the command
   * builder to resolve the <ArgumentRef>'s found.
   *
   * @param {Node} argumentsNode
   * @returns {types.StringIndexableObj}
   * @memberof ArgumentBuilder
   */
  public buildArguments (argumentsNode: Node)
  : types.StringIndexableObj {
    return this.converter.build(argumentsNode, this.parseInfo);
  }
} // ArgumentBuilder
