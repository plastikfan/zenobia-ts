
import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
import * as helpers from '../utils/helpers';
import * as types from '../types';
import * as impl from './expression-builder.impl';

/**
 *
 * @export
 * @class ExpressionBuilder
 */
export class ExpressionBuilder {
  constructor (private converter: jaxom.IConverter, private options: jaxom.ISpecService,
    private pInfo: jaxom.IParseInfo) {
    this.impl = new impl.ExpressionBuilderImpl(converter, options, pInfo);
  }

  private impl: impl.ExpressionBuilderImpl;

  /**
   * @method buildExpressions
   * @description: Builds all regular expression in the document (parentNode). Expressions
   * that are contained inside an Expression element.
   *
   * @param {Node} parentNode: the xpath node which is the parent under which the requested
   * expression group should reside.
   * @returns {types.StringIndexableObj}: A group of regular expressions returned as a
   * map-like object, keyed by the names of each expression group.
   * @memberof ExpressionBuilder
   */
  public buildExpressions (parentNode: Node)
    : types.StringIndexableObj {
    const expressionsInfo = jaxom.composeElementInfo('Expressions', this.pInfo);
    const { id = '' } = expressionsInfo;

    this.validateId(parentNode, ['Expression', 'Expressions']);

    const expressionGroupNodes = xp.select(`.//Expressions[@${id}]`, parentNode);

    if (expressionGroupNodes instanceof Array) {
      if (expressionGroupNodes.length === 0) {
        throw new Error('Bad configuration: No <Expressions>s found');
      }

      const expressionGroups = R.reduce((acc: types.StringIndexableObj, groupNode: Node): any => {
        const groupElement = groupNode as Element;
        const groupName: string = groupElement.getAttribute(id) || '';
        const group: any = this.impl.buildExpressionGroup(parentNode, groupName);
        if (!R.includes(groupName, R.keys(acc))) {
          acc[groupName] = group;
        } else {
          throw new Error(`<Expressions> with ${id}="${groupName}" already defined`);
        }

        return acc;
      }, {})(expressionGroupNodes);

      return this.normalise(expressionGroups);
    }

    throw new Error('Failed to select <Expressions> nodes');
  } // buildExpressions

  public evaluate (expressionName: string, expressions: any): any {
    return this.impl.evaluate(expressionName, expressions);
  }

  /**
   * @method validateId
   * @description: Checks that id's of named elements are valid
   *
   * @private
   * @param {Node} parentNode: the xpath node which is the parent under which the requested
   * @param {string[]} elementNames: Array containing the names of elements to be validated
   * expression group should reside.
   * @throws: if id anomaly is found.
   * @memberof ExpressionBuilder
   */
  private validateId (parentNode: Node, elementNames: string[])
    : void {
    if (elementNames.length && elementNames.length > 0) {
      elementNames.forEach((elementName: string) => {
        const elementInfo: jaxom.IElementInfo = jaxom.composeElementInfo(elementName, this.pInfo);
        const { id = '' } = elementInfo;

        if (id !== '') {
          const elementsWithoutIdResult = xp.select(`.//${elementName}[not(@${id})]`, parentNode);

          if (elementsWithoutIdResult instanceof Array) {
            if (elementsWithoutIdResult.length > 0) {
              const first = elementsWithoutIdResult[0];
              throw new Error(
                `Found at least 1 ${elementName} without ${id} attribute, first: ${functify(first)}`);
            }

            const elementsWithEmptyIdResult: any = xp.select(`.//${elementName}[@${id}=""]`, parentNode);

            if (elementsWithEmptyIdResult.length > 0) {
              const first: string = elementsWithEmptyIdResult[0];
              throw new Error(
                `Found at least 1 ${elementName} with empty ${id} attribute, first: ${functify(first)}`);
            }
          }
        } else {
          throw new Error(`No "id" field specified in ${elementName} elementInfo`);
        }
      });
    }
  } // validateId

  /**
   * @method normalise
   * @description: The XML representation of regular expressions in the config allows
   * regular expressions to be grouped. This means that when jaxine is used to
   * convert the to JSON the result is not a particularly useful for clients to
   * interact with. Essentially all clients need is the ability to specify a
   * regular expression name and get back an expression. However, the normalise only
   * creates a map of expression names to expression objects. These expression objects
   * here are not built into fully fledged regular expressions.
   *
   * @private
   * @param {*} expressionGroups: Plain JSON object representing all expressions
   * in all Expressions groups.
   * @throws: if duplication definitions found for a regular expression name or id is
   * not defined for 'Expression' via getOptions.
   * @returns {types.StringIndexableObj}: representing normalised expressions which is
   * simply a map object, from regular expression name to the regular expression
   *  object (not regex!).
   *
   * @memberof ExpressionBuilder
   */
  private normalise (expressionGroups: any)
    : types.StringIndexableObj {

    const expressionInfo = jaxom.composeElementInfo('Expression', this.pInfo);
    const { id = '' } = expressionInfo;

    if (!id) {
      throw new Error('No identifier found for Expression');
    }

    // Each expression sub-group is already in a normalised form of sorts. The only problem we
    // have to deal with here is the fact that there is a single map per expression group. We
    // have no need to for the sub-group structure, so effectively what we need to do is combine
    // several map objects into one and detecting any potential collisions.
    //
    const combinedExpressionGroupsMap = R.reduce(
      (combinedAcc: types.StringIndexableObj, groupName: string) => {
        const expressions = R.prop(this.options.descendantsLabel, expressionGroups[groupName]);
        const alreadyDefined = R.intersection(R.keys(expressions), R.keys(combinedAcc));
        if (!R.isEmpty(alreadyDefined)) {
          throw new Error(`These expressions have already been defined: "${
            R.join(', ', alreadyDefined)}"`);
        }

        const expressionsForThisGroupMap = R.reduce(
          (thisGroupAcc: types.StringIndexableObj, exprName: string) => {
            if (R.includes(exprName, R.keys(thisGroupAcc))) {
              throw new Error(`Expression: '${exprName}' already defined`);
            }
            thisGroupAcc[exprName] = expressions[exprName];
            return thisGroupAcc;
          }, {})(R.keys(R.prop(
            this.options.descendantsLabel, expressionGroups[groupName])) as string[]);

        return R.mergeAll([combinedAcc, expressionsForThisGroupMap]);
      }, {})(R.keys(expressionGroups) as string[]);

    return combinedExpressionGroupsMap;
  } // normalise
} // ExpressionBuilder
