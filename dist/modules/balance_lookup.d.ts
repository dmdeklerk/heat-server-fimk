import { BalanceLookupParam, BalanceLookupResult, CallContext, ModuleResponse } from 'heat-server-common';
export declare function balanceLookup(context: CallContext, param: BalanceLookupParam): Promise<ModuleResponse<BalanceLookupResult>>;
