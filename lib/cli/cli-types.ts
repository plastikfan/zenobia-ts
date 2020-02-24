import * as fs from 'fs';
import * as memfs from 'memfs';
import * as jaxom from 'jaxom-ts';
import { VirtualFS, ICommandBuilder, ICommandBuilderFactory, ISelectors } from '../types';
import * as yargs from 'yargs';

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

export type ResourceType = 'com' | 'opt';

export interface IYargsCli {
  [x: string]: unknown;
  _: string[] | string;
  $0: string;
}

export interface IZenobiaCli extends IYargsCli {
  xml?: string;
  parseinfo?: string;
  resource?: ResourceType;
}

export type ApplicationCommand = 'jax' | 'default';

export interface ICommandLineInputs { // THIS MUST BE A GENERIC, because of argv: IZenobiaCli
  applicationCommand: ApplicationCommand;
  //
  resource?: ResourceType;
  xmlContent?: string;
  query?: string;
  parseInfoContent?: string;
  //
  output: string;
  argv: IZenobiaCli;
}

export interface IExecutionContext { // GENERIC
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

export interface IApplication { // GENERIC
  run (executionContext: IExecutionContext): number;
}

export interface ICliCommand { // GENERIC
  exec (executionContext: IExecutionContext): number;
}
