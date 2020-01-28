
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as types from '../types';
import * as impl from './expression-builder.impl';

/**
 *
 * @export
 * @class ExpressionBuilder
 */
export class ExpressionBuilder {
  constructor (private converter: jaxom.IConverter, private options: jaxom.ISpecService,
    private pareInfo: jaxom.IParseInfo, private xpath: types.IXPathSelector) {
    this.impl = new impl.ExpressionBuilderImpl(this.converter, options,
      pareInfo, this.xpath);
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
    const expressionsInfo = jaxom.composeElementInfo('Expressions', this.pareInfo);
    /* istanbul ignore next: typescript protects id from being missing */
    const { id = '' } = expressionsInfo;

    this.impl.validateId(parentNode, ['Expression', 'Expressions']);

    const expressionGroupNodes = this.xpath.select(`.//Expressions[@${id}]`, parentNode);

    /* istanbul ignore else xp.select return [] if no Expression found */
    if (expressionGroupNodes instanceof Array) {
      if (expressionGroupNodes.length === 0) {
        throw new Error('Bad configuration: No <Expressions>s found');
      }

      const expressionGroups = R.reduce((acc: types.StringIndexableObj, groupNode: Node): any => {
        const groupElement = groupNode as Element;
        /* istanbul ignore next: above select by id, means can't be missing */
        const groupName: string = groupElement.getAttribute(id) || '';
        const group: any = this.impl.buildExpressionGroup(parentNode, groupName);
        if (!R.includes(groupName, R.keys(acc))) {
          acc[groupName] = group;
        } else {
          throw new Error(`<Expressions> with ${id}="${groupName}" already defined`);
        }

        return acc;
      }, {})(expressionGroupNodes);

      return this.impl.normalise(expressionGroups);
    }

    /* istanbul ignore next: xp.select return [] if no Expression found */
    throw new Error('Failed to select <Expressions> nodes');
  } // buildExpressions

  public evaluate (expressionName: string, expressions: any): any {
    return this.impl.evaluate(expressionName, expressions);
  }
} // ExpressionBuilder
