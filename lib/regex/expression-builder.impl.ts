
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as helpers from '../utils/helpers';

const defaultSpec = jaxom.Specs.default;

const ExpressionId = 'name';
const parseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    ['Expressions', {
      id: ExpressionId,
      descendants: {
        by: 'index',
        id: ExpressionId,
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['Expression', {
      id: ExpressionId
    }]
  ])
};

export function getParseInfo (): jaxom.IParseInfo {
  return parseInfo;
}

/**
 * @function buildExpressionGroup
 * @description: Builds all the expressions for a named expression group.
 *
 * @export
 * @param {jaxom.IConverter} converter
 * @param {Node} parentNode: the dom node which is the parent under which the requested
 * expression group should reside.
 * @param {string} groupName: the "name" attribute of the expression group to build.
 * @returns: A group of regular expressions returned as a map-like object, keyed by the
 *    names of each expression group.
 */
export function buildExpressionGroup (converter: jaxom.IConverter, parentNode: Node, groupName: string) {
  const expressionsGroupNode = helpers.selectElementNodeById(
    'Expressions', ExpressionId, groupName, parentNode);

  if (expressionsGroupNode instanceof Node) {
    const expressionsGroup = converter.build(expressionsGroupNode, parseInfo);
    return expressionsGroup;
  } else {
    throw new Error(`Bad configuration: No <Expressions "${ExpressionId}"="${groupName}">s found`);
  }
} // buildExpressionGroup

/**
 * @function express
 * @description: Composes the regexs from the Pattern elements. To avoid excessive building
 * of regexs, they are memoized and stored as a new property (reg) on object representing the
 * Expression element. Also, the "eg" attributes are collated and stored in the Expression
 * object as an "eg" property.
 *
 * @param {Object} expressions: a map object keyed by regular expression name (<Expression @name>)
 * which maps to the corresponding expression object previously built.
 * @param {jaxom.IParseInfo} parseInfo: The jaxom parse info object which should
 * contain jaxom element info for 'Expressions' and 'Expression'.
 */
export function express (expressions: any, parseInfo: jaxom.IParseInfo): any {
  //
} // express

/**
 * @function evaluate
 * @description: Builds the regular expressions out of fragments defined in Expression/Pattern.
 *
 * @param {Object} expression: Plain JSON object that represents the built Expression element,
 * where each pattern cn contain either a text field, or a link field, but not both. Also
 * the Expression object may have an eg field, which must also be collated. The
 * Expression object is of the form:
 *
 * 'common-album-expression': {
 *  'name': 'common-album-expression',
 *  '_': 'Expression',
 *  '_children': [{
 *        'eg': 'MOVIE',
 *        '_': 'Pattern',
 *        '_text': '(?:MOVIE)?'
 *      }, {
 *        'eg': ' - ',
 *        'link': 'spaced-dash-expression',
 *        '_': 'Pattern'
 *      }, { ...
 * @param {String} expressionName: the name of the expression to be built
 * @param {Object} expressions: a map object keyed by regular expression name (<Expression @name>)
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
 * @returns: a new version of expression with new fields populated
 */
export function evaluate (expressionName: string, expressions: any, previouslySeen = []): any {
  if (!expressionName) {
    throw new Error('Expression name not specified');
  }

  if (!R.includes(expressionName, R.keys(expressions))) {
    throw new Error(`Expression (${ExpressionId}="${expressionName}") not found`);
  }
  const expression = expressions[expressionName];
  const descendantsLabel = defaultSpec.labels?.descendants ?? '?';
  const patterns = R.filter((o: any) => R.equals(R.prop('_', o), 'Pattern'),
    R.prop(descendantsLabel, expression));

  if (R.isEmpty(patterns)) {
    throw new Error(`Expression (${ExpressionId}="${expressionName}") does not contain any Patterns`);
  }

  const textLabel = defaultSpec.labels?.text ?? '?';

  // Build the regular expression text
  //
  const expressionText = R.reduce((acc: string, pattern: any) => {
    const text = R.cond([
      [R.both(R.has(textLabel), R.has('link')), () => {
        throw new Error(`Expression (${ExpressionId}="${expressionName}"), contains a Pattern with both a link and text`);
      }],
      [R.has(textLabel), R.prop(textLabel)],
      [R.has('link'), (o: any): string => {
        const link: string = R.prop('link', o) || '';
        if (R.includes(link, previouslySeen)) {
          throw new Error(`Circular reference detected, element '${link}', has already been encountered.`);
        }

        const p = R.append(expressionName, previouslySeen) as any; // cast away never ???
        const linkedExpression: any = evaluate(link, expressions, p);
        const linkedText: any = R.prop('$regexp', linkedExpression).source;
        return linkedText;
      }],
      [R.T, () => {
        throw new Error(`Expression (${ExpressionId}="${expressionName}") contains a Pattern without a link or regex text`);
      }]
    ])(pattern);
    return acc + text;
  }, '')(patterns);

  let updatedExpression;
  try {
    updatedExpression = R.set(R.lensProp('$regexp'), new RegExp(expressionText))(expression);
  } catch (error) {
    throw new Error(`Expression (${ExpressionId}="${expressionName}") invalid regular expression: ${expressionText}`);
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

    if (capture !== null) {
      captures = R.append(capture?.groups?.captureGroup, captures);
    }
  }
  while (capture !== null);

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
