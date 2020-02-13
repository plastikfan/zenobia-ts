
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
import * as build from '../../../lib/cli/builders/option-builder.class';
import * as types from '../../../lib/types';

const parseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    ['Options', {
      descendants: {
        by: 'index',
        id: 'name',
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['Option', {
      id: 'name'
    }]
  ])
};

describe('Option builder', () => {
  // Its much more work and complicated to stub out jaxom with sinon,
  // rather than use it. Just more practical to use jaxom directly.
  //
  let converter: jaxom.IConverter;
  let builder: build.ArgumentBuilder;

  beforeEach(() => {

    converter = new jaxom.XpathConverter();
    builder = new build.ArgumentBuilder(converter, parseInfo);
  });

  context('given: a correctly defined option', () => {
    it('should: build options successfully', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Options>
              <Option name="director" alias="dn" optional="true"
                describe="Director name">
              </Option>
            </Options>
          </Cli>
        </Application>`;

      const document = parser.parseFromString(data);
      const optionsNode = xp.select(
        '/Application/Cli/Options',
        document,
        true
      );

      if (optionsNode instanceof Node) {
        const optionDefs: types.StringIndexableObj = builder.buildOptions(optionsNode);
        expect(optionDefs).to.deep.equal({
          _: 'Options',
          _children: {
            director: {
              name: 'director',
              alias: 'dn',
              optional: true,
              describe: 'Director name',
              _: 'Option'
            }
          }
        });
      } else {
        assert.fail("Couldn't get Options node.");
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
        given: 'Option definition with duplicated entry',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Options>
                <Option name="path" alias="p" optional="true"
                  describe="Full path">
                </Option>
                <Option name="path" alias="p" optional="true"
                  describe="Full path (DUPLICATE)">
                </Option>
              </Options>
            </Cli>
          </Application>`
      },
      {
        given: 'missing @name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Options>
                <Option alias="p" optional="true"
                  describe="Full path">
                </Option>
              </Options>
            </Cli>
          </Application>`
      }
    ];

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: throw', () => {
          const document = parser.parseFromString(t.data);
          const optionsNode = xp.select(
            '/Application/Cli/Options',
            document,
            true
          );

          if (optionsNode instanceof Node) {
            expect(() => {
              builder.buildOptions(optionsNode);
            }).to.throw();
          } else {
            assert.fail("Couldn't get Options node.");
          }
        });
      });
    });
  });
}); // Option builder

describe('Option builder from config', () => {
  context('given: valid xml config', () => {
    it('should: build Options successfully', () => {
      const data = Helpers.read(
        path.resolve(
          __dirname,
          './app.zenobia.option-builder.test.config.xml'
        )
      );
      const document = parser.parseFromString(data);
      const optionsNode = xp.select(
        '/Application/Cli/Options',
        document,
        true
      );

      if (optionsNode instanceof Node) {
        const converter = new jaxom.XpathConverter();
        const builder = new build.ArgumentBuilder(converter, parseInfo);
        const optionDefs = builder.buildOptions(optionsNode);

        expect(optionDefs).to.deep.equal({
          type: 'string',
          _: 'Options',
          _children: {
            filesys: {
              name: 'filesys',
              alias: 'fs',
              optional: true,
              describe: 'The file system as defined in config as FileSystem',
              _: 'Option'
            },
            path: {
              name: 'path',
              alias: 'p',
              optional: true,
              describe:
                'Full path. The path specified has the highest priority.',
              _: 'Option'
            },
            from: {
              name: 'from',
              alias: 'fr',
              optional: true,
              describe: 'Full source path. Must be specified with to',
              _: 'Option'
            },
            to: {
              name: 'to',
              optional: true,
              describe: 'Full destination path. Must be specified with from',
              _: 'Option'
            },
            tree: {
              name: 'tree',
              alias: 't',
              optional: true,
              describe: 'Tree as defined in config under a FileSystem as alias',
              _: 'Option'
            },
            filter: {
              name: 'filter',
              alias: 'fi',
              optional: true,
              describe:
                'The filter (specified as a glob), is applied to incoming directories',
              _: 'Option'
            },
            name: {
              name: 'name',
              alias: 'n',
              optional: true,
              describe: 'Full name',
              _: 'Option'
            },
            incname: {
              name: 'incname',
              alias: 'in',
              optional: true,
              describe: 'Incorporation name',
              _: 'Option'
            },
            producer: {
              name: 'producer',
              alias: 'pr',
              optional: true,
              describe: 'Producer name',
              _: 'Option'
            },
            director: {
              name: 'director',
              alias: 'dn',
              optional: true,
              describe: 'Director name',
              _: 'Option'
            },
            member: {
              name: 'member',
              alias: 'me',
              optional: true,
              describe: 'members 1 to 4',
              _: 'Option'
            },
            header: {
              name: 'header',
              alias: 'hdr',
              optional: true,
              describe: 'Header, has no influence on the naming of content.',
              _: 'Option'
            },
            genre: {
              name: 'genre',
              alias: 'gen',
              optional: true,
              choice: 'alt-rock,blues,prog-rock,rock,metal,thrash,pop,indie',
              describe:
                'Album genre (alt-rock|blues|prog-rock|rock|metal|thrash|pop|indie)',
              _: 'Option'
            },
            location: {
              name: 'location',
              alias: 'loc',
              optional: true,
              describe: 'Recording location',
              _: 'Option'
            },
            studio: {
              name: 'studio',
              alias: 'sn',
              optional: true,
              describe: 'Recording studio',
              _: 'Option'
            },
            composer: {
              name: 'composer',
              alias: 'cn',
              optional: true,
              describe: 'Composer name',
              _: 'Option'
            },
            catalog: {
              name: 'catalog',
              alias: 'cat',
              optional: true,
              describe: 'The catalog number',
              _: 'Option'
            },
            barcode: {
              name: 'barcode',
              alias: 'bc',
              optional: true,
              describe: 'The barcode',
              _: 'Option'
            },
            release: {
              name: 'release',
              alias: 'rel',
              optional: true,
              describe: 'Album release',
              _: 'Option'
            },
            whatif: {
              name: 'whatif',
              alias: 'wh',
              type: 'switch',
              describe: 'Dry run the command only.',
              _: 'Option'
            },
            loglevel: {
              name: 'loglevel',
              alias: 'lgl',
              optional: true,
              describe:
                'Level of logging to be performed. Valid settings: info,debug (... blah all the standard ones!)',
              _: 'Option'
            },
            logfile: {
              name: 'logfile',
              alias: 'lf',
              optional: true,
              default: '~/pez/pez.log.<dd-mmm-yyyy>.log',
              describe:
                'Full path to the logfile name. Can include standard time/date variables inside.',
              _: 'Option'
            },
            meta: {
              name: 'meta',
              alias: 'me',
              type: 'switch',
              describe: 'Apply operation to meta files only.',
              _: 'Option'
            },
            content: {
              name: 'content',
              alias: 'co',
              type: 'switch',
              describe: 'Apply operation to content files only.',
              _: 'Option'
            },
            select: {
              name: 'select',
              alias: 'se',
              optional: true,
              default: 'folder',
              describe: 'Select fields in the output, expressed as a csv.',
              _: 'Option'
            },
            genundo: {
              name: 'genundo',
              alias: 'gu',
              default: false,
              type: 'switch',
              describe: 'Generate Undo Script.',
              _: 'Option'
            },
            expr: {
              name: 'expr',
              alias: 'ex',
              describe: "The regular expression(Expression) 'name' to test.",
              _: 'Option'
            },
            input: {
              name: 'input',
              alias: 'i',
              describe:
                'Input string to test against the regular expression specified.',
              _: 'Option'
            },
            config: {
              name: 'config',
              alias: 'cfg',
              type: 'switch',
              describe: 'Check config switch.',
              _: 'Option'
            },
            cli: {
              name: 'cli',
              alias: 'cl',
              type: 'switch',
              describe: 'Check dynamic cli definitions switch.',
              _: 'Option'
            },
            repl: {
              name: 'repl',
              alias: 're',
              describe: 'Existing value in field to replace.',
              _: 'Option'
            },
            with: {
              name: 'with',
              alias: 'wi',
              describe: 'New value.',
              _: 'Option'
            },
            put: {
              name: 'put',
              alias: 'pu',
              type: 'switch',
              describe:
                "Insert new field if it doesn't exist. (Like put http verb)  switch.",
              _: 'Option'
            }
          }
        });
      }
    });
  });
}); // Option builder from config
