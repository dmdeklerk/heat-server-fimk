import { NetworkStatusParam, NetworkStatusResult, CallContext, ModuleResponse } from 'heat-server-common';
export declare function networkStatus(context: CallContext, param: NetworkStatusParam): Promise<ModuleResponse<NetworkStatusResult>>;
