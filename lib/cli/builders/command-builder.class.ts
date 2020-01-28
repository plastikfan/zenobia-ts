import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as jaxom from 'jaxom-ts';
import { functify } from 'jinxed';
import * as helpers from '../../utils/helpers';
import * as types from '../../types';

/**
 * @export
 * @class CommandBuilder
 */
export class CommandBuilder {
  constructor (private converter: jaxom.IConverter, private options: jaxom.ISpecService,
    private parseInfo: jaxom.IParseInfo) { }

  /**
   * @method buildNamedCommand
   * @description: Builds the specific concrete command which appear in the XML
   * config at /Application/Cli/Commands. Also performs Command specific checking
   * like ensuring that any Command built does not include both "describe"
   * "abstract" attributes (ie this scenario would imply an abstract command
   * is going to be invoked directly, which can't happen.). A concrete Command
   * is one that does not contain an "abstract" attribute. The "inherits" array
   * is converted from a csv as its defined in config to an array. The Arguments
   * built are non normalised, so will contain ArgumentRefs which subsequently
   * need to be resolved into their definitions.
   * @param {XMLNode} commandsNode: the XML node which is the immediate parent of
   *    the Command available at: /Application/Cli/Commands.
   *
   * @param {string} commandName
   * @param {Node} commandsNode
   * @returns {Array<{}>}
   * @memberof CommandBuilder
   */
  public buildNamedCommand (commandName: string, commandsNode: Node)
    : Array<{}> {

    const commandNode = helpers.selectElementNodeById(
      'Command', 'name', commandName, commandsNode);

    if (commandNode instanceof Node) {
      let command = this.converter.build(commandNode, this.parseInfo);
      command = this.postBuildCommand(command);

      return [command];
    } else {
      throw new Error(`Failed to find Command with name: "${commandName}"`);
    }
  }

  /**
   * @method buildCommands
   * @description: Builds all concrete commands which appear in the XML config at
   * /Application/Cli/Commands. Also performs Command specific checking
   * like ensuring that any Command built does not include both "describe"
   * "abstract" attributes (ie this scenario would imply an abstract command
   * is going to be invoked directly, which can't happen.). A concrete Command
   * is one that does not contain an "abstract" attribute. The "inherits" array
   * is converted from a csv as its defined in config to an array. The Arguments
   * built are non normalised, so will contain ArgumentRefs which subsequently
   * need to be resolved into their definitions.
   *
   * @param {Node} commandsNode: the XML node which is the immediate parent of
   * all Commands available at: /Application/Cli/Commands.
   * @returns {types.StringIndexableObj[]}: containing all concrete Commands defined.
   * @memberof CommandBuilder
   */
  public buildCommands (commandsNode: Node)
    : types.StringIndexableObj[] {
    const concreteCommands = xp.select('.//Command[not(@abstract)]', commandsNode);

    if (concreteCommands instanceof Array) {
      if (concreteCommands.length === 0) {
        throw new Error('Bad configuration: No Commands found');
      }

      const commands = R.map((commandNode: Node) => {
        return this.postBuildCommand(this.converter.build(commandNode, this.parseInfo));
      }, concreteCommands);

      return commands;
    } else {
      throw new Error(``);
    }
  }

  /**
   * @method normaliseCommandArguments
   * @description This function is required because the normalisation that occurs natively in
   * jaxom can only go so far; ie the normalisation of elements that have a direct relationship
   * with each other (parent/immediate children). But the normalisation we require here normalises
   * elements between children and grand parent; ie: Command.Arguments.Argument, where Command
   * is the grand parent and Argument is the grand child. After Command is built by jaxom,
   * Command.children is an object which maps Arguments/ArgumentGroups/... to an array of
   * grand children: Arguments, which in turn has its own children which are the 'arguments'
   * themselves. The result of this normalisation process changes Command.Arguments to become
   * single a map object, that maps all arguments (some which are local to the command and the
   * others would be inherited from other commands, hence the need for the normalisation).
   *
   * @param {types.StringIndexableObj} command
   * @returns {types.StringIndexableObj}
   * @memberof CommandBuilder
   */
  public normaliseCommandArguments (command: types.StringIndexableObj)
    : types.StringIndexableObj {

    const argumentsLens = R.lensPath([this.options.descendantsLabel, 'Arguments']);
    const argDefs = R.view(argumentsLens)(command);

    if (R.is(Array)(argDefs)) {
      const reducedChildren = R.reduce((acc: types.StringIndexableObj, childArguments: any): any => {
        const grandChildren: types.StringIndexableObj = R.prop(
          this.options.descendantsLabel)(childArguments);

        return R.mergeDeepLeft(acc, grandChildren);
      }, {})(argDefs as Array<any>);

      command = R.set(argumentsLens, reducedChildren)(command);
    }

    return command;
  }

  /**
   * @method resolveCommandArguments
   * @description Any ArgumentRefs within the Command are resolved into Argument's using
   * the argument definitions provided in info.
   *
   * @param {any[]} commands
   * @param {*} info
   * @returns {types.StringIndexableObj}
   * @memberof CommandBuilder
   */
  public resolveCommandArguments (commands: any[], info: any)
    : types.StringIndexableObj {
    return R.map((command: any) => {
      return this.resolveArguments(command, info);
    })(commands);
  }

  /**
   * @method postBuildCommand
   * @description: Performs all actions required after the element is built by jaxom
   *
   * @private
   * @param {types.StringIndexableObj} command
   * @returns {types.StringIndexableObj}
   * @memberof CommandBuilder
   */
  private postBuildCommand (command: types.StringIndexableObj)
    : types.StringIndexableObj {
    const elementInfo: any = jaxom.composeElementInfo('Command', this.parseInfo);

    // Transform the @inherits attribute from a csv into an array
    //
    const keys = R.keys(command);
    if (R.includes(elementInfo.recurse, keys)) {
      command[elementInfo.recurse] = R.split(',', command[elementInfo.recurse]);
    }

    // Abstract commands can't have a description
    //
    if (R.includes('abstract', keys) && R.includes('describe', keys)) {
      throw new Error('Abstract commands can\'t have a describe attribute.');
    }

    return this.normaliseCommandArguments(command);
  }

  /**
   * @method resolveArguments
   * @description: Resolves all ArgumentRefs to Arguments using the info object passed in.
   *
   * @private
   * @param {types.StringIndexableObj} command: The native command object with unresolved
   * Arguments (ie, the arguments are all just ArgumentRef's)
   * @param {types.StringIndexableObj} info: normalisation information, which contains
   * "commandArguments" being a reference to a generic format object built by jaxom
   * whose top level "_children" attribute contains a map keyed by argument name
   * of ArgumentDefs.
   * @returns {types.StringIndexableObj}: A native Command object with resolved Arguments
   * @memberof CommandBuilder
   */
  private resolveArguments (command: types.StringIndexableObj, info: types.StringIndexableObj)
    : types.StringIndexableObj {

    const { commandArguments } = info;
    const argumentDefs = commandArguments[this.options.descendantsLabel];

    if (R.is(Object, R.prop(this.options.descendantsLabel)(command))) {
      const children = command[this.options.descendantsLabel];

      const argumentRefsObj = R.find((el: types.StringIndexableObj): boolean => {
        return el[this.options.elementLabel] === 'Arguments';
      })(children);

      if (argumentRefsObj instanceof Object) {
        const argumentRefs = argumentRefsObj[this.options.descendantsLabel];
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
        argumentRefsObj[this.options.descendantsLabel] = resolved;
      } else {
        throw new Error(`Couldn't find 'Arguments in command: ${command.name}`);
      }
    } else {
      throw new Error(`"${this.options.descendantsLabel}" is missing from command: "${command.name}"`);
    }

    return command;
  }
} // CommandBuilder
