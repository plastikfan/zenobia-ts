
import * as ct from './cli-types';
import * as types from '../types';
import * as jaxom from 'jaxom-ts';

export class Application {
  constructor (
    private parseInfoFactory: ct.IParseInfoFactory,
    private converter: jaxom.IConverter = new jaxom.XpathConverter(),
    private parser: DOMParser = new DOMParser(),
    private applicationConsole: ct.IApplicationConsole = console,
    private fs: types.VirtualFS = require('fs')) {
      //
  }
}
