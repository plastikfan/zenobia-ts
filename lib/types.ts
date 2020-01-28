
export type NullableNode = Node | null;

export type StringIndexableObj = { [key: string]: any };

export interface IXPathSelector {
  (elementName: string, id: string, name: string, parentNode: Node): NullableNode;
}
