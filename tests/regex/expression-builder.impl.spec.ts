
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as R from 'ramda';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import * as xp from 'xpath-ts';

import * as builder from '../../lib/regex/expression-builder';
import * as impl from '../../lib/regex/expression-builder.impl';

describe('Expression Builder', () => {
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
          const applicationNode = xp.select('/Application', document, true);

          if (applicationNode instanceof Node) {
            const expressions = builder.buildExpressions(converter, applicationNode);

            const expression = impl.evaluate(t.expressionName, expressions);
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
        given: 'evaluate invoked with empty expression name',
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
        given: 'evaluate invoked with options without an "id"',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Expressions name="test-expressions">
              <Expression name="forename-expression" eg="Ted">
                <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
              </Expression>
            </Expressions>
          </Application>`,
        expressionName: '',
        expectedRegexText: 'THIS IS A REG EX',
        elementInfo: { description: 'missing id' }
      },
      {
        given: 'evaluate invoked with an expression name that is undefined',
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
        given: 'evaluate invoked with empty expression name',
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

    const expressionInfo = {
      id: 'name'
    };

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: throw', () => {
          const converter = new jaxom.XpathConverter();
          const document: Document = parser.parseFromString(t.data);
          const applicationNode = xp.select('/Application', document, true);

          if (applicationNode instanceof Node) {
            const expressions = builder.buildExpressions(converter, applicationNode);

            expect(() => {
              const ei: any = R.has('elementInfo', t) ? t.elementInfo : expressionInfo;
              impl.evaluate(t.expressionName, expressions, ei);
            }).to.throw();
          } else {
            assert.fail('Couldn\'t get Application node.');
          }
        });
      });
    });
  }); // evaluate (error handling)
}); // Expression Builder
