import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as types from '../types';

export const Selectors: types.ISelectors = {
  select: (query: string, doc?: Node, single?: boolean): string | number | boolean | Node | Node[] => {
    return xp.select(query, doc, single);
  },
  selectById: (elementName: string, id: string, name: string, parentNode: Node): types.NullableNode => {
    const query = `.//${elementName}[@${id}="${name}"]`;
    const elementResult = xp.select(query, parentNode, true);

    /* istanbul ignore next */
    return elementResult instanceof Node ? elementResult : null;
  }
};

export function containsText (str: null | undefined | string): boolean {
  return !R.isNil(str) && (str.trim().length > 0);
}
