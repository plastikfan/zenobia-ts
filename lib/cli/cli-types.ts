import * as jaxom from 'jaxom-ts';
import { VirtualFS, ICommandBuilderFactory, ISelectors } from '../types';

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

export const ZenobiaExecutable = 'zen';

// ----------------------------------------------------- Command Line Inputs ---

export type ResourceType = 'com' | 'opt';

export interface IYargsCli {
  [x: string]: unknown;
  _: string[] | string;
  $0: string;
}

export interface IZenobiaCli extends IYargsCli {
  parseInfo: string;
  query: string;
  resource?: ResourceType;
  xml: string;
  //
  output?: string;
}

export type ApplicationCommand = 'jax' | 'default';

export interface ICommandLineInputs {
  applicationCommand: ApplicationCommand;
  //
  parseInfoContent?: string;
  query?: string;
  resource?: ResourceType;
  xmlContent?: string;
  //
  output: string;
  argv: IZenobiaCli;
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

export interface ICommandExecutionResult {
  resultCode: number;
  error?: string;
  payload: { [key: string]: unknown };
}
export interface IApplication {
  run (executionContext: IExecutionContext): number;
}

export interface ICliCommand {
  exec (executionContext: IExecutionContext): ICommandExecutionResult;
}
