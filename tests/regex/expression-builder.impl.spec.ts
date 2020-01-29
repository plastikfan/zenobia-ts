
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import sinonChai = require('sinon-chai'); use(sinonChai);
import * as R from 'ramda';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import * as build from '../../lib/regex/expression-builder.class';
import * as impl from '../../lib/regex/expression-builder.impl';
import * as helpers from '../../lib/utils/helpers';
import * as types from '../../lib/types';

const parseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    ['Expressions', {
      id: 'name',
      descendants: {
        by: 'index',
        id: 'name',
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['Expression', {
      id: 'name'
    }]
  ])
};

describe('Expression Builder Impl', () => {
  context('evaluate', () => {
    interface IUnitTestInfo {
      given: string;
      data: string;
      expressionName: string;
      expectedRegexText: string;
      expectedEgText?: string;
      expectedCaptureGroups?: string[];
    }

    const tests: IUnitTestInfo[] = [
      {
        given: 'an expression with a single Pattern with local regex text and Expression "eg" text',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX',
        expectedEgText: 'Ted'
      },
      {
        given: 'an expression with a multiple Patterns with local regex text and Pattern "eg" text',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression">
                <Pattern eg="ONE"><![CDATA[THIS IS A REG EX]]></Pattern>
                <Pattern eg="-TWO"><![CDATA[.SOME-MORE]]></Pattern>
                <Pattern eg="-THREE"><![CDATA[.EVEN-MORE]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX.SOME-MORE.EVEN-MORE',
        expectedEgText: 'ONE-TWO-THREE'
      },
      {
        given: 'an expression with a multiple Patterns with local regex text and other child elements',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
                <Pattern><![CDATA[.SOME-MORE]]></Pattern>
                <Pattern><![CDATA[.EVEN-MORE]]></Pattern>
                <Yield name="staging-album-yield" open="{" close="}">
                  <Placeholder is-present="member1"><![CDATA[ ~ {member1}]]></Placeholder>
                  <Placeholder is-present="member2"><![CDATA[ & {member2}]]></Placeholder>
                  <Placeholder is-present="member3"><![CDATA[ & {member3}]]></Placeholder>
                  <Placeholder is-present="member4"><![CDATA[ & {member4}]]></Placeholder>
                </Yield>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX.SOME-MORE.EVEN-MORE'
      },
      {
        given: 'an expression with a single Pattern which links to another pattern',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression">
                <Pattern link="spaced-dash-expression"/>
              </Expression>
              <Expression name="spaced-dash-expression">
                <Pattern><![CDATA[THIS IS A LINKED REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A LINKED REG EX'
      },
      {
        given: 'an expression with multiple Patterns and links',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="single-digit-day-no-expression">
                <Pattern><![CDATA[DAY]]></Pattern>
              </Expression>
              <Expression name="mmm-month-no-expression">
                <Pattern><![CDATA[MONTH]]></Pattern>
              </Expression>
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[YEAR]]></Pattern>
              </Expression>
              <Expression name="meta-date-expression">
                <Pattern eg="2" link="single-digit-day-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="jun" link="mmm-month-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="2016" link="y2k-years-expression"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'meta-date-expression',
        expectedRegexText: 'DAY\\sMONTH\\sYEAR'
      },
      {
        given: 'an expression with a single Pattern with a single capture group',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[(?<year>20[0-2]\\d)]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'y2k-years-expression',
        expectedRegexText: '(?<year>20[0-2]\\d)',
        expectedCaptureGroups: ['year']
      },
      {
        given: 'an expression with a single Pattern with multiple capture groups',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[(?<year>20[0-2]\\d)(?<mm>[0|1]\\d)(?<dd>[1-3]|[0-3]\\d?)]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'y2k-years-expression',
        expectedRegexText: '(?<year>20[0-2]\\d)(?<mm>[0|1]\\d)(?<dd>[1-3]|[0-3]\\d?)',
        expectedCaptureGroups: ['year', 'mm', 'dd']
      },
      {
        given: 'an expression with multiple capture groups across multiple linked Patterns',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="single-digit-day-no-expression">
                <Pattern><![CDATA[(?<d>[1-3]|[0-3]\\d?)]]></Pattern>
              </Expression>
              <Expression name="mmm-month-no-expression">
                <Pattern><![CDATA[(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])]]></Pattern>
              </Expression>
              <Expression name="y2k-years-expression">
                <Pattern><![CDATA[(?<year>20[0-2]\\d)]]></Pattern>
              </Expression>
              <Expression name="meta-date-expression">
                <Pattern eg="2" link="single-digit-day-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="jun" link="mmm-month-no-expression"/>
                <Pattern eg=" " ><![CDATA[\\s]]></Pattern>
                <Pattern eg="2016" link="y2k-years-expression"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'meta-date-expression',
        expectedRegexText: '(?<d>[1-3]|[0-3]\\d?)\\s(?<mmm>[jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec])\\s(?<year>20[0-2]\\d)',
        expectedCaptureGroups: ['d', 'mmm', 'year']
      }
    ];

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: evaluate regular expression text successfully', () => {
          const converter = new jaxom.XpathConverter();
          const document: Document = parser.parseFromString(t.data);
          const xpath = helpers.Selectors;
          const applicationNode = xpath.select('/Application', document, true);

          if (applicationNode instanceof Node) {
            const options = new jaxom.SpecOptionService();
            const builder = new build.ExpressionBuilder(converter, options, parseInfo,
              xpath);
            const expressions = builder.buildExpressions(applicationNode);
            const expression = builder.evaluate(t.expressionName, expressions);
            // expressionObject: Record<string, ?>
            const expressionObject: { source: string } = R.prop('$regexp')(expression);
            expect(expressionObject.source).to.equal(t.expectedRegexText);

            if (R.has('expectedEgText', t)) {
              const egText = R.prop('$eg')(expression);
              expect(egText, 'Failed to extract "eg" text successfully')
                .to.equal(t.expectedEgText);
            }

            if (R.has('expectedCaptureGroups', t)) {
              const namedGroups = R.prop('$namedGroups')(expression);
              expect(namedGroups, 'Failed to extract named capture groups successfully')
                .to.deep.equal(t.expectedCaptureGroups);
            }
          } else {
            assert.fail('Couldn\'t get Application node.');
          }
        });
      });
    });
  }); // evaluate

  context('evaluate (error handling)', () => {
    interface IUnitTestInfo {
      given: string;
      data: string;
      expressionName: string;
      expectedRegexText: string;
      elementInfo?: Object;
    }

    const tests: IUnitTestInfo[] = [
      {
        given: 'evaluate invoked with empty expression name', // WHERE'S THE MISSING NAME?
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: '',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'evaluate invoked with an expression name that is undefined', // ??? WHAT IS THIS DOING?
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'this-expression-does-not-exist',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'evaluate invoked with empty Expression element',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'evaluate invoked with empty Expression element',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Dummy desc="this is a child which is not a Pattern"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'Pattern contains both local text and a link attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern link="surname-expression"><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
              <Expression name="surname-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'Circular reference Pattern links to itself',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern link="forename-expression"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'Circular reference detected via link attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern link="middle-expression"/>
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
              <Expression name="middle-expression" eg="Ted">
                <Pattern link="surname-expression"/>
              </Expression>
              <Expression name="surname-expression" eg="Ted">
                <Pattern link="forename-expression"/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'Pattern does not contain either local text or a link attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern/>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: 'THIS IS A REG EX'
      },
      {
        given: 'Regular expression built is not valid',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[((((]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: 'forename-expression',
        expectedRegexText: '(((('
      }
    ];

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: throw', () => {
          const converter = new jaxom.XpathConverter();
          const document: Document = parser.parseFromString(t.data);
          const xpath = helpers.Selectors;
          const applicationNode = xpath.select('/Application', document, true);
          const options = new jaxom.SpecOptionService();
          const builder = new build.ExpressionBuilder(converter, options,
            parseInfo, xpath);

          if (applicationNode instanceof Node) {
            const expressions = builder.buildExpressions(applicationNode);

            expect(() => {
              builder.evaluate(t.expressionName, expressions);
            }).to.throw();
          } else {
            assert.fail('Couldn\'t get Application node.');
          }
        });
      });
    });
  }); // evaluate (error handling)
}); // Expression Builder Impl

describe('Expression Builder Impl Error handling (custom)', () => {
  let converter: jaxom.XpathConverter;
  let document: Document;
  let builderImpl: impl.ExpressionBuilderImpl;
  // let xpath: types.ISelector;

  beforeEach(() => {
    converter = new jaxom.XpathConverter();
  });

  function init (d: string,
    pi: jaxom.IParseInfo = {
      elements: new Map<string, jaxom.IElementInfo>([
        ['Expressions', {
          id: 'name',
          descendants: {
            by: 'index',
            id: 'name',
            throwIfCollision: true,
            throwIfMissing: true
          }
        }],
        ['Expression', {
          id: 'name'
        }]
      ])
    },
    xpath: types.ISelectors = helpers.Selectors)
    : void {
    document = parser.parseFromString(d);

    builderImpl = new impl.ExpressionBuilderImpl(
      converter,
      new jaxom.SpecOptionService(),
      pi,
      xpath
    );
  }

  context('buildExpressionGroup', () => {
    context('given: no <Expressions>', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez"/>`;
        init(data);

        expect(() => {
          builderImpl.buildExpressionGroup(document, 'no group');
        }).to.throw();
      });
    });

    context('given: undefined Expression group', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`;
        init(data);

        const expressionsNode = helpers.Selectors.selectById(
          'Expressions', 'name', 'test-expressions', document);

        if (expressionsNode instanceof Node) {
          expect(() => {
            builderImpl.buildExpressionGroup(expressionsNode, 'unicorns');
          }).to.throw();
        } else {
          assert.fail('Couldn\'t get Expressions Node');
        }
      });
    });

    context('given: empty Expressions', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions"/>
          </Application>`;
        init(data);

        const expressionsNode = helpers.Selectors.selectById(
          'Expressions', 'name', 'test-expressions', document);

        if (expressionsNode instanceof Node) {
          expect(() => {
            builderImpl.buildExpressionGroup(expressionsNode, 'unicorns');
          }).to.throw();
        } else {
          assert.fail('Couldn\'t get Expressions Node');
        }
      });
    });
  }); // buildExpressionGroup

  context('evaluate', () => {
    context('given: pattern with empty link', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression">
                <Pattern link=""/>
              </Expression>
            </Expressions>
          </Application>`;
        init(data);

        const expressionsNode = helpers.Selectors.selectById(
          'Expressions', 'name', 'test-expressions', document);

        if (expressionsNode instanceof Node) {
          expect(() => {
            builderImpl.buildExpressionGroup(expressionsNode, 'unicorns');
          }).to.throw();
        } else {
          assert.fail('Couldn\'t get Expressions Node');
        }
      });
    });

    context('given: invoked with options without an "id"', () => {
      it('should: throw', () => {
        const info: jaxom.IParseInfo = {
          elements: new Map<string, jaxom.IElementInfo>([
            ['Expressions', {
              id: 'name',
              descendants: {
                by: 'index',
                id: 'name',
                throwIfCollision: true,
                throwIfMissing: true
              }
            }],
            ['Expression', {
              id: 'name'
            }]
          ])
        };
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`;
        init(data, info);
      });
    });
  }); // evaluate

  context('validateId', () => {
    context('given: empty element array', () => {
      it('should: do nothing', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
          </Application>`;
        init(data);
        builderImpl.validateId(document, []);
      });
    });

    context('given: element with empty id', () => {
      it('should: throw', () => {
        const info: jaxom.IParseInfo = {
          elements: new Map<string, jaxom.IElementInfo>([
            ['Expression', {
              id: ''
            }]
          ])
        };
        const data = `<?xml version="1.0"?>
          <Application name="pez"/>`;
        init(data, info);

        expect(() => {
          builderImpl.validateId(document, ['Expression']);
        }).to.throw();
      });
    });

    context('given: element without an id', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="field-type-expressions">
              <Expression missing="person's-name-expression" eg="Ted O'Neill">
                <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`;
        init(data);

        expect(() => {
          builderImpl.validateId(document, ['Expressions', 'Expression']);
        }).to.throw();
      });
    });
  }); // validateId
}); // Expression Builder Impl Error handling (custom)
