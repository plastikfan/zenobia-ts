
import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as types from '../../types';

export class CommandBuilderImpl {
  constructor (private specSvc: jaxom.ISpecService) { }

  /**
   * @method resolveOptions
   * @description: Resolves all OptionRefs to Options using the info object passed in.
   *
   * @public
   * @param {types.StringIndexableObj} command: The native command object with unresolved
   * Options (ie, the options are all just OptionRefs)
   * @param {types.StringIndexableObj} info: normalisation information, which contains
   * "commandOptions" being a reference to a generic format object built by jaxom
   * whose top level "_children" attribute contains a map keyed by option name
   * of OptionDef.
   * @returns {types.StringIndexableObj}: A native Command object with resolved Options
   * @memberof CommandBuilder
   */
  public resolveOptions (command: types.StringIndexableObj, info: types.StringIndexableObj)
    : types.StringIndexableObj {

    const { commandOptions } = info;
    const optionDefs = commandOptions[this.specSvc.descendantsLabel];

    if (R.is(Array)(R.prop(this.specSvc.descendantsLabel)(command))) {
      const children = command[this.specSvc.descendantsLabel];
      const optionRefsObj = R.find((el: types.StringIndexableObj): boolean => {
        return el[this.specSvc.elementLabel] === 'Options';
      })(children);

      if (optionRefsObj instanceof Object) {
        const optionRefs = optionRefsObj[this.specSvc.descendantsLabel];
        const resolved = R.map((ref: { name: string; }) => optionDefs[ref['name']] ?? {
          // This marks out unresolved options so we can find them
          //
          $unresolved: ref.name
        })(optionRefs);

        const unresolvedOption = R.find(
          (arg: any): any => R.has('$unresolved')(arg))(R.values(resolved));
        if (unresolvedOption) {
          throw new Error(
            `"${unresolvedOption.$unresolved}" Option definition missing for command: "${command.name}"`);
        }
        optionRefsObj[this.specSvc.descendantsLabel] = resolved;
      } else {
        throw new Error(`Couldn't find 'Options in command: ${command.name}`);
      }
    } else {
      throw new Error(`"${this.specSvc.descendantsLabel}" Array is missing from command: "${command.name}"`);
    }

    return command;
  }
} // CommandBuilderImpl
