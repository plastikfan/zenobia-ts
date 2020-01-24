import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as xp from 'xpath-ts';
import * as R from 'ramda';
import { DOMParserImpl as dom } from 'xmldom-ts';
const parser = new dom();
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
import * as builder from '../../../lib/cli/builders/command-builder';
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

describe.skip('Command builder', () => {
  let converter: jaxom.IConverter;
  let document: Node;
  let commandsNode: Node;

  const commonData = `<?xml version="1.0"?>
    <Application name="pez">
      <Cli>
        <Commands>
          <Command name="base-command" abstract="true" source="filesystem-source">
            <Arguments>
              <ArgumentRef name="loglevel"/>
              <ArgumentRef name="logfile"/>
            </Arguments>
            <ArgumentGroups>
              <Conflicts>
                <ArgumentRef name="loglevel"/>
                <ArgumentRef name="logfile"/>
              </Conflicts>
            </ArgumentGroups>
          </Command>
          <Command name="domain-command" abstract="true">
            <Arguments>
              <ArgumentRef name="name"/>
              <ArgumentRef name="labelname"/>
              <ArgumentRef name="incname"/>
              <ArgumentRef name="studioname"/>
              <ArgumentRef name="header"/>
              <ArgumentRef name="producer"/>
              <ArgumentRef name="director"/>
            </Arguments>
            <ArgumentGroups>
              <Conflicts>
                <ArgumentRef name="name"/>
                <ArgumentRef name="labelname"/>
              </Conflicts>
              <Implies>
                <ArgumentRef name="incname"/>
                <ArgumentRef name="studioname"/>
              </Implies>
              <Conflicts>
                <ArgumentRef name="header"/>
                <ArgumentRef name="producer"/>
                <ArgumentRef name="director"/>
              </Conflicts>
            </ArgumentGroups>
          </Command>
          <Command name="uni-command" abstract="true">
            <Arguments>
              <ArgumentRef name="path"/>
              <ArgumentRef name="filesys"/>
              <ArgumentRef name="tree"/>
            </Arguments>
          </Command>
          <Command name="rename"
            describe="Rename albums according to arguments specified (write)."
            inherits="base-command,domain-command,uni-command">
            <Arguments>
              <ArgumentRef name="with"/>
              <ArgumentRef name="put"/>
            </Arguments>
          </Command>
        </Commands>
      </Cli>
    </Application>`;

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
  }

  context('resolveArguments', () => {
    context('given: a built command with at least 1 unresolvable ArgumentRef', () => {
      it('should: throw', () => {
        const data = `<?xml version="1.0"?>
          <Application name="pez">
            <Cli>
              <Commands>
                <Command name="base-command" abstract="true" source="filesystem-source">
                  <Arguments>
                    <ArgumentRef name="loglevel"/>
                    <ArgumentRef name="logfile"/>
                  </Arguments>
                </Command>
                <Command name="rename"
                  describe="Rename albums according to arguments specified (write)."
                  inherits="base-command">
                  <Arguments>
                    <ArgumentRef name="missing"/>
                  </Arguments>
                </Command>
              </Commands>
            </Cli>
          </Application>`;
        init(data);

        const commands = builder.buildCommands(converter, commandsNode);
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
        builder.buildCommands(converter, commandsNode);
      }).to.throw();
    });
  });

  context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
    it('should: return an object with children constituents normalised.', () => {
      init(commonData);
      const commands = builder.buildCommands(converter, commandsNode);

      const normalisedCommands = builder.resolveCommandArguments(commands, {
        commandArguments: ComplexNormalisedArgumentDefs
      });

      const normalisedRenameCommand = normalisedCommands[0];
      const result = R.where(
        {
          name: R.equals('rename'),
          source: R.equals('filesystem-source'),
          _: R.equals('Command'),
          _children: R.is(Object)
        },
        normalisedRenameCommand
      );

      expect(result).to.be.true();
    });
  });

  context('given: a normalised command', () => {
    it("should: return the correct number of Argument's", () => {
      init(commonData);

      const commands = builder.buildCommands(converter, commandsNode);
      const normalisedCommands = builder.resolveCommandArguments(commands, {
        commandArguments: ComplexNormalisedArgumentDefs
      });
      const normalisedRenameCommand = normalisedCommands[0];
      const commandArguments = R.path(
        ['_children', 'Arguments'],
        normalisedRenameCommand
      );

      const argsLength = R.keys(commandArguments).length;
      expect(argsLength).to.be.equal(14);
    }); // should: return the correct number of Argument's

    it("should: return the correct number of ArgumentGroups's", () => {
      init(commonData);

      const commands = builder.buildCommands(converter, commandsNode);
      const normalisedCommands = builder.resolveCommandArguments(commands, {
        commandArguments: ComplexNormalisedArgumentDefs
      });
      const normalisedRenameCommand = normalisedCommands[0];
      const argumentGroups = R.path(
        ['_children', 'ArgumentGroups'],
        normalisedRenameCommand
      );

      const argGroupsLength = R.keys(argumentGroups).length;

      expect(argGroupsLength).to.be.equal(4);
    }); // should: return the correct number of ArgumentGroups's
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
            builder.buildCommands(converter, commandsNode);
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
                <Arguments>
                  <ArgumentRef name="with"/>
                  <ArgumentRef name="put"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;

      it('should: build a single command', () => {
        init(data);

        const commands = builder.buildNamedCommand(converter, 'rename', commandsNode);
        const renameCommand = commands[0];
        let result = R.where({
          name: R.equals('rename'),
          _: R.equals('Command'),
          _children: R.is(Object)
        }, renameCommand);
        expect(result).to.be.true(`Failed "rename" command: "${functify(renameCommand)}"`);

        const argumentsLens = ['_children', 'Arguments'];
        const args = R.view(R.lensPath(argumentsLens))(renameCommand) as types.StringIndexableObj;
        result = R.where({
          name: R.equals('with'),
          _: R.equals('ArgumentRef')
        })(args['with']);
        expect(result).to.be.true(`"rename" command missing "with" arg: "${functify(renameCommand)}"`);

        result = R.where({
          name: R.equals('put'),
          _: R.equals('ArgumentRef')
        })(args['put']);
        expect(result).to.be.true(`"rename" command missing "put" arg: "${functify(renameCommand)}"`);
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
                <Arguments>
                  <ArgumentRef name="with"/>
                  <ArgumentRef name="put"/>
                </Arguments>
              </Command>
            </Commands>
          </Cli>
        </Application>`;
      init(data);

      expect(() => {
        builder.buildNamedCommand(converter, 'unicorns', commandsNode);
      }).to.throw();
    });
  }); // a command with an unknown "name"

  describe('command-builder: buildCommands (deeper check)', () => {
    context('given: rename command, inherits from 3 commands, with ArgumentRefs and ArgumentGroups', () => {
      it('should: return an object with all properties populated.', () => {
        init(commonData);

        const commands = builder.buildCommands(converter, commandsNode);
        const renameCommand = commands[0];
        const elementLabel = '_';
        const args = R.prop('Arguments', renameCommand._children);
        expect(R.is(Object)(args));
        const groups = R.prop('ArgumentGroups', renameCommand._children) as Array<{}>;
        expect(R.is(Array)(groups));
        expect(groups.length).to.equal(4);
        expect(
          R.all((o: types.StringIndexableObj) => R.includes(o[elementLabel], ['Conflicts', 'Implies']))(groups)
        ).to.be.true();

        const result = R.where({
          name: R.equals('rename'),
          source: R.equals('filesystem-source'),
          _: R.equals('Command'),
          _children: R.is(Object)
        }, renameCommand);

        expect(result).to.be.true();
      });
    });
  });

  describe('command-builder: normaliseCommands (deeper check) (resolveArguments) [COMPLEX]', () => {
    context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
      it('should: return an object with children constituents normalised.', () => {
        init(commonData);

        const commands = builder.buildCommands(converter, commandsNode);
        const normalisedCommands = builder.resolveCommandArguments(commands, {
          commandArguments: ComplexNormalisedArgumentDefs
        });
        const normalisedRenameCommand = normalisedCommands[0];

        const result = R.where({
          name: R.equals('rename'),
          source: R.equals('filesystem-source'),
          _: R.equals('Command'),
          _children: R.is(Object)
        }, normalisedRenameCommand);

        expect(result).to.be.true();
      });
    }); // given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups
  }); // command-builder: normaliseCommands (deeper check) (resolveArguments)
}); // Command builder
