
import * as yargs from 'yargs';
import * as jaxom from 'jaxom-ts';
import { ICommandBuilder, ICommandBuilderFactory, ISelectors } from '../../types';
import * as types from '../../types';

const cliParseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    [
      'Commands',
      {
        descendants: {
          by: 'index',
          id: 'name',
          throwIfCollision: true,
          throwIfMissing: true
        }
      }
    ],
    [
      'Command',
      {
        id: 'name',
        recurse: 'inherits',
        discards: ['inherits', 'abstract']
      }
    ],
    [
      'Options',
      {
        descendants: {
          by: 'index',
          id: 'name',
          throwIfCollision: true,
          throwIfMissing: true
        }
      }
    ],
    [
      'OptionRef',
      {
        id: 'name'
      }
    ]
  ])
};

export class DynamicCli<C> implements types.IDynamicCli<C> {
  constructor (private instance: yargs.Argv, private parseInfo: jaxom.IParseInfo = cliParseInfo) {

  }

  peek (args: string[]): string {
    return 'null';
  }

  create (factory: ICommandBuilderFactory,
    converter: jaxom.IConverter, specSvc: jaxom.ISpecService, xpath: ISelectors)
    : ICommandBuilder {
    return factory(converter, specSvc, this.parseInfo, xpath);
  }

  argv (): C {
    return this.instance.argv as unknown as C;
  }
}
