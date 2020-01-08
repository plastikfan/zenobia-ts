import { functify } from 'jinxed';

import * as R from 'ramda';
import * as xp from 'xpath-ts';
import * as jaxom from 'jaxom-ts';
import * as helpers from '../../utils/helpers';
import * as types from '../../types';

const defaultSpec = jaxom.Specs.default;
const Id = 'name';

const parseInfo: jaxom.IParseInfo = {
  elements: new Map<string, jaxom.IElementInfo>([
    ['Commands', {
      descendants: {
        by: 'index',
        id: Id,
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['Command', {
      id: Id,
      recurse: 'inherits',
      discards: ['inherits', 'abstract']
    }],
    ['Arguments', {
      descendants: {
        by: 'index',
        id: Id,
        throwIfCollision: true,
        throwIfMissing: true
      }
    }],
    ['ArgumentRef', {
      id: Id
    }]
  ])
};

/**
 * @function buildNamedCommand
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
 * @export
 * @param {jaxom.IConverter} converter
 * @param {string} commandName
 * @param {Node} commandsNode
 * @returns {Array of single Object} representing the concrete Command defined
 */
export function buildNamedCommand (converter: jaxom.IConverter, commandName: string, commandsNode: Node): Array<{}> {
  const commandNode = helpers.selectElementNodeById('Command', 'name', commandName, commandsNode);

  if (commandNode instanceof Node) {
    let command = converter.build(commandNode, parseInfo);
    command = postBuildCommand(command);

    return [command];
  } else {
    throw new Error(`Failed to find Command with name: "${commandName}"`);
  }
}

/**
 * @function buildCommands
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
 * @param {XMLNode} commandsNode: the XML node which is the immediate parent of
 * all Commands available at: /Application/Cli/Commands.
 * @returns {Array} containing all concrete Commands defined
 * @export
 * @param {Node} commandsNode
 * @returns {*}
 */
export function buildCommands (converter: jaxom.IConverter, commandsNode: Node): any {
  const concreteCommands = xp.select(
    './/Command[not(@abstract)]',
    commandsNode
  ) as Node[];

  if (concreteCommands) {
    if (concreteCommands.length === 0) {
      throw new Error('Bad configuration: No Commands found');
    }

    const commands = R.map((cmdNode: Node) => {
      return postBuildCommand(converter.build(cmdNode, parseInfo));
    }, concreteCommands);

    return commands;
  }
}

/**
 * @function postBuildCommand
 * @description: Performs all actions required after the element is built by jaxine
 *
 * @param {Object} command
 * @returns {Object} in a pre normalised form, ie, it still needs to be normalised
 *    via normaliseCommands.
 */
function postBuildCommand (command: types.StringIndexableObj): types.StringIndexableObj {
  const elementInfo: any = jaxom.composeElementInfo('Command', parseInfo);

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

  return normaliseCommandArguments(command);
}

/**
 * @function normaliseCommandArguments
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
 * @export
 * @param {types.StringIndexableObj} command
 * @returns {types.StringIndexableObj}
 */
export function normaliseCommandArguments (command: types.StringIndexableObj): types.StringIndexableObj {
  const descendantsLabel = defaultSpec.labels?.descendants ?? '?';
  const argumentsLens = R.lensPath([descendantsLabel, 'Arguments']);
  const argDefs = R.view(argumentsLens)(command);

  if (argDefs && R.is(Array)(argDefs)) {
    const reducedChildren = R.reduce((acc: types.StringIndexableObj, childArguments: any): any => {
      const grandChildren: types.StringIndexableObj = R.prop(descendantsLabel)(childArguments);
      return R.mergeDeepLeft(acc, grandChildren);
    }, {})(argDefs as Array<any>);

    command = R.set(argumentsLens, reducedChildren)(command);
  }

  return command;
}

/**
 * @function resolveCommandArguments
 * @description Any ArgumentRefs withtin the Command are resolved into Argument's using
 * the argument definitions provided in info.
 *
 * @export
 * @param {any[]} commands
 * @param {*} info
 * @returns {types.StringIndexableObj} The command with resolved arguments
 */
export function resolveCommandArguments (commands: any[], info: any): types.StringIndexableObj {
  return R.map((command: any) => {
    return resolveArguments(command, info);
  })(commands);
}

/**
 * @function resolveArguments
 * @description: Resolves all ArgumentRefs to Arguments using the info object passed in.
 *
 * @param {Object} command: The native command object with unresolved Arguments (ie, the arguments
 *    are all just ArgumentRef's)
 * @param {Object} info normalisation information, which contains "commandArguments" being
 *    a reference to a generic format object built by jaxine whose top level
 *    "_children" attribute contains a map keyed by argument name of ArgumentDefs.
 * @returns A native Command object with resolved Arguments
 */
function resolveArguments (command: types.StringIndexableObj,
  info: types.StringIndexableObj): types.StringIndexableObj {

  const defaultSpec = jaxom.Specs.default;
  const descendantsLabel = defaultSpec.labels?.descendants ?? '?';

  const { commandArguments = {} } = info;
  const argumentDefs = commandArguments[descendantsLabel];

  if (R.is(Object, R.prop(descendantsLabel)(command))) {
    const children = command[descendantsLabel];

    if (R.where({ Arguments: R.is(Object) }, children)) {
      const argumentRefs: any = children.Arguments;
      const resolved = R.map((ref: { name: string; }) => argumentDefs[ref[Id]])(argumentRefs);

      const resolvedValues = R.values(resolved);
      const argRefValues = R.values(argumentRefs);

      const joined = R.innerJoin((res: any, argsRef: any) => res.name === argsRef.name,
        resolvedValues, argRefValues);

      if (joined.length === R.keys(resolved).length) {
        command = R.assocPath([descendantsLabel, 'Arguments'], resolved, command);
      } else {
        const elementLabel = defaultSpec.labels?.element ?? '?';

        const unresolved = R.find((arg: any): any => { return arg[elementLabel] === 'ArgumentRef'; })(resolved);
        throw new Error(
          `command-builder.resolveArguments: Argument definition missing for command: "${command.name}"; unresolved: "${functify(unresolved)}"`);
      }
    } else {
      throw new Error(`command-builder.resolveArguments: "Arguments" is missing from "${descendantsLabel}" of command: "${command.name}"`);
    }
  } else {
    throw new Error(`command-builder.resolveArguments: "${descendantsLabel}" is missing from command: "${command.name}"`);
  }

  return command;
}
