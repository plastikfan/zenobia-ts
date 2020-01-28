
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as xp from 'xpath-ts';
import * as types from '../types';

export function selectElementNodeById (elementName: string, id: string, name: string,
  parentNode: Node): types.NullableNode {
  const elementResult = xp.select(`.//${elementName}[@${id}="${name}"]`, parentNode, true);

  return elementResult instanceof Node ? elementResult : null;
}
