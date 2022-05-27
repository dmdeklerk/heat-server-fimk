import { EventLookupParam, EventLookupResult, CallContext, ModuleResponse } from "heat-server-common";
export declare function eventLookup(context: CallContext, param: EventLookupParam): Promise<ModuleResponse<Array<EventLookupResult>>>;
