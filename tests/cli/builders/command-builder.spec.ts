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

describe('command-builder', () => {
  let converter: jaxom.IConverter;

  beforeEach(() => {
    converter = new jaxom.XpathConverter();
  });

  describe('command-builder: buildNamedCommand (single)', () => {
    //
  });

  describe('command-builder: buildCommands (deeper check)', () => {
    //
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

  describe('command-builder: normaliseCommands (deeper check)', () => {
    const data = `<?xml version="1.0"?>
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
    let document: Node;
    let commandsNode: Node;

    beforeEach(() => {
      document = parser.parseFromString(data);
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
    });

    context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
      it('should: return an object with children constituents normalised.', () => {
        const commands = builder.buildCommands(converter, commandsNode);

        const normalisedCommands = builder.resolveCommandArguments(commands, {
          commandArguments: ComplexNormalisedArgumentDefs
        });
        // console.log(`===> resolved: ${functify(normalisedCommands)}`);
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

        const IJ = [
          {
            name: 'with',
            alias: 'w',
            optional: 'true',
            describe: 'replace with',
            _: 'Argument'
          },
          {
            name: 'put',
            alias: 'pu',
            optional: 'true',
            describe: 'update existing',
            _: 'Argument'
          },
          {
            name: 'loglevel',
            alias: 'll',
            optional: 'true',
            describe: 'the logging level',
            _: 'Argument'
          },
          {
            name: 'logfile',
            alias: 'lf',
            optional: 'true',
            describe: 'the file full path',
            _: 'Argument'
          },
          {
            name: 'name',
            alias: 'n',
            optional: 'true',
            describe: 'Album name',
            _: 'Argument'
          },
          {
            name: 'labelname',
            alias: 'ln',
            optional: 'true',
            describe: 'Record label name',
            _: 'Argument'
          },
          {
            name: 'incname',
            alias: 'in',
            optional: 'true',
            describe: 'Incorporation name',
            _: 'Argument'
          },
          {
            name: 'studioname',
            alias: 'sn',
            optional: 'true',
            describe: 'Studio name',
            _: 'Argument'
          },
          {
            name: 'header',
            alias: 'hdr',
            optional: 'true',
            describe: 'Header, has no influence on the naming of content.',
            _: 'Argument'
          },
          {
            name: 'producer',
            alias: 'pn',
            optional: 'true',
            describe: 'Producer name',
            _: 'Argument'
          },
          {
            name: 'director',
            alias: 'dn',
            optional: 'true',
            describe: 'Director name',
            _: 'Argument'
          },
          {
            name: 'path',
            alias: 'p',
            optional: 'true',
            describe: 'Full path.',
            _: 'Argument'
          },
          {
            name: 'filesys',
            alias: 'fs',
            optional: 'true',
            describe: 'The file system as defined in config as FileSystem',
            _: 'Argument'
          },
          {
            name: 'tree',
            alias: 't',
            optional: 'true',
            describe: 'File system tree',
            _: 'Argument'
          }
        ];
        const arguments_ = R.view(R.lensPath(['_children', 'Arguments']), normalisedRenameCommand);
      });
    });

    context('given: a normalised command', () => {
      it("should: return the correct number of Argument's", () => {
        const commands = builder.buildCommands(converter, commandsNode);
        const normalisedCommands = builder.resolveCommandArguments(commands, {
          commandArguments: ComplexNormalisedArgumentDefs
        });
        const normalisedRenameCommand = normalisedCommands[0];
        const commandArguments = R.path(
          ['_children', 'Arguments'],
          normalisedRenameCommand
        );
        // console.log(`===> Normalise Rename Command arguments: ${JSON.stringify(commandArguments)}`);
        const argsLength = R.keys(commandArguments).length;
        expect(argsLength).to.be.equal(14);
      }); // should: return the correct number of Argument's

      it("should: return the correct number of ArgumentGroups's", () => {
        const commands = builder.buildCommands(converter, commandsNode);
        const normalisedCommands = builder.resolveCommandArguments(commands, {
          commandArguments: ComplexNormalisedArgumentDefs
        });
        const normalisedRenameCommand = normalisedCommands[0];
        const argumentGroups = R.path(
          ['_children', 'ArgumentGroups'],
          normalisedRenameCommand
        );
        // console.log(`===> Normalise Rename Command ArgumentGroups': ${JSON.stringify(argumentGroups)}`);
        const argGroupsLength = R.keys(argumentGroups).length;

        expect(argGroupsLength).to.be.equal(4);
      }); // should: return the correct number of ArgumentGroups's
    });
  }); // command-builder: normaliseCommands (deeper check)

  describe('command-builder: normaliseCommands (deeper check) (resolveArguments) [COMPLEX]', () => {
    const data = `<?xml version="1.0"?>
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
              <ArgumentRef name="incname"/>
              <ArgumentRef name="studioname"/>
              <ArgumentRef name="labelname"/>
              <ArgumentRef name="header"/>
              <ArgumentRef name="producer"/>
              <ArgumentRef name="director"/>
            </Arguments>
            <ArgumentGroups>
              <Conflicts>
                <ArgumentRef name="name"/>
                <ArgumentRef name="incname"/>
              </Conflicts>
              <Implies>
                <ArgumentRef name="studioname"/>
                <ArgumentRef name="labelname"/>
              </Implies>
              <Conflicts>
                <ArgumentRef name = "header"/>
                <ArgumentRef name = "producer"/>
                <ArgumentRef name = "director"/>
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

    context('given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups', () => {
      it('should: return an object with children constituents normalised.', () => {
        const document = parser.parseFromString(data);
        const commandsNode = xp.select(
          '/Application/Cli/Commands',
          document,
          true
        );

        if (commandsNode instanceof Node) {
          const commands = builder.buildCommands(converter, commandsNode);

          const normalisedCommands = builder.resolveCommandArguments(commands, {
            commandArguments: ComplexNormalisedArgumentDefs
          });
          const normalisedRenameCommand = normalisedCommands[0];
          // console.log(`===> Normalise Rename Command: ${JSON.stringify(normalisedRenameCommand)}`);

          const result = R.where({
            name: R.equals('rename'),
            source: R.equals('filesystem-source'),
            _: R.equals('Command'),
            _children: R.is(Object)
          }, normalisedRenameCommand);

          expect(result).to.be.true();
        } else {
          assert.fail("Couldn't get Commands node.");
        }
      });
    }); // given: a rename command, inherits from 3 commands, ArgumentRefs and ArgumentGroups
  }); // command-builder: normaliseCommands (deeper check) (resolveArguments)
}); // command-builder
