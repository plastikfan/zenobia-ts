
import * as xp from 'xpath-ts';
import * as types from '../types';

export function selectElementNodeById (elementName: string, id: string, name: string,
  parentNode: Node): types.NullableNode {
  const elementResult = xp.select(`.//${elementName}[@${id}="${name}"]`, parentNode, true);

  /* istanbul ignore next */
  return elementResult instanceof Node ? elementResult : null;
}
export class XPathSelector implements types.IXPathSelector {
  select (query: string, doc?: Node, single?: boolean)
  : string | number | boolean | Node | Node[] {
    return xp.select(query, doc, single);
  }

  selectById (elementName: string, id: string, name: string, parentNode: Node)
  : types.NullableNode {
    const query = `.//${elementName}[@${id}="${name}"]`;
    const elementResult = xp.select(query, parentNode, true);

    return elementResult instanceof Node ? elementResult : null;
  }
}
