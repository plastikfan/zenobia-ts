
import * as jaxom from 'jaxom-ts';
import * as types from '../../types';

/**
 * @export
 * @class OptionBuilder
 */
export class ArgumentBuilder {
  constructor (private converter: jaxom.IConverter, private parseInfo: jaxom.IParseInfo) { }

  /**
   * @method buildOptions
   * @description: builds <Option> definitions. There are used by the command
   * builder to resolve the <OptionRef>'s found.
   *
   * @param {Node} optionsNode
   * @returns {types.StringIndexableObj}
   * @memberof ArgumentBuilder
   */
  public buildOptions (optionsNode: Node)
  : types.StringIndexableObj {
    return this.converter.build(optionsNode, this.parseInfo);
  }
} // OptionBuilder
