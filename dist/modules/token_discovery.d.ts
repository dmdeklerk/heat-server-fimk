import { TokenDiscoveryParam, TokenDiscoveryResult, CallContext, ModuleResponse } from 'heat-server-common';
export declare function tokenDiscovery(context: CallContext, param: TokenDiscoveryParam): Promise<ModuleResponse<Array<TokenDiscoveryResult>>>;
