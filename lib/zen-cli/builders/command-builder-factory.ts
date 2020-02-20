import * as jaxom from 'jaxom-ts';
import * as types from '../../types';
import { CommandBuilder } from './command-builder.class';

export function construct (converter: jaxom.IConverter, specSvc: jaxom.ISpecService,
  parseInfo: jaxom.IParseInfo, xpath: types.ISelectors): any {

  return new CommandBuilder(converter, specSvc, parseInfo, xpath);
}
