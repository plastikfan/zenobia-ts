
// we need the following items in order to invoke the CommandBuilder:
// private converter: jaxom.IConverter, private specSvc: jaxom.ISpecService,
//    private parseInfo: jaxom.IParseInfo, private xpath: types.ISelectors
//
// and from here, we need to return the COmmandBuilder, so that the client
// can call Commander.build
//
export function buildCommandLine (argv: string[] = process.argv) {

}
