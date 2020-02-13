
import { functify } from 'jinxed';
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import * as build from '../../lib/regex/expression-builder.class';
import * as helpers from '../../lib/utils/helpers';
import * as types from '../../lib/types';

describe('Expression builder', () => {
  context('Expression', () => {
    context('Error handling', () => { // Expression:
      interface IUnitTestInfo {
        given: string;
        data: string;
      }

      const tests: IUnitTestInfo[] = [
        {
          given: 'Expression defined within Expressions with duplicated entry',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expression defined within Expressions without @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression nametypo="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expression defined within Expressions with empty @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression name="" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        // Expressions:
        {
          given: 'Multiple Expressions defined with same name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
              <Expressions name="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expressions defined without @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions nametypo="field-type-expressions">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'Expressions defined with empty @name attribute',
          data: `<?xml version="1.0"?>
            <Application name="pez">
              <Expressions name="">
                <Expression name="person's-name-expression" eg="Ted O'Neill">
                  <Pattern><![CDATA[[a-zA-Z\s']+]]></Pattern>
                </Expression>
              </Expressions>
            </Application>`
        },
        {
          given: 'invalid/missing expression group Node',
          data: `<?xml version="1.0"?>
            <Application name="pez"/>`
        }
      ];

      tests.forEach((t: IUnitTestInfo) => {
        context(`given: ${t.given}`, () => {
          it('should: throw', () => {
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
            const converter = new jaxom.XpathConverter();
            const document = parser.parseFromString(t.data);
            const specSvc = new jaxom.SpecOptionService();
            const xpath = helpers.Selectors;
            const builder = new build.ExpressionBuilder(converter, specSvc, parseInfo,
              xpath);
            const applicationNode = xpath.select('/Application', document, true);

            if (applicationNode instanceof Node) {
              expect(() => {
                builder.buildExpressions(applicationNode);
              }).to.throw();
            } else {
              assert.fail('Couldn\'t get Application node.');
            }
          });
        });
      });
    });
  }); // Expression
}); // Expression builder

describe('Expression builder Error Handling', () => {
  let converter: jaxom.XpathConverter;
  let document: Document;
  let builder: build.ExpressionBuilder;

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

    builder = new build.ExpressionBuilder(
      converter,
      new jaxom.SpecOptionService(),
      pi,
      xpath
    );
  }

  context('buildExpressions', () => {
    context('given: no <Expressions>', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez"/>`;
        init(data);

        expect(() => {
          builder.buildExpressions(document);
        }).to.throw();
      });
    });

    context('given: no <Expressions>', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
          </Application>`;
        init(data);

        expect(() => {
          builder.buildExpressions(document);
        }).to.throw();
      });
    });

    context('given: Different expression groups contain an Expression with same id(name)', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Expressions name="test-expressions">
            <Expression name="forename-expression" eg="Ted">
              <Pattern link="middle-expression"/>
              <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
            </Expression>
          </Expressions>
          <Expressions name="duplicate-expressions">
            <Expression name="forename-expression" eg="Ted">
              <Pattern link="middle-expression"/>
              <Pattern><![CDATA[THIS IS A REG EX]]></Pattern>
            </Expression>
          </Expressions>
        </Application>`;
        init(data);

        expect(() => {
          builder.buildExpressions(document);
        }).to.throw();
      });
    });
  }); // buildExpressions
});
