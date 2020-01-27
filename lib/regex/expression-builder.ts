
import * as xp from 'xpath-ts';
import * as R from 'ramda';
import * as impl from './expression-builder.impl';
import * as jaxom from 'jaxom-ts';
import * as types from '../types';
const spec = jaxom.Specs.default;

/**
 * @function: buildExpressions
 * @description: Builds all regular expression in the document (parentNode). Expressions
 * that are contained inside an Expression element, are pp
 *
 * @param {XMLNode} parentNode: the xpath node which is the parent under which the requested
 * expression group should reside.
 * @returns: A group of regular expressions returned as a map-like object, keyed by the
 * names of each expression group.
 */
export function buildExpressions (converter: jaxom.IConverter, parentNode: Node)
  : types.StringIndexableObj {
  const parseInfo = impl.getParseInfo();
  const expressionsInfo = jaxom.composeElementInfo('Expressions', parseInfo);
  const { id = '' } = expressionsInfo;

  validateId(parentNode, ['Expression', 'Expressions'], impl.getParseInfo());

  const expressionGroupNodes = xp.select(`.//Expressions[@${id}]`, parentNode);

  if (expressionGroupNodes instanceof Array) {
    if (expressionGroupNodes.length === 0) {
      throw new Error('Bad configuration: No <Expressions>s found');
    }

    const expressionGroups = R.reduce((acc: types.StringIndexableObj, groupNode: Node): any => {
      const groupElement = groupNode as Element;
      const groupName: string = groupElement.getAttribute(id) || '';
      const group: any = impl.buildExpressionGroup(converter, parentNode, groupName);
      if (!R.includes(groupName, R.keys(acc))) {
        acc[groupName] = group;
      } else {
        throw new Error(`<Expressions> with ${id}="${groupName}" already defined`);
      }

      return acc;
    }, {})(expressionGroupNodes);

    return normalise(expressionGroups, impl.getParseInfo());
  }

  throw new Error('Failed to select <Expressions> nodes');
} // buildExpressions

/**
 * @function: validateId
 * @description: Checks that id's of named elements are valid
 *
 * @param {XMLNode} parentNode: the xpath node which is the parent under which the requested
 * @param {Array} elementNames: Array containing the names of elements to be validated
 * expression group should reside.
 * @param {jaxom.IParseInfo} parseInfo: The jaxom parse info object which should
 * contain jaxom element info for 'Expressions' and 'Expression'.
 * @throws: if id anomaly is found
 */
function validateId (parentNode: Node, elementNames: string[], parseInfo: jaxom.IParseInfo)
  : void {
  if (elementNames.length && elementNames.length > 0) {
    elementNames.forEach((elementName: string) => {
      const elementInfo: jaxom.IElementInfo = jaxom.composeElementInfo(elementName, parseInfo);
      const { id = '' } = elementInfo;

      if (id !== '') {
        const elementsWithoutIdResult = xp.select(`.//${elementName}[not(@${id})]`, parentNode);

        if (elementsWithoutIdResult instanceof Array) {
          if (elementsWithoutIdResult.length > 0) {
            const first = elementsWithoutIdResult[0];
            throw new Error(`Found at least 1 ${elementName} without ${id} attribute, first: ${first}`);
          }

          const elementsWithEmptyIdResult: any = xp.select(`.//${elementName}[@${id}=""]`, parentNode);

          if (elementsWithEmptyIdResult.length > 0) {
            const first: string = elementsWithEmptyIdResult[0];
            throw new Error(`Found at least 1 ${elementName} with empty ${id} attribute, first: ${first}`);
          }
        }
      } else {
        throw new Error(`No "id" field specified in ${elementName} elementInfo`);
      }
    });
  }
} // validateId

/**
 * @function: normalise
 * @description: The XML representation of regular expressions in the config allows
 * regular expressions to be grouped. This means that when jaxine is used to
 * convert the to JSON the result is not a particularly useful for clients to
 * interact with. Essentially all clients need is the ability to specify a
 * regular expression name and get back an expression. However, the normalise only
 * creates a map of expression names to expression objects. These expression objects
 * here are not built into fully fledged regular expressions.
 *
 * @param {Object} expressionGroups: Plain JSON object representing all expressions
 * in all Expressions groups.
 * @param {jaxom.IParseInfo} parseInfo: The jaxom parse info object which should
 * contain jaxom element info for 'Expressions' and 'Expression'.
 * @throws: if duplication definitions found for a regular expression name or id is
 * not defined for 'Expression' via getOptions.
 * @returns {Object}: Representing normalised expressions which is simply a map object,
 * from regular expression name to the regular expression object (not regex!).
 */
function normalise (expressionGroups: types.StringIndexableObj, parseInfo: jaxom.IParseInfo)
  : types.StringIndexableObj {
  const expressionInfo = jaxom.composeElementInfo('Expression', parseInfo);
  const { id = '' } = expressionInfo;

  if (!id) {
    throw new Error('No identifier found for Expression');
  }

  const descendantsLabel = spec.labels?.descendants ?? '?';

  // Each expression sub-group is already in a normalised form of sorts. The only problem we
  // have to deal with here is the fact that there is a single map per expression group. We
  // have no need to for the sub-group structure, so effectively what we need to do is combine
  // several map objects into one and detecting any potential collisions.
  //
  const combinedExpressionGroupsMap = R.reduce((combinedAcc: types.StringIndexableObj, groupName: string) => {
    const expressions = R.prop(descendantsLabel, expressionGroups[groupName]);
    const alreadyDefined = R.intersection(R.keys(expressions), R.keys(combinedAcc));
    if (!R.isEmpty(alreadyDefined)) {
      throw new Error(`These expressions have already been defined: "${R.join(', ', alreadyDefined)}"`);
    }

    const expressionsForThisGroupMap = R.reduce((thisGroupAcc: types.StringIndexableObj, exprName: string) => {
      if (R.includes(exprName, R.keys(thisGroupAcc))) {
        throw new Error(`Expression: '${exprName}' already defined`);
      }
      thisGroupAcc[exprName] = expressions[exprName];
      return thisGroupAcc;
    }, {})(R.keys(R.prop(descendantsLabel, expressionGroups[groupName])) as string[]);

    return R.mergeAll([combinedAcc, expressionsForThisGroupMap]);
  }, {})(R.keys(expressionGroups) as string[]);

  return combinedExpressionGroupsMap;
} // normalise
