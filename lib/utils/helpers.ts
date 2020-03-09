import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as types from '../types';

// This file should only contain non domain specific functionality.
//

export const Selectors: types.ISelectors = {
  select: (query: string, doc?: Node, single?: boolean): types.Nodes => {
    const selectResult: string | number | boolean | Node | Node[] = xp.select(query, doc, single);

    /* istanbul ignore next: don't know how to test this */
    if (!(selectResult instanceof Node) && !(selectResult instanceof Array)) {
      /* istanbul ignore next */
      throw new Error(`Failed to select valid Node type (found type: "${typeof selectResult}")`);
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

/**
 * @description performs a safe assignment of a string value, only allowing
 * not-empty valid string values. This should be replaced with "ow"/"is".
 *
 * @export
 * @param {(null | undefined | string)} stringValue
 * @param {string} name
 * @returns {string}
 */
export function assign (stringValue: null | undefined | string, name: string)
  : string {
  let result: string;
  if (containsText(stringValue)) {
    result = stringValue!;
  } else {
    throw new Error(`"${name} is not a valid string value"`);
  }

  return result;
}

/**
 * @description Transform an instance of S to an instance of T using the filler object F which
 * contains the missing properties required to make an instance of the returned type T.
 *
 * @template S: Source type
 * @template F: Filler object which contains required properties that are missing from source S.
 * @template T: Target type.
 *
 * @param {S} source
 * @param {(F & { [key: string]: any})} filler
 * @param {string} targetLabel
 * @returns {T}
 */
export function fillMissing<S, F, T extends { [_key: string]: any }> (source: S,
  filler: F & { [_key: string]: any }, targetLabel: string): T {
  const missing = Object.getOwnPropertyNames(filler);

  const target = R.reduce((targetAcc: { [_key: string]: any }, m: string): any => {
    targetAcc[m] = filler[m];
    return targetAcc;
  }, R.clone(source))(missing);

  if (!(isTargetType(target, missing))) {
    throw new Error(`source object is not a valid instance of ${targetLabel}`);
  }

  return target as T;
}

/**
 * @description Type guard function to ensure that the target instance is of the required
 * type T.
 *
 * @template T: Type of the target instance.
 * @param {*} target; object instance to check.
 * @param {string[]} missing: Collection of property names that need to be present on target
 * for the guard to confirm compliance to type T.
 * @returns {inputs is I}
 */
function isTargetType<T> (target: T, missing: string[]): target is T {
  return R.all((m: string): boolean => R.has(m)(target))(missing);
}
