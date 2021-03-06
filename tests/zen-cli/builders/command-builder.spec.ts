import { expect, assert, use } from 'chai';
import * as xp from 'xpath-ts';
import * as R from 'ramda';
import { DOMParserImpl as Parser } from 'xmldom-ts';
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
import * as build from '../../../lib/zen-cli/builders/command-builder.class';
import * as helpers from '../../../lib/utils/helpers';
import * as types from '../../../lib/types';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
const parser = new Parser();

describe('Command builder', () => {
  let converter: jaxom.IConverter;
  let document: Node;
  let commandsNode: Node;
  let builder: build.CommandBuilder;
  let specSvc: jaxom.ISpecService;
  const parseInfo: jaxom.IParseInfo = {
    elements: new Map<string, jaxom.IElementInfo>([
      [
        'Commands',
        {
          descendants: {
            by: 'index',
            id: 'name',
            throwIfCollision: true,
            throwIfMissing: true
          }
        }
      ],
      [
        'Command',
        {
          id: 'name',
          recurse: 'inherits',
          discards: ['inherits', 'abstract']
        }
      ],
      [
        'Options',
        {
          descendants: {
            by: 'index',
            id: 'name',
            throwIfCollision: true,
            throwIfMissing: true
          }
        }
      ],
      [
        'OptionRef',
        {
          id: 'name'
        }
      ]
    ])
  };

  beforeEach(() => {
    converter = new jaxom.XpathConverter();
  });

  function init (d: string): void {
    document = parser.parseFromString(d);
    const selectResult = xp.select('/Application/Cli/Commands', document, true);
    if (selectResult instanceof Node) {
      commandsNode = selectResult;
    } else {
      assert.fail("Couldn't get Commands Node");
    }
    specSvc = new jaxom.SpecOptionService();
    builder = new build.CommandBuilder(
      converter,
      specSvc,
      parseInfo,
      helpers.Selectors
    );
  }

  context(
    'given: a built command with at least 1 unresolvable OptionRef',
    () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Options>
              <Option name="loglevel" alias="lgl" optional="true"
                describe="Level of logging to be performed. Valid settings: info,debug (... blah all the standard ones!)">
              </Option>
              <Option name="logfile" alias="lf" optional="true" default="~/pez/pez.log.<dd-mmm-yyyy>.log"
                describe="Full path to the logfile name. Can include standard time/date variables inside.">
              </Option>
            </Options>
            <Commands>
              <Command name="base-command" abstract="true" source="filesystem-source">
                <Options>
                  <OptionRef name="loglevel"/>
                  <OptionRef name="logfile"/>
                </Options>
              </Command>
              <Command name="rename"
                describe="Rename albums according to options specified (write)."
                inherits="base-command">
                <Options>
                  <OptionRef name="missing"/>
                </Options>
              </Command>
            </Commands>
          </Cli>
        </Application>`;
        init(data);
        expect(() => {
          builder.buildCommands(commandsNode);
        }).to.throw();
      });
    }
  );

  context('given: a command defined as abstract has a description', () => {
    it('should: throw', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="invalid-command" abstract="true"
                describe="this description not permitted on abstract command">
              </Command>
            </Commands>
          </Cli>
        </Application>`;
      init(data);

      expect(() => {
        builder.buildCommands(commandsNode);
      }).to.throw();
    });
  });

  context(
    'given: a rename command, inherits from 3 commands, OptionRefs and OptionGroups',
    () => {
      it('should: return an object with children constituents normalised.', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Options type="string">
                  <Option name="filesys" alias="fs" optional="true"
                    describe="The file system as defined in config as FileSystem">
                  </Option>

                  <Option name="path" alias="p" optional="true"
                    describe="Full path. The path specified has the highest priority.">
                  </Option>

                  <Option name="tree" alias="t" optional="true"
                    describe="Tree as defined in config under a FileSystem as alias">
                  </Option>

                  <Option name="producer" alias="pr" optional="true"
                    describe="Producer name">
                  </Option>

                  <Option name="director" alias="dn" optional="true"
                    describe="Director name">
                  </Option>

                  <Option name="loglevel" alias="lgl" optional="true"
                    describe="Level of logging to be performed. Valid settings: info,debug (... blah all the standard ones!)">
                  </Option>

                  <Option name="logfile" alias="lf" optional="true" default="~/pez/pez.log.<dd-mmm-yyyy>.log"
                    describe="Full path to the logfile name. Can include standard time/date variables inside.">
                  </Option>

                  <Option name="with" alias="wi"
                    describe="New value.">
                  </Option>

                  <Option name="put" alias="pu" type="switch"
                    describe="Insert new field if it doesn't exist. (Like put http verb)  switch.">
                  </Option>
                </Options>
                <Command name="base-command" abstract="true" source="filesystem-source">
                  <Options>
                    <OptionRef name="loglevel"/>
                    <OptionRef name="logfile"/>
                  </Options>
                  <OptionGroups>
                    <Conflicts>
                      <OptionRef name="loglevel"/>
                      <OptionRef name="logfile"/>
                    </Conflicts>
                  </OptionGroups>
                </Command>
                <Command name="domain-command" abstract="true">
                  <Options>
                    <OptionRef name="producer"/>
                    <OptionRef name="director"/>
                  </Options>
                  <OptionGroups>
                    <Implies>
                      <OptionRef name="incname"/>
                      <OptionRef name="studioname"/>
                    </Implies>
                    <Conflicts>
                      <OptionRef name="producer"/>
                      <OptionRef name="director"/>
                    </Conflicts>
                  </OptionGroups>
                </Command>
                <Command name="uni-command" abstract="true">
                  <Options>
                    <OptionRef name="path"/>
                    <OptionRef name="filesys"/>
                    <OptionRef name="tree"/>
                  </Options>
                </Command>
                <Command name="rename"
                  describe="Rename albums according to options specified (write)."
                  inherits="base-command,domain-command,uni-command">
                  <Options>
                    <OptionRef name="with"/>
                    <OptionRef name="put"/>
                  </Options>
                </Command>
              </Commands>
            </Cli>
          </Application>`;
        init(data);

        const commands = builder.buildCommands(commandsNode);
        const renameCommand = commands[0];
        expect(renameCommand).to.deep.equal({
          name: 'rename',
          source: 'filesystem-source',
          _: 'Command',
          _children: [
            {
              _: 'Options',
              _children: {
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
                path: {
                  name: 'path',
                  alias: 'p',
                  optional: true,
                  describe:
                    'Full path. The path specified has the highest priority.',
                  _: 'Option'
                },
                filesys: {
                  name: 'filesys',
                  alias: 'fs',
                  optional: true,
                  describe:
                    'The file system as defined in config as FileSystem',
                  _: 'Option'
                },
                tree: {
                  name: 'tree',
                  alias: 't',
                  optional: true,
                  describe:
                    'Tree as defined in config under a FileSystem as alias',
                  _: 'Option'
                }
              }
            },
            {
              _: 'OptionGroups',
              _children: [
                {
                  _: 'Conflicts',
                  _children: [
                    { name: 'loglevel', _: 'OptionRef' },
                    { name: 'logfile', _: 'OptionRef' }
                  ]
                },
                {
                  _: 'Implies',
                  _children: [
                    { name: 'incname', _: 'OptionRef' },
                    { name: 'studioname', _: 'OptionRef' }
                  ]
                },
                {
                  _: 'Conflicts',
                  _children: [
                    { name: 'producer', _: 'OptionRef' },
                    { name: 'director', _: 'OptionRef' }
                  ]
                }
              ]
            }
          ],
          describe: 'Rename albums according to options specified (write).'
        });
      });
    }
  );

  describe('command-builder: buildCommands', () => {
    context('given: a command defined as abstract has a description', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="invalid-command" abstract="true"
                  describe="this description not permitted on abstract command">
                </Command>
              </Commands>
            </Cli>
          </Application>`;
        init(data);

        const document = parser.parseFromString(data);
        const commandsNode = xp.select(
          '/Application/Cli/Commands',
          document,
          true
        );

        if (commandsNode instanceof Node) {
          expect(() => {
            builder.buildCommands(commandsNode);
          }).to.throw(Error);
        } else {
          assert.fail("Couldn't get Commands node.");
        }
      });
    });
  }); // command-builder: buildCommands

  context('command-builder: buildNamedCommand (single)', () => {
    context('given: a command requested', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="rename"
                describe="Rename albums according to options specified (write).">
                <Options>
                  <OptionRef name="with"/>
                  <OptionRef name="put"/>
                </Options>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      it('should: build a single command', () => {
        init(data);

        const commands = builder.buildNamedCommand('rename', commandsNode);
        const renameCommand = commands[0];
        const result = R.where(
          {
            name: R.equals('rename'),
            _: R.equals('Command'),
            _children: R.is(Array)
          },
          renameCommand
        );
        expect(result).to.be.true(
          `Failed "rename" command: "${functify(renameCommand)}"`
        );
      });
    });
  }); // command-builder: buildNamedCommand (single)

  context('given: a command with an unknown "name"', () => {
    it('should: throw', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="rename"
                describe="Rename albums according to options specified (write).">
                <Options>
                  <OptionRef name="with"/>
                  <OptionRef name="put"/>
                </Options>
              </Command>
            </Commands>
          </Cli>
        </Application>`;
      init(data);

      expect(() => {
        builder.buildNamedCommand('unicorns', commandsNode);
      }).to.throw();
    });
  }); // a command with an unknown "name"

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
              <Commands>
                <Options>
                  <Option name="path" alias="p" optional="true"
                    describe="Full path">
                  </Option>
                  <Option name="path" alias="p" optional="true"
                    describe="Full path (DUPLICATE)">
                  </Option>
                </Options>
                <Command name="rename"
                  describe="Rename albums according to arguments specified (write).">
                  <Options>
                    <OptionRef name="path"/>
                  </Options>
                </Command>
              </Commands>
            </Cli>
          </Application>`
      },
      {
        given: 'missing @name attribute',
        data: `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Options>
                  <Option alias="p" optional="true"
                    describe="Full path">
                  </Option>
                </Options>
              </Commands>
            </Cli>
          </Application>`
      }
    ];

    tests.forEach((t: IUnitTestInfo) => {
      context(`given: ${t.given}`, () => {
        it('should: throw', () => {
          const document = parser.parseFromString(t.data);
          const commandsNode = xp.select(
            '/Application/Cli/Commands',
            document,
            true
          );

          if (commandsNode instanceof Node) {
            expect(() => {
              builder.buildCommands(commandsNode);
            }).to.throw();
          } else {
            assert.fail("Couldn't get Commands node.");
          }
        });
      });
    });
  });
}); // Command builder

function invoke (xpath: types.ISelectors): void {
  const data = `<?xml version="1.0"?>
    <Application name="pez">
      <Cli>
        <Commands>
          <Command name="base-command" abstract="true" source="filesystem-source">
            <Options>
              <OptionRef name="loglevel"/>
              <OptionRef name="logfile"/>
            </Options>
          </Command>
          <Command name="rename"
            describe="Rename albums according to options specified (write)."
            inherits="base-command">
            <Options>
              <OptionRef name="missing"/>
            </Options>
          </Command>
        </Commands>
      </Cli>
    </Application>`;

  const query = '/Application/Cli/Commands';
  const document = parser.parseFromString(data);

  xpath.select(query, document);
  xpath.selectById('Command', 'name', 'rename', document);
}

describe('dual fn interface', () => {
  it('ISelector', () => {
    invoke(helpers.Selectors);
  });
});
