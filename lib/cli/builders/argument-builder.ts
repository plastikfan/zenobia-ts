
import * as jaxom from 'jaxom-ts';

const parseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    ['Arguments', {
      descendants: {
        by: 'index',
        id: 'name',
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['Argument', {
      id: 'name'
    }]
  ])
};

export function buildArguments (converter: jaxom.IConverter, argumentsNode: Node): any {
  const cliArguments = converter.build(argumentsNode, parseInfo);

  return cliArguments;
}
