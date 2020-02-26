import * as jaxom from 'jaxom-ts';
import { VirtualFS, ICommandBuilderFactory, ISelectors, StringIndexableObj } from '../types';

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

export interface IYargsCli {
  [x: string]: unknown;
  _: string[] | string;
  $0: string;
}

export interface IZenobiaCli extends IYargsCli {
  parseInfo: string;
  query: string;
  xml: string;
  //
  output?: string;
}

export type ApplicationCommand = 'jax' | 'default';

/**
 * @description Inputs derived from the command line after being preprocessed;
 * eg, file name command line inputs are resolved and loaded.
 *
 * @export
 * @interface ICommandLineInputs
 */
export interface ICommandLineInputs {
  applicationCommand: ApplicationCommand;
  //
  parseInfoContent?: string;
  query?: string;
  xmlContent?: string;
  //
  output: string;
  argv: IZenobiaCli;
}

/**
 * @description Defines dependencies that need to be injected into the application
 *
 * @export
 * @interface IExecutionContext
 */
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
  payload: StringIndexableObj[];
}
export interface IApplication {
  run (executionContext: IExecutionContext): number;
}

export interface ICliCommand {
  exec (executionContext: IExecutionContext): ICommandExecutionResult;
}
