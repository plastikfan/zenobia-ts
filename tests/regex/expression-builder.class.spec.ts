
import { functify } from 'jinxed';
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import * as xp from 'xpath-ts';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import * as build from '../../lib/regex/expression-builder.class';

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
        }];

      tests.forEach((t: IUnitTestInfo) => {
        context(`given: ${t.given}`, () => {
          it('should: throw', () => {
            const converter = new jaxom.XpathConverter();
            const document = parser.parseFromString(t.data);
            const options = new jaxom.SpecOptionService();
            const builder = new build.ExpressionBuilder(converter, options);
            const applicationNode = xp.select('/Application', document, true);

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
