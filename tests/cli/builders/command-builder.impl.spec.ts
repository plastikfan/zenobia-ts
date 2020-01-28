
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as jaxom from 'jaxom-ts';
import { CommandBuilderImpl } from '../../../lib/cli/builders/command-builder.impl';

const ComplexNormalisedArgumentDefs = {
  _: 'ArgumentDefs',
  _children: {
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
    }
  }
};

describe('CommandBuilderImpl.resolveArguments', () => {
  let builderImpl: CommandBuilderImpl;

  beforeEach(() => {
    const options = new jaxom.SpecOptionService();
    builderImpl = new CommandBuilderImpl(options);
  });

  context('given: a command whose descendants is not an array', () => {
    it('should: throw', () => {
      const command = {
        name: 'rename',
        source: 'filesystem-source',
        _: 'Command',
        _children: {
          // NOT AN ARRAY!
        },
        describe: 'Rename albums according to arguments specified (write).'
      };
      const resolveInfo = {
        commandArguments: ComplexNormalisedArgumentDefs
      };

      expect(() => {
        builderImpl.resolveArguments(command, resolveInfo);
      }).to.throw();
    });
  });

  context('given: a command with missing "Arguments"', () => {
    it('should: throw', () => {
      const command = {
        name: 'rename',
        source: 'filesystem-source',
        _: 'Command',
        _children: [
          {
            _: 'MissingArguments', // Arguments not present in command
            _children: {
              incname: { name: 'incname', _: 'ArgumentRef' },
              studioname: { name: 'studioname', _: 'ArgumentRef' },
              header: { name: 'header', _: 'ArgumentRef' },
              producer: { name: 'producer', _: 'ArgumentRef' },
              director: { name: 'director', _: 'ArgumentRef' }
            }
          }
        ],
        describe: 'Rename albums according to arguments specified (write).'
      };
      const resolveInfo = {
        commandArguments: ComplexNormalisedArgumentDefs
      };

      expect(() => {
        builderImpl.resolveArguments(command, resolveInfo);
      }).to.throw();
    });
  });
});
