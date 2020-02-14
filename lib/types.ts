import * as fs from 'fs';
import * as memfs from 'memfs';

export type NullableNode = Node | null;

export type StringIndexableObj = { [key: string]: any };

export interface ISelect {
  (e: string, doc?: Node, single?: boolean): string | number | boolean | Node | Node[];
}

export interface ISelectById {
  (elementName: string, id: string, name: string, parentNode: Node): NullableNode;
}

export interface ISelectors {
  select: ISelect;
  selectById: ISelectById;
}

export type ConversionResult = { [key: string]: any } | { [key: string]: any }[];

export type VirtualFS = typeof fs | memfs.IFs;
