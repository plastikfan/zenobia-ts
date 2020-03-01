import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as types from '../types';

export const Selectors: types.ISelectors = {
  select: (query: string, doc?: Node, single?: boolean): types.Nodes => {
    const selectResult: string | number | boolean | Node | Node[] = xp.select(query, doc, single);

    /* istanbul ignore next: don't know how to test this */
    if (!(selectResult instanceof Node) && !(selectResult instanceof Array)) {
      /* istanbul ignore next */
      throw new Error('');
    }
    return selectResult;
  },
  selectById: (elementName: string, id: string, name: string, parentNode: Node): types.NullableNode => {
    const query = `.//${elementName}[@${id}="${name}"]`;
    const elementResult = xp.select(query, parentNode, true);

    /* istanbul ignore next */
    return elementResult instanceof Node ? elementResult : null;
  }
};

/**
 * @description Determines if the provided value is a valid non empty string
 *
 * @export
 * @param {(null | undefined | string)} str
 * @returns {boolean}
 */
export function containsText (str: null | undefined | string): boolean {
  return !R.isNil(str) && (str.trim().length > 0);
}
