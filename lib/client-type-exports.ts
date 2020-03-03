import * as fs from 'fs';
import * as memfs from 'memfs';
import * as jaxom from 'jaxom-ts';

// This file should only contain types; but should not import from types
//

export type NullableNode = Node | null;
export type Nodes = Node | Node[];

/**
 * @description xpath selector function
 *
 * @export
 * @interface ISelect
 */
export interface ISelect {
  (e: string, doc?: Node, single?: boolean): string | number | boolean | Node | Node[];
}

/**
 * @description xpath selector function to select a unique element by an identifying
 * attribute.
 *
 * @export
 * @interface ISelectById
 */
export interface ISelectById {
  (elementName: string, id: string, name: string, parentNode: Node): NullableNode;
}

/**
 * @description Collection of xpath selector functions.
 *
 * @export
 * @interface ISelectors
 */
export interface ISelectors {
  select: ISelect;
  selectById: ISelectById;
}

/**
 * @description Virtual abstraction that represents real or memory file system
 *
 * @export
 * @type VirtualFS
 */
export type VirtualFS = typeof fs | memfs.IFs;

// ==================================================================== Xena ===

// Eventually, StringIndexableObj should be discarded and replaced by a generic
// type (perhaps IZenaElement).
//
export type StringIndexableObj = { [key: string]: any };

/**
 * @description Builder for all commands defined in zenobia config.
 *
 * @export
 * @interface ICommandBuilder
 */
export interface ICommandBuilder { // THIS SHOULD BE CHANGED TO ICommander
  buildNamedCommand(commandName: string, commandsNode: Node): StringIndexableObj[];
  buildCommands(commandsNode: Node): StringIndexableObj[];
}

/**
 *
 * @export
 * @interface ICommandBuilderFactory
 */
export interface ICommandBuilderFactory {
  (converter: jaxom.IConverter, specSvc: jaxom.ISpecService, parseInfo: jaxom.IParseInfo,
    xpath: ISelectors): ICommandBuilder;
}

export interface IDynamicCli {
  (document: Node): ICommandBuilder;
}
