
import { assign } from './../../../lib/utils/helpers';
import { expect } from 'chai';

describe('assign', () => { // assign should be replaced with ow/predicates
  context('given: empty string value', () => {
    it('should: throw', () => {
      const value = '';
      expect(() => {
        assign(value, 'duff');
      }).to.throw();
    });
  });

  context('given: undefined string value', () => {
    it('should: throw', () => {
      const value = undefined;
      expect(() => {
        assign(value, 'duff');
      }).to.throw();
    });
  });

  context('given: null string value', () => {
    it('should: throw', () => {
      const value = null;
      expect(() => {
        assign(value, 'duff');
      }).to.throw();
    });
  });
});
