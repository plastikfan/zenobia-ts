
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as jaxom from 'jaxom-ts';
import { CommandBuilderImpl } from '../../../lib/cli/builders/command-builder.impl';

const ComplexNormalisedOptionDefs = {
  _: 'OptionDefs',
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

describe('CommandBuilderImpl.resolveOptions', () => {
  let builderImpl: CommandBuilderImpl;

  beforeEach(() => {
    const specSvc = new jaxom.SpecOptionService();
    builderImpl = new CommandBuilderImpl(specSvc);
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
        commandOptions: ComplexNormalisedOptionDefs
      };

      expect(() => {
        builderImpl.resolveOptions(command, resolveInfo);
      }).to.throw();
    });
  });

  context('given: a command with missing "Options"', () => {
    it('should: throw', () => {
      const command = {
        name: 'rename',
        source: 'filesystem-source',
        _: 'Command',
        _children: [
          {
            _: 'MissingOptions', // Options not present in command
            _children: {
              incname: { name: 'incname', _: 'OptionRef' },
              studioname: { name: 'studioname', _: 'OptionRef' },
              header: { name: 'header', _: 'OptionRef' },
              producer: { name: 'producer', _: 'OptionRef' },
              director: { name: 'director', _: 'OptionRef' }
            }
          }
        ],
        describe: 'Rename albums according to arguments specified (write).'
      };
      const resolveInfo = {
        commandOptions: ComplexNormalisedOptionDefs
      };

      expect(() => {
        builderImpl.resolveOptions(command, resolveInfo);
      }).to.throw();
    });
  });
});
