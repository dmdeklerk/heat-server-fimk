import { BroadcastParam, BroadcastResult, CallContext, ModuleResponse } from 'heat-server-common';
export declare function broadcast(context: CallContext, param: BroadcastParam): Promise<ModuleResponse<BroadcastResult>>;
