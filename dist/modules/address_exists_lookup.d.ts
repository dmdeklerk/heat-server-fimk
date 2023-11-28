import { CallContext, ModuleResponse, AddressExistsLookupParam, AddressExistsLookupResult } from 'heat-server-common';
export declare function addressExistsLookup(context: CallContext, param: AddressExistsLookupParam): Promise<ModuleResponse<AddressExistsLookupResult>>;
