
import { expect, assert, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as R from 'ramda';
import * as xp from 'xpath-ts';
import 'xmldom-ts';
const parser = new DOMParser();
const { functify } = require('jinxed');

describe('node-js environment', () => {
  context('dom api availability', () => {
    it('"Node" and "Document" types available at runtime', () => {
      const data = `<?xml version="1.0"?>
        <Application name="pez">
          <Cli>
            <Commands>
              <Command name="leaf" describe="this is a leaf command" type="native"/>
            </Commands>
          </Cli>
        </Application>`;

      const document: Document = parser.parseFromString(data, 'text/xml');
      const commandsNode = xp.select('/Application/Cli/Commands', document, true);

      // According to established wisdom, this test should fail because the dom api
      // is not available in the Node.js runtime ...
      //
      expect(commandsNode).to.be.instanceof(Node);
    });

  });
});
