
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
import * as build from '../../../lib/cli/builders/argument-builder.class';
import * as types from '../../../lib/types';

const parseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    ['Arguments', {
      descendants: {
        by: 'index',
        id: 'name',
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['Argument', {
      id: 'name'
    }]
  ])
};

describe('Argument builder', () => {
  // Its much more work and complicated to stub out jaxom with sinon,
  // rather than use it. Just more practical to use jaxom directly.
  //
  let converter: jaxom.IConverter;
  let builder: build.ArgumentBuilder;

  beforeEach(() => {

    converter = new jaxom.XpathConverter();
    builder = new build.ArgumentBuilder(converter, parseInfo);
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
        const argumentDefs: types.StringIndexableObj = builder.buildArguments(argumentsNode);
        expect(argumentDefs).to.deep.equal({
          _: 'Arguments',
          _children: {
            director: {
              name: 'director',
              alias: 'dn',
              optional: true,
              describe: 'Director name',
              _: 'Argument'
            }
          }
        });
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
              builder.buildArguments(argumentsNode);
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
        const builder = new build.ArgumentBuilder(converter, parseInfo);
        const argumentDefs = builder.buildArguments(argumentsNode);

        expect(argumentDefs).to.deep.equal({
          type: 'string',
          _: 'Arguments',
          _children: {
            filesys: {
              name: 'filesys',
              alias: 'fs',
              optional: true,
              describe: 'The file system as defined in config as FileSystem',
              _: 'Argument'
            },
            path: {
              name: 'path',
              alias: 'p',
              optional: true,
              describe:
                'Full path. The path specified has the highest priority.',
              _: 'Argument'
            },
            from: {
              name: 'from',
              alias: 'fr',
              optional: true,
              describe: 'Full source path. Must be specified with to',
              _: 'Argument'
            },
            to: {
              name: 'to',
              optional: true,
              describe: 'Full destination path. Must be specified with from',
              _: 'Argument'
            },
            tree: {
              name: 'tree',
              alias: 't',
              optional: true,
              describe: 'Tree as defined in config under a FileSystem as alias',
              _: 'Argument'
            },
            filter: {
              name: 'filter',
              alias: 'fi',
              optional: true,
              describe:
                'The filter (specified as a glob), is applied to incoming directories',
              _: 'Argument'
            },
            name: {
              name: 'name',
              alias: 'n',
              optional: true,
              describe: 'Full name',
              _: 'Argument'
            },
            incname: {
              name: 'incname',
              alias: 'in',
              optional: true,
              describe: 'Incorporation name',
              _: 'Argument'
            },
            producer: {
              name: 'producer',
              alias: 'pr',
              optional: true,
              describe: 'Producer name',
              _: 'Argument'
            },
            director: {
              name: 'director',
              alias: 'dn',
              optional: true,
              describe: 'Director name',
              _: 'Argument'
            },
            member: {
              name: 'member',
              alias: 'me',
              optional: true,
              describe: 'members 1 to 4',
              _: 'Argument'
            },
            header: {
              name: 'header',
              alias: 'hdr',
              optional: true,
              describe: 'Header, has no influence on the naming of content.',
              _: 'Argument'
            },
            genre: {
              name: 'genre',
              alias: 'gen',
              optional: true,
              choice: 'alt-rock,blues,prog-rock,rock,metal,thrash,pop,indie',
              describe:
                'Album genre (alt-rock|blues|prog-rock|rock|metal|thrash|pop|indie)',
              _: 'Argument'
            },
            location: {
              name: 'location',
              alias: 'loc',
              optional: true,
              describe: 'Recording location',
              _: 'Argument'
            },
            studio: {
              name: 'studio',
              alias: 'sn',
              optional: true,
              describe: 'Recording studio',
              _: 'Argument'
            },
            composer: {
              name: 'composer',
              alias: 'cn',
              optional: true,
              describe: 'Composer name',
              _: 'Argument'
            },
            catalog: {
              name: 'catalog',
              alias: 'cat',
              optional: true,
              describe: 'The catalog number',
              _: 'Argument'
            },
            barcode: {
              name: 'barcode',
              alias: 'bc',
              optional: true,
              describe: 'The barcode',
              _: 'Argument'
            },
            release: {
              name: 'release',
              alias: 'rel',
              optional: true,
              describe: 'Album release',
              _: 'Argument'
            },
            whatif: {
              name: 'whatif',
              alias: 'wh',
              type: 'switch',
              describe: 'Dry run the command only.',
              _: 'Argument'
            },
            loglevel: {
              name: 'loglevel',
              alias: 'lgl',
              optional: true,
              describe:
                'Level of logging to be performed. Valid settings: info,debug (... blah all the standard ones!)',
              _: 'Argument'
            },
            logfile: {
              name: 'logfile',
              alias: 'lf',
              optional: true,
              default: '~/pez/pez.log.<dd-mmm-yyyy>.log',
              describe:
                'Full path to the logfile name. Can include standard time/date variables inside.',
              _: 'Argument'
            },
            meta: {
              name: 'meta',
              alias: 'me',
              type: 'switch',
              describe: 'Apply operation to meta files only.',
              _: 'Argument'
            },
            content: {
              name: 'content',
              alias: 'co',
              type: 'switch',
              describe: 'Apply operation to content files only.',
              _: 'Argument'
            },
            select: {
              name: 'select',
              alias: 'se',
              optional: true,
              default: 'folder',
              describe: 'Select fields in the output, expressed as a csv.',
              _: 'Argument'
            },
            genundo: {
              name: 'genundo',
              alias: 'gu',
              default: false,
              type: 'switch',
              describe: 'Generate Undo Script.',
              _: 'Argument'
            },
            expr: {
              name: 'expr',
              alias: 'ex',
              describe: "The regular expression(Expression) 'name' to test.",
              _: 'Argument'
            },
            input: {
              name: 'input',
              alias: 'i',
              describe:
                'Input string to test against the regular expression specified.',
              _: 'Argument'
            },
            config: {
              name: 'config',
              alias: 'cfg',
              type: 'switch',
              describe: 'Check config switch.',
              _: 'Argument'
            },
            cli: {
              name: 'cli',
              alias: 'cl',
              type: 'switch',
              describe: 'Check dynamic cli definitions switch.',
              _: 'Argument'
            },
            repl: {
              name: 'repl',
              alias: 're',
              describe: 'Existing value in field to replace.',
              _: 'Argument'
            },
            with: {
              name: 'with',
              alias: 'wi',
              describe: 'New value.',
              _: 'Argument'
            },
            put: {
              name: 'put',
              alias: 'pu',
              type: 'switch',
              describe:
                "Insert new field if it doesn't exist. (Like put http verb)  switch.",
              _: 'Argument'
            }
          }
        });
      }
    });
  });
}); // Argument builder from config
