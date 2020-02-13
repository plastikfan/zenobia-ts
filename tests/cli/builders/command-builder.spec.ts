import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as xp from 'xpath-ts';
import * as R from 'ramda';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
import * as build from '../../../lib/cli/builders/command-builder.class';
import * as helpers from '../../../lib/utils/helpers';
import * as types from '../../../lib/types';

const ComplexNormalisedArgumentDefs = {
  _: 'ArgumentDefs',
  _children: {
    name: {
      name: 'name',
      alias: 'n',
      optional: 'true',
      describe: 'Album name',
      _: 'Argument'
    },
    incname: {
      name: 'incname',
      alias: 'in',
      optional: 'true',
      describe: 'Incorporation name',
      _: 'Argument'
    },
    studioname: {
      name: 'studioname',
      alias: 'sn',
      optional: 'true',
      describe: 'Studio name',
      _: 'Argument'
    },
    labelname: {
      name: 'labelname',
      alias: 'ln',
      optional: 'true',
      describe: 'Record label name',
      _: 'Argument'
    },
    header: {
      name: 'header',
      alias: 'hdr',
      optional: 'true',
      describe: 'Header, has no influence on the naming of content.',
      _: 'Argument'
    },
    producer: {
      name: 'producer',
      alias: 'pn',
      optional: 'true',
      describe: 'Producer name',
      _: 'Argument'
    },
    director: {
      name: 'director',
      alias: 'dn',
      optional: 'true',
      describe: 'Director name',
      _: 'Argument'
    },
    filesys: {
      name: 'filesys',
      alias: 'fs',
      optional: 'true',
      describe: 'The file system as defined in config as FileSystem',
      _: 'Argument'
    },
    path: {
      name: 'path',
      alias: 'p',
      optional: 'true',
      describe: 'Full path.',
      _: 'Argument'
    },
    tree: {
      name: 'tree',
      alias: 't',
      optional: 'true',
      describe: 'File system tree',
      _: 'Argument'
    },
    with: {
      name: 'with',
      alias: 'w',
      optional: 'true',
      describe: 'replace with',
      _: 'Argument'
    },
    put: {
      name: 'put',
      alias: 'pu',
      optional: 'true',
      describe: 'update existing',
      _: 'Argument'
    },
    loglevel: {
      name: 'loglevel',
      alias: 'll',
      optional: 'true',
      describe: 'the logging level',
      _: 'Argument'
    },
    logfile: {
      name: 'logfile',
      alias: 'lf',
      optional: 'true',
      describe: 'the file full path',
      _: 'Argument'
    }
  }
};

describe('Command builder', () => {
  let converter: jaxom.IConverter;
  let document: Node;
  let commandsNode: Node;
  let builder: build.CommandBuilder;
  let specSvc: jaxom.ISpecService;
  const parseInfo: jaxom.IParseInfo = {
    elements: new Map<string, jaxom.IElementInfo>([
      ['Commands', {
        descendants: {
          by: 'index',
          id: 'name',
          throwIfCollision: true,
          throwIfMissing: true
        }
      }],
      ['Command', {
        id: 'name',
        recurse: 'inherits',
        discards: ['inherits', 'abstract']
      }],
      ['Options', {
        descendants: {
          by: 'index',
          id: 'name',
          throwIfCollision: true,
          throwIfMissing: true
        }
      }],
      ['OptionRef', {
        id: 'name'
      }]
    ])
  };

  beforeEach(() => {
    converter = new jaxom.XpathConverter();
  });

  function init (d: string): void {
    document = parser.parseFromString(d);
    const selectResult = xp.select(
      '/Application/Cli/Commands',
      document,
      true
    );
    if (selectResult instanceof Node) {
      commandsNode = selectResult;
    } else {
      assert.fail("Couldn't get Commands Node");
    }
    specSvc = new jaxom.SpecOptionService();
    builder = new build.CommandBuilder(converter, specSvc, parseInfo,
      helpers.Selectors);
  }

  context('resolveArguments', () => {
    context('given: a built command with at least 1 unresolvable OptionRef', () => {
      it('should: throw', () => {
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
                  describe="Rename albums according to arguments specified (write)."
                  inherits="base-command">
                  <Options>
                    <OptionRef name="missing"/>
                  </Options>
                </Command>
              </Commands>
            </Cli>
          </Application>`;
        init(data);

        const commands = builder.buildCommands(commandsNode);
        expect(() => {
          builder.resolveCommandArguments(commands, {
            commandArguments: ComplexNormalisedArgumentDefs
          });
        }).to.throw();
      });
    });
  }); // command-builder.resolveArguments

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

  context('given: a rename command, inherits from 3 commands, OptionRefs and ArgumentGroups', () => {
    it('should: return an object with children constituents normalised.', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="base-command" abstract="true" source="filesystem-source">
                <Options>
                  <OptionRef name="loglevel"/>
                  <OptionRef name="logfile"/>
                </Options>
                <ArgumentGroups>
                  <Conflicts>
                    <OptionRef name="loglevel"/>
                    <OptionRef name="logfile"/>
                  </Conflicts>
                </ArgumentGroups>
              </Command>
              <Command name="domain-command" abstract="true">
                <Options>
                  <OptionRef name="name"/>
                  <OptionRef name="labelname"/>
                  <OptionRef name="incname"/>
                  <OptionRef name="studioname"/>
                  <OptionRef name="header"/>
                  <OptionRef name="producer"/>
                  <OptionRef name="director"/>
                </Options>
                <ArgumentGroups>
                  <Conflicts>
                    <OptionRef name="name"/>
                    <OptionRef name="labelname"/>
                  </Conflicts>
                  <Implies>
                    <OptionRef name="incname"/>
                    <OptionRef name="studioname"/>
                  </Implies>
                  <Conflicts>
                    <OptionRef name="header"/>
                    <OptionRef name="producer"/>
                    <OptionRef name="director"/>
                  </Conflicts>
                </ArgumentGroups>
              </Command>
              <Command name="uni-command" abstract="true">
                <Options>
                  <OptionRef name="path"/>
                  <OptionRef name="filesys"/>
                  <OptionRef name="tree"/>
                </Options>
              </Command>
              <Command name="rename"
                describe="Rename albums according to arguments specified (write)."
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
      const normalisedCommands = builder.resolveCommandArguments(commands, {
        commandArguments: ComplexNormalisedArgumentDefs
      });
      const normalisedRenameCommand = normalisedCommands[0];

      expect(normalisedRenameCommand).to.deep.equal({
        name: 'rename',
        source: 'filesystem-source',
        _: 'Command',
        _children: [
          {
            _: 'Options',
            _children: {
              with: {
                name: 'with',
                alias: 'w',
                optional: 'true',
                describe: 'replace with',
                _: 'Argument'
              },
              put: {
                name: 'put',
                alias: 'pu',
                optional: 'true',
                describe: 'update existing',
                _: 'Argument'
              },
              loglevel: {
                name: 'loglevel',
                alias: 'll',
                optional: 'true',
                describe: 'the logging level',
                _: 'Argument'
              },
              logfile: {
                name: 'logfile',
                alias: 'lf',
                optional: 'true',
                describe: 'the file full path',
                _: 'Argument'
              },
              name: {
                name: 'name',
                alias: 'n',
                optional: 'true',
                describe: 'Album name',
                _: 'Argument'
              },
              labelname: {
                name: 'labelname',
                alias: 'ln',
                optional: 'true',
                describe: 'Record label name',
                _: 'Argument'
              },
              incname: {
                name: 'incname',
                alias: 'in',
                optional: 'true',
                describe: 'Incorporation name',
                _: 'Argument'
              },
              studioname: {
                name: 'studioname',
                alias: 'sn',
                optional: 'true',
                describe: 'Studio name',
                _: 'Argument'
              },
              header: {
                name: 'header',
                alias: 'hdr',
                optional: 'true',
                describe: 'Header, has no influence on the naming of content.',
                _: 'Argument'
              },
              producer: {
                name: 'producer',
                alias: 'pn',
                optional: 'true',
                describe: 'Producer name',
                _: 'Argument'
              },
              director: {
                name: 'director',
                alias: 'dn',
                optional: 'true',
                describe: 'Director name',
                _: 'Argument'
              },
              path: {
                name: 'path',
                alias: 'p',
                optional: 'true',
                describe: 'Full path.',
                _: 'Argument'
              },
              filesys: {
                name: 'filesys',
                alias: 'fs',
                optional: 'true',
                describe: 'The file system as defined in config as FileSystem',
                _: 'Argument'
              },
              tree: {
                name: 'tree',
                alias: 't',
                optional: 'true',
                describe: 'File system tree',
                _: 'Argument'
              }
            }
          },
          {
            _: 'ArgumentGroups',
            _children: [
              {
                _: 'Conflicts',
                _children: [
                  { name: 'loglevel', _: 'OptionRef' },
                  { name: 'logfile', _: 'OptionRef' }
                ]
              },
              {
                _: 'Conflicts',
                _children: [
                  { name: 'name', _: 'OptionRef' },
                  { name: 'labelname', _: 'OptionRef' }
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
                  { name: 'header', _: 'OptionRef' },
                  { name: 'producer', _: 'OptionRef' },
                  { name: 'director', _: 'OptionRef' }
                ]
              }
            ]
          }
        ],
        describe: 'Rename albums according to arguments specified (write).'
      });
    });
  });

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
                describe="Rename albums according to arguments specified (write).">
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
        let result = R.where({
          name: R.equals('rename'),
          _: R.equals('Command'),
          _children: R.is(Array)
        }, renameCommand);
        expect(result).to.be.true(`Failed "rename" command: "${functify(renameCommand)}"`);
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
                describe="Rename albums according to arguments specified (write).">
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
            describe="Rename albums according to arguments specified (write)."
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

  // select(query, document);
  // select('Command', 'name', 'rename', document);
}

describe('dual fn interface', () => {
  it('ISelector', () => {
    invoke(helpers.Selectors);
  });
});
