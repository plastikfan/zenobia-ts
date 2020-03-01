
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
// eslint-disable-next-line no-unused-vars
import * as types from '../types';

/**
 * @export
 * @class ExpressionBuilderImpl
 */
export class ExpressionBuilderImpl {
  constructor (private converter: jaxom.IConverter, private specSvc: jaxom.ISpecService,
    private parseInfo: jaxom.IParseInfo, private xpath: types.ISelectors) { }

  /**
   * @method buildExpressionGroup
   * @description: Builds all the expressions for a named expression group.
   *
   * @param {Node} parentNode: the dom node which is the parent under which the requested
   * expression group should reside.
   * @param {string} groupName: the "name" attribute of the expression group to build.
   * @returns: A group of regular expressions returned as a map-like object, keyed by the
   * names of each expression group.
   * @returns {types.StringIndexableObj}
   * @memberof ExpressionBuilderImpl
   */
  public buildExpressionGroup (parentNode: Node, groupName: string)
    : types.StringIndexableObj {
    const expressionsGroupNode = this.xpath.selectById(
      'Expressions', 'name', groupName, parentNode);

    if (expressionsGroupNode instanceof Node) {
      const expressionsGroup = this.converter.build(expressionsGroupNode, this.parseInfo);
      return expressionsGroup;
    } else {
      throw new Error(`Bad configuration: No <Expressions "name"="${groupName}">s found`);
    }
  }

  readonly ExpressionId = 'name'; // !!! should be replaced with parseInfo.id

  /**
   * @method express
   * @description: Composes the regexs from the Pattern elements. To avoid excessive building
   * of regexs, they are memoized and stored as a new property (reg) on object representing the
   * Expression element. Also, the "eg" attributes are collated and stored in the Expression
   * object as an "eg" property.
   *
   * @private
   * @param {*} expressions: a map object keyed by regular expression name (<Expression @name>)
   * which maps to the corresponding expression object previously built.
   *
   * @param {jaxom.IParseInfo} parseInfo: The jaxom parse info object which should
   * contain jaxom element info for 'Expressions' and 'Expression'.
   *
   * @returns {*}
   * @memberof ExpressionBuilderImpl
   */
  // private express (expressions: any, parseInfo: jaxom.IParseInfo): any {
  //   //
  // }

  /**
   * @method evaluate
   * @description: Builds the regular expressions out of fragments defined in Expression/Pattern.
   *
   * @param {string} expressionName: Plain JSON object that represents the built Expression element,
   * where each pattern cn contain either a text field, or a link field, but not both. Also
   * the Expression object may have an eg field, which must also be collated.
   *
   * @param {*} expressions: a map object keyed by regular expression name (<Expression @name>)
   * which maps to the corresponding expression object previously built.
   * @param {String[]} [previouslySeen=[]] : Used internally to guard against circular references,
   * via Pattern @link.
   * @throws exceptions in the following circumstances:
   * - expressionName is falsy
   * - id missing from options
   * - no Expression for the expressionName specified
   * - Expression element has no child Pattern elements defined
   * - Expression contain both local text and a link attribute
   * - Circular reference detected via link attribute
   * - Expression does not contain either local text or a link attribute
   * - Regular expression built is not valid
   * @returns {*} a new version of expression with new fields populated
   * @memberof ExpressionBuilderImpl
   */
  public evaluate (expressionName: string, expressions: any, previouslySeen = []): any {
    if (!expressionName) {
      throw new Error('Expression name not specified');
    }

    if (!R.includes(expressionName, R.keys(expressions))) {
      throw new Error(`Expression (${this.ExpressionId}="${expressionName}") not found`);
    }
    const expression = expressions[expressionName];

    if (!R.has(this.specSvc.descendantsLabel)(expression)) {
      throw new Error(`Expression (${this.ExpressionId}="${
        expressionName}") does not contain any Patterns`);
    }

    const patterns = R.filter((o: any) => R.equals(R.prop('_', o), 'Pattern'),
      R.prop(this.specSvc.descendantsLabel, expression));

    if (R.isEmpty(patterns)) {
      throw new Error(`Expression (${this.ExpressionId}="${
        expressionName}") does not contain any Patterns`);
    }

    // Build the regular expression text
    //
    const expressionText = R.reduce((acc: string, pattern: any) => {
      const text = R.cond([
        [R.both(R.has(this.specSvc.textLabel), R.has('link')), () => {
          throw new Error(`Expression (${this.ExpressionId}="${
            expressionName}"), contains a Pattern with both a link and text`);
        }],
        [R.has(this.specSvc.textLabel), R.prop(this.specSvc.textLabel)],
        [R.has('link'), (o: any): string => {
          const link: string = R.prop('link', o);
          if (R.includes(link, previouslySeen)) {
            throw new Error(`Circular reference detected, element '${
              link}', has already been encountered.`);
          }

          const p = R.append(expressionName, previouslySeen) as any; // cast away never ???
          const linkedExpression: any = this.evaluate(link, expressions, p);
          const linkedText: any = R.prop('$regexp', linkedExpression).source;
          return linkedText;
        }],
        [R.T, () => {
          throw new Error(`Expression (${this.ExpressionId}="${
            expressionName}") contains a Pattern without a link or regex text`);
        }]
      ])(pattern);
      return acc + text;
    }, '')(patterns);

    let updatedExpression;
    try {
      updatedExpression = R.set(R.lensProp('$regexp'), new RegExp(expressionText))(expression);
    } catch (error) {
      throw new Error(`Expression (${this.ExpressionId}="${
        expressionName}") invalid regular expression: ${expressionText}`);
    }

    // Build the collection of named capturing groups. We can do this by parsing the collated
    // regular expression text (rather than depending on a user specified definition of a "groups"
    // attribute). Named capturing groups of the form: ?<groupName>
    //
    const captureGroupsRegExp = new RegExp('\\?<(?<captureGroup>[a-zA-Z]+)>', 'g');
    let captures: any = [];
    let capture: RegExpExecArray | null;

    do {
      capture = captureGroupsRegExp.exec(expressionText);

      if (capture) {
        /* istanbul ignore next: too difficult to test for missing groups/captureGroup */
        captures = R.append(capture?.groups?.captureGroup, captures);
      }
    }
    while (capture);

    if (!R.isEmpty(captures)) {
      updatedExpression = R.set(R.lensProp('$namedGroups'), captures)(updatedExpression);
    }

    // Now build up the "eg" text. There are 2 ways the "eg" Text can be composed:
    // 1) The single "eg" attribute instance on the Expression
    // 2) The collection of "eg" values on all of the Patterns inside the Expression
    // If Expression contains an "eg", this will be used and overrides the Pattern instances
    //    otherwise, the Patterns' "eg" instances will be collated and used.
    //
    if (R.has('eg', updatedExpression)) {
      updatedExpression = R.set(R.lensProp('$eg'), R.prop('eg', updatedExpression))(updatedExpression);
    } else {
      // Do Pattern eg collation ...
      //
      const egPatterns = R.filter(R.has('eg'))(patterns);

      const egText = R.reduce((acc: string, pattern: any) => {
        const text = R.prop('eg')(pattern);
        return acc + text;
      }, '')(egPatterns);

      updatedExpression = R.set(R.lensProp('$eg'), egText)(updatedExpression);
    }
    return updatedExpression;
  } // evaluate

  /**
   * @method validateId
   * @description: Checks that id's of named elements are valid
   *
   * @public
   * @param {Node} parentNode: the xpath node which is the parent under which the requested
   * @param {string[]} elementNames: Array containing the names of elements to be validated
   * expression group should reside.
   * @throws: if id anomaly is found.
   * @memberof ExpressionBuilderImpl
   */
  public validateId (parentNode: Node, elementNames: string[])
    : void {
    if (elementNames.length && elementNames.length > 0) {
      elementNames.forEach((elementName: string) => {
        const elementInfo: jaxom.IElementInfo = jaxom.composeElementInfo(elementName, this.parseInfo);
        /* istanbul ignore next: typescript prevents elementInfo not having id */
        const { id = '' } = elementInfo;

        if (id !== '') {
          const elementsWithoutIdResult = this.xpath.select(`.//${elementName}[not(@${id})]`, parentNode);

          /* istanbul ignore next: type-guard; xp.select always returns array */
          if (elementsWithoutIdResult instanceof Array) {
            if (elementsWithoutIdResult.length > 0) {
              const first = elementsWithoutIdResult[0];
              throw new Error(
                `Found at least 1 ${elementName} without ${id} attribute, first: ${functify(first)}`);
            }

            const elementsWithEmptyIdResult: any = this.xpath.select(`.//${elementName}[@${id}=""]`, parentNode);

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
   * @memberof ExpressionBuilderImpl
   */
  public normalise (expressionGroups: any)
    : types.StringIndexableObj {
    // Each expression sub-group is already in a normalised form of sorts. The only problem we
    // have to deal with here is the fact that there is a single map per expression group. We
    // have no need to for the sub-group structure, so effectively what we need to do is combine
    // several map objects into one and detecting any potential collisions.
    //
    const combinedExpressionGroupsMap = R.reduce(
      (combinedAcc: types.StringIndexableObj, groupName: string) => {
        const expressions = R.prop(this.specSvc.descendantsLabel, expressionGroups[groupName]);
        const alreadyDefined = R.intersection(R.keys(expressions), R.keys(combinedAcc));
        /* istanbul ignore if */
        if (!R.isEmpty(alreadyDefined)) {
          /* istanbul ignore next */
          throw new Error(`These expressions have already been defined: "${
            R.join(', ', alreadyDefined)}"`);
        }

        const expressionsForThisGroupMap = R.reduce(
          (thisGroupAcc: types.StringIndexableObj, exprName: string) => {
            /* istanbul ignore if */
            if (R.includes(exprName, R.keys(thisGroupAcc))) {
              /* istanbul ignore next */
              throw new Error(`Expression: '${exprName}' already defined`);
            }
            thisGroupAcc[exprName] = expressions[exprName];
            return thisGroupAcc;
          }, {})(R.keys(R.prop(
            this.specSvc.descendantsLabel, expressionGroups[groupName])) as string[]);

        return R.mergeAll([combinedAcc, expressionsForThisGroupMap]);
      }, {})(R.keys(expressionGroups) as string[]);

    return combinedExpressionGroupsMap;
  } // normalise
} // ExpressionBuilderImpl
