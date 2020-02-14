import * as fs from 'fs';
import * as memfs from 'memfs';
import * as jaxom from 'jaxom-ts';

// ===================================================================== CLI ===

// I/O
//
export const ConsoleTag = '[CONSOLE]';

export interface IApplicationConsole {
  log (message?: any, ...optionalParams: any[]): void;
}

export interface IParseInfoFactory {
  construct (source: string): jaxom.IParseInfo;
}

// ----------------------------------------------------- Command Line Inputs ---

type JaxCommandTypes = 'opt' | 'com';

// "jax" command
//
export interface IJaxCommandInputs {
  type: JaxCommandTypes;
  xmlContent: string;
  query: string;
  parseInfoContent: any;
  out: string;
  argv: {};
}
