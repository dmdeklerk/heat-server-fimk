"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionStatus = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
async function transactionStatus(context, param) {
    try {
        const { logger } = context;
        const { addrXpub, transactionId } = param;
        const body = await transactionStatusReq(context, transactionId);
        const transaction = (0, heat_server_common_1.tryParse)(body, logger);
        if ((0, lodash_1.isNumber)(transaction.confirmations)) {
            return {
                value: {
                    isAccepted: true,
                    confirmations: transaction.confirmations,
                },
            };
        }
        let body2 = await unconfirmedReq(context, addrXpub);
        let unconfirmedTransactions = (0, heat_server_common_1.tryParse)(body2, logger);
        if (!Array.isArray(unconfirmedTransactions)) {
            return {
                value: {
                    isAccepted: false,
                    confirmations: 0,
                },
            };
        }
        const isAccepted = !!unconfirmedTransactions.find(txn => txn.transaction == transactionId);
        return {
            value: {
                isAccepted,
                confirmations: 0,
            },
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.transactionStatus = transactionStatus;
function unconfirmedReq(context, addrXpub) {
    const { req, protocol, host } = context;
    const url = `${protocol}://${host}?requestType=getUnconfirmedTransactions&account=${addrXpub}`;
    return req.get(url);
}
function transactionStatusReq(context, transactionId) {
    const { req, protocol, host } = context;
    const url = `${protocol}://${host}?requestType=getTransaction&transaction=${transactionId}`;
    return req.get(url);
}
//# sourceMappingURL=transaction_status.js.map