
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as path from 'path';
import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();

import * as Helpers from '../../test-helpers';
import { buildArguments } from '../../../lib/cli/builders/argument-builder';

describe('Argument builder', () => {
  // Its much more work and complicated to stub out jaxom with sinon,
  // rather than use it. Just more practical to use jaxom directly.
  //
  let converter: jaxom.IConverter;

  beforeEach(() => {
    converter = new jaxom.XpathConverter();
  });

  context('given: a correctly defined argument', () => {
    it('should: build arguments successfully', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Arguments>
              <Argument name="director" alias="dn" optional="true"
                describe="Director name">
              </Argument>
            </Arguments>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const argumentsNode = xp.select(
        '/Application/Cli/Arguments',
        document,
        true
      );

      if (argumentsNode instanceof Node) {
        const argumentDefs = buildArguments(converter, argumentsNode);

        if (argumentDefs) {
          const children: { [key: string]: any } = R.prop('_children')(
            argumentDefs
          );
          const directorArg: any = children['director'];
          const result = R.whereEq({
            _: 'Argument',
            name: 'director',
            alias: 'dn',
            optional: true,
            describe: 'Director name'
          })(directorArg);
          expect(result).to.be.true();
        } else {
          assert.fail('Built Arguments is empty');
        }
      } else {
        assert.fail("Couldn't get Arguments node.");
      }
    });
  });

  context('Error handling', () => {
    interface IUnitTestInfo {
      given: string;
      data: string;
    }

    const tests: IUnitTestInfo[] = [
      {
        given: 'Argument definition with duplicated entry',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Arguments>
                <Argument name="path" alias="p" optional="true"
                  describe="Full path">
                </Argument>
                <Argument name="path" alias="p" optional="true"
                  describe="Full path (DUPLICATE)">
                </Argument>
              </Arguments>
            </Cli>
          </Application>`
      },
      {
        given: 'missing @name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Arguments>
                <Argument alias="p" optional="true"
                  describe="Full path">
                </Argument>
              </Arguments>
            </Cli>
          </Application>`
      }
    ];

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: throw', () => {
          const document = parser.parseFromString(t.data);
          const argumentsNode = xp.select(
            '/Application/Cli/Arguments',
            document,
            true
          );

          if (argumentsNode instanceof Node) {
            expect(() => {
              buildArguments(converter, argumentsNode);
            }).to.throw();
          } else {
            assert.fail("Couldn't get Arguments node.");
          }
        });
      });
    });
  });
}); // Argument builder

describe('Argument builder from config', () => {
  context('given: valid xml config', () => {
    it('should: build Arguments successfully', () => {
      const data = Helpers.read(
        path.resolve(
          __dirname,
          './app.zenobia.argument-builder.test.config.xml'
        )
      );
      const document = parser.parseFromString(data);
      const argumentsNode = xp.select(
        '/Application/Cli/Arguments',
        document,
        true
      );

      if (argumentsNode instanceof Node) {
        const converter = new jaxom.XpathConverter();
        const argumentDefs = buildArguments(converter, argumentsNode);

        // const ARGUMENT_DEFS = {
        //   type: 'string',
        //   _: 'Arguments',
        //   _children: {
        //     filesys: {
        //       name: 'filesys',
        //       alias: 'fs',
        //       optional: true,
        //       describe: 'The file system as defined in config as FileSystem',
        //       _: 'Argument'
        //     },
        //     path: {
        //       name: 'path',
        //       alias: 'p',
        //       optional: true,
        //       describe:
        //         'Full path. The path specified has the highest priority.',
        //       _: 'Argument'
        //     },

        // ...

        //     put: {
        //       name: 'put',
        //       alias: 'pu',
        //       type: 'switch',
        //       describe:
        //         "Insert new field if it doesn't exist. (Like put http verb)  switch.",
        //       _: 'Argument'
        //     }
        //   }
        // };

        if (argumentDefs) {
          const children: { [key: string]: any } = R.prop('_children')(argumentDefs);
          if (children) {
            const filesysArg = children['filesys'];
            const filesysResult = R.whereEq({
              _: 'Argument',
              name: 'filesys',
              alias: 'fs',
              optional: true,
              describe: 'The file system as defined in config as FileSystem'
            })(filesysArg);
            expect(filesysResult).to.be.true(functify(filesysResult));
          } else {
            assert.fail('Couldn\'t get children from Arguments');
          }
        } else {
          assert.fail('Failed to build Arguments');
        }
      }
    });
  });
}); // Argument builder from config
