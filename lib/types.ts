
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
