
export type NullableNode = Node | null;

export type StringIndexableObj = { [key: string]: any };

export interface IXPathSelector {
  select (e: string, doc?: Node, single?: boolean): string | number | boolean | Node | Node[];
  selectById (elementName: string, id: string, name: string, parentNode: Node): NullableNode;
}
