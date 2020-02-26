import * as R from 'ramda';
import * as jaxom from 'jaxom-ts';
import * as types from '../../types';
import { CommandBuilderImpl } from './command-builder.impl';

/**
 * @export
 * @class CommandBuilder
 */
export class CommandBuilder {
  constructor (private converter: jaxom.IConverter, private specSvc: jaxom.ISpecService,
    private parseInfo: jaxom.IParseInfo, private xpath: types.ISelectors) {

    // Control freak
    //
    this.impl = new CommandBuilderImpl(this.specSvc);
  }

  private impl: CommandBuilderImpl;

  /**
   * @method buildNamedCommand
   * @description: Builds the specific concrete command which appear in the XML
   * config at /Application/Cli/Commands. Also performs Command specific checking
   * like ensuring that any Command built does not include both "describe"
   * "abstract" attributes (ie this scenario would imply an abstract command
   * is going to be invoked directly, which can't happen.). A concrete Command
   * is one that does not contain an "abstract" attribute. The "inherits" array
   * is converted from a csv as its defined in config to an array. The Options
   * built are non normalised, so will contain OptionRefs which subsequently
   * need to be resolved into their definitions.
   * @param {XMLNode} commandsNode: the XML node which is the immediate parent of
   * the Command available at: /Application/Cli/Commands.
   *
   * @param {string} commandName
   * @param {Node} commandsNode
   * @returns {types.StringIndexableObj[]}
   * @memberof CommandBuilder
   */
  public buildNamedCommand (commandName: string, commandsNode: Node)
    : types.StringIndexableObj[] {

    let buildResult: types.StringIndexableObj;
    const commandNode = this.xpath.selectById(
      'Command', 'name', commandName, commandsNode);

    if (commandNode instanceof Node) {
      const command = this.converter.build(commandNode, this.parseInfo);

      const optionsNode = this.xpath.select('.//Options', commandsNode, true);

      /* istanbul ignore next: TODO ... */
      if (optionsNode instanceof Node) {
        const optionDefs = this.impl.buildOptions(this.converter, this.parseInfo, optionsNode);

        buildResult = this.impl.resolveOptions(command, {
          commandOptions: optionDefs
        });
      } else {
        /* istanbul ignore next: TODO ... */
        throw new Error('Bad configuration: No Options found');
      }
    } else {
      throw new Error(`Failed to find Command with name: "${commandName}"`);
    }

    return [buildResult];
  }

  /**
   * @method buildCommands
   * @description: Builds all concrete commands which appear in the XML config at
   * /Application/Cli/Commands. Also performs Command specific checking
   * like ensuring that any Command built does not include both "describe"
   * "abstract" attributes (ie this scenario would imply an abstract command
   * is going to be invoked directly, which can't happen.). A concrete Command
   * is one that does not contain an "abstract" attribute. The "inherits" array
   * is converted from a csv as its defined in config to an array. The Options
   * built are non normalised, so will contain OptionRefs which subsequently
   * need to be resolved into their definitions.
   *
   * @param {Node} commandsNode: the XML node which is the immediate parent of
   * all Commands available at: /Application/Cli/Commands.
   * @returns {types.StringIndexableObj[]}: containing all concrete Commands defined.
   * @memberof CommandBuilder
   */
  public buildCommands (commandsNode: Node)
    : types.StringIndexableObj[] {
    let buildResult: types.StringIndexableObj[] = [];
    const concreteCommands = this.xpath.select('.//Command[not(@abstract)]', commandsNode);

    /* istanbul ignore next */
    if (concreteCommands instanceof Array) {
      if (concreteCommands.length === 0) {
        throw new Error('Bad configuration: No Commands found');
      }
      const optionsNode = this.xpath.select('.//Options', commandsNode, true);

      if (optionsNode instanceof Node) {
        const optionDefs = this.impl.buildOptions(this.converter, this.parseInfo, optionsNode);

        const commands = R.map((commandNode: Node) => {
          const command = this.converter.build(commandNode, this.parseInfo);
          return this.impl.resolveOptions(command, {
            commandOptions: optionDefs
          });
        }, concreteCommands);

        buildResult = commands;
      } else {
        throw new Error('Bad configuration: No Options found');
      }
    }

    return buildResult;
  }
} // CommandBuilder
