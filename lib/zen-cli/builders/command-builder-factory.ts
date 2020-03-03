import * as jaxom from 'jaxom-ts';
import * as types from '../../types';
import { CommandBuilder } from './command-builder.class';

/**
 * @description Factory function for the creation of the CommandBuilder
 *
 * @export
 * @param {jaxom.IConverter} converter
 * @param {jaxom.ISpecService} specSvc
 * @param {jaxom.IParseInfo} parseInfo
 * @param {types.ISelectors} xpath
 * @returns {types.ICommandBuilder}
 */
export function construct (converter: jaxom.IConverter, specSvc: jaxom.ISpecService,
  parseInfo: jaxom.IParseInfo, xpath: types.ISelectors): types.ICommandBuilder {
  return new CommandBuilder(converter, specSvc, parseInfo, xpath);
}
