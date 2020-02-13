
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as types from '../../types';

export class CommandBuilderImpl {
  constructor (private specSvc: jaxom.ISpecService) { }

  /**
   * @method resolveArguments
   * @description: Resolves all OptionRefs to Options using the info object passed in.
   *
   * @public
   * @param {types.StringIndexableObj} command: The native command object with unresolved
   * Options (ie, the arguments are all just OptionRefs)
   * @param {types.StringIndexableObj} info: normalisation information, which contains
   * "commandArguments" being a reference to a generic format object built by jaxom
   * whose top level "_children" attribute contains a map keyed by argument name
   * of OptionDef.
   * @returns {types.StringIndexableObj}: A native Command object with resolved Options
   * @memberof CommandBuilder
   */
  public resolveArguments (command: types.StringIndexableObj, info: types.StringIndexableObj)
    : types.StringIndexableObj {

    const { commandArguments } = info;
    const argumentDefs = commandArguments[this.specSvc.descendantsLabel];

    if (R.is(Array)(R.prop(this.specSvc.descendantsLabel)(command))) {
      const children = command[this.specSvc.descendantsLabel];
      const argumentRefsObj = R.find((el: types.StringIndexableObj): boolean => {
        return el[this.specSvc.elementLabel] === 'Options';
      })(children);

      if (argumentRefsObj instanceof Object) {
        const argumentRefs = argumentRefsObj[this.specSvc.descendantsLabel];
        const resolved = R.map((ref: { name: string; }) => argumentDefs[ref['name']] ?? {
          // This marks out unresolved arguments so we can find them
          //
          $unresolved: ref.name
        })(argumentRefs);

        const unresolvedArgument = R.find(
          (arg: any): any => R.has('$unresolved')(arg))(R.values(resolved));
        if (unresolvedArgument) {
          throw new Error(
            `"${unresolvedArgument.$unresolved}" Argument definition missing for command: "${command.name}"`);
        }
        argumentRefsObj[this.specSvc.descendantsLabel] = resolved;
      } else {
        throw new Error(`Couldn't find 'Options in command: ${command.name}`);
      }
    } else {
      throw new Error(`"${this.specSvc.descendantsLabel}" Array is missing from command: "${command.name}"`);
    }

    return command;
  }
} // CommandBuilderImpl
