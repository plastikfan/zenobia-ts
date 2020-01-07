
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as xp from 'xpath-ts';

export function selectElementNodeById (elementName: string, id: string, name: string,
  parentNode: Node): Node | null {
  const elementResult = xp.select(`.//${elementName}[@${id}="${name}"]`, parentNode, true);

  return elementResult instanceof Node ? elementResult : null;
}
