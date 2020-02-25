
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai'); use(dirtyChai);
import * as helpers from '../../lib/utils/helpers';

describe('containsText', () => {
  context('given: a valid string', () => {
    it('should: return true', () => {
      expect(helpers.containsText('hello world')).to.be.true();
    });
  });

  context('given: undefined', () => {
    it('should: return false', () => {
      expect(helpers.containsText(undefined)).to.be.false();
    });
  });

  context('given: null', () => {
    it('should: return false', () => {
      expect(helpers.containsText(null)).to.be.false();
    });
  });

  context('given: spaces', () => {
    it('should: return false', () => {
      expect(helpers.containsText('    ')).to.be.false();
    });
  });
});
