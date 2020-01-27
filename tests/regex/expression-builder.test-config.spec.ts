import { functify } from 'jinxed';

import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);

import * as path from 'path';
import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as Helpers from '../test-helpers';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import * as build from '../../lib/regex/expression-builder.class';

describe.only('expression-builder (test config)', () => {
  let xml: string;
  let document: Document;
  let converter: jaxom.IConverter;
  let builder: build.ExpressionBuilder;
  const options = new jaxom.SpecOptionService();

  before(() => {
    converter = new jaxom.XpathConverter();
    builder = new build.ExpressionBuilder(converter, options);

    try {
      xml = Helpers.read(
        path.resolve(
          __dirname,
          './expression-builder.test-config.xml'
        )
      );

      document = parser.parseFromString(xml.toString());
    } catch (err) {
      assert.fail(err);
    }
  });

  context('given: a config with various expressions and expression groups', () => {
    it('should: return a map object with loaded expressions"', () => {
      const applicationNode = xp.select('/Application', document, true);

      if (applicationNode instanceof Node) {
        const expressions: any = builder.buildExpressions(applicationNode);

        const keys = R.keys(expressions);
        expect(keys.length).to.equal(34);
        expect(keys).to.include('alpha-num-expression');
      } else {
        assert.fail('Couldn\'t get Application node.');
      }
    });
  });

  context('given: a config with various expressions and expression groups', () => {
    it('should: evaluate all built expressions"', () => {
      const applicationNode = xp.select('/Application', document, true);

      if (applicationNode instanceof Node) {
        const expressions = builder.buildExpressions(applicationNode);

        R.forEach((expressionName: string) => {
          const expression = builder.evaluate(expressionName, expressions);

          const regexpObj = expression.$regexp;
          expect(regexpObj).to.be.a('regexp');

          const source = regexpObj.source;
          expect(source).to.be.a('string');
        })(R.keys(expressions) as string[]);
      } else {
        assert.fail('Couldn\'t get Application node.');
      }
    });
  });
}); // expression-builder (test config)
