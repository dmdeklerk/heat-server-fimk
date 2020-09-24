import { PublicKeyLookupParam, PublicKeyLookupResult, CallContext, ModuleResponse } from 'heat-server-common';
export declare function publicKeyLookup(context: CallContext, param: PublicKeyLookupParam): Promise<ModuleResponse<PublicKeyLookupResult>>;
