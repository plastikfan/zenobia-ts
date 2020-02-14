
import * as jaxom from 'jaxom-ts';
import * as types from '../types';
import * as ct from './cli-types';
import { IApplicationConsole } from '../cli/cli-types';
import { Application } from './application.class';

module.exports = (applicationConsole: IApplicationConsole, fs: types.VirtualFS): number => {
  // setup
  //
  // const converter = new jaxom.XpathConverter(jaxom.Specs.default);
  // const parseInfoFactory = new jaxom.ParseInfoFactory();
  // const parser: DOMParser = new DOMParser();

  // inject dependencies
  //
  // const application = new Application(applicationConsole, fs);

  return 0;
};
