import { TransactionStatusParam, TransactionStatusResult, CallContext, ModuleResponse } from 'heat-server-common';
export declare function transactionStatus(context: CallContext, param: TransactionStatusParam): Promise<ModuleResponse<TransactionStatusResult>>;
