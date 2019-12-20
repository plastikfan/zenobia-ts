
import { expect, use } from 'chai';
import dirtyChai = require('dirty-chai');
use(dirtyChai);
import * as xp from 'xpath-ts';
import 'xmldom-ts'; // brings DOMParser into scope
const parser = new DOMParser();

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
      // But I think the reason why this works is because xmldom-ts brings the dom api
      // to Node.js at run-time, using the declarations defined by the dom api (lib.dom.d.ts)
      //
      expect(commandsNode).to.be.instanceof(Node);
    });
  });
});
