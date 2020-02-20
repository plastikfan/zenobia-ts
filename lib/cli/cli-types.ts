import * as fs from 'fs';
import * as memfs from 'memfs';
import * as jaxom from 'jaxom-ts';
import { VirtualFS, ICommandBuilder, ICommandBuilderFactory, ISelectors } from '../types';

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

export type ApplicationCommand = 'jax' | 'default';

export interface INoneCommandInputs {
  // This is a dummy and should be removed after adding a second command
}

// new commands appear here creating a union type
//
export interface ICommandLineInputs {
  applicationCommand: ApplicationCommand;
  //
  resource?: 'opt' | 'com';
  xmlContent?: string;
  query?: string;
  parseInfoContent?: string;
  //
  out: string;
  argv: {};
}

export interface IExecutionContext {
  inputs: ICommandLineInputs;
  parseInfoFactory: IParseInfoFactory;
  //
  converter: jaxom.IConverter;
  specSvc: jaxom.ISpecService;
  xpath: ISelectors;
  builderFactory: ICommandBuilderFactory;
  //
  parser: DOMParser;
  applicationConsole: IApplicationConsole;
  vfs: VirtualFS;
}

export interface IApplication {
  run (executionContext: IExecutionContext): number;
}

export interface ICliCommand {
  exec (executionContext: IExecutionContext): number;
}
