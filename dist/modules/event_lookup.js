"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventLookup = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
const TYPE_PAYMENT = 0;
const TYPE_MESSAGING = 1;
const TYPE_COLORED_COINS = 2;
const TYPE_ACCOUNT_CONTROL = 4;
const SUBTYPE_PAYMENT_ORDINARY_PAYMENT = 0;
const SUBTYPE_MESSAGING_ARBITRARY_MESSAGE = 0;
const SUBTYPE_COLORED_COINS_ASSET_ISSUANCE = 0;
const SUBTYPE_COLORED_COINS_ASSET_TRANSFER = 1;
const SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT = 2;
const SUBTYPE_COLORED_COINS_BID_ORDER_PLACEMENT = 3;
const SUBTYPE_COLORED_COINS_ASK_ORDER_CANCELLATION = 4;
const SUBTYPE_COLORED_COINS_BID_ORDER_CANCELLATION = 5;
const SUBTYPE_ACCOUNT_CONTROL_EFFECTIVE_BALANCE_LEASING = 0;
async function eventLookup(context, param) {
    try {
        const { logger, middleWare } = context;
        const { addrXpub, minimal } = param;
        const addrXpub_ = middleWare && lodash_1.isFunction(middleWare.getAddress)
            ? await middleWare.getAddress(addrXpub)
            : addrXpub;
        param.addrXpub = addrXpub_;
        const data = await smartEventsLookup(context, param);
        let value;
        if (!Array.isArray(data)) {
            logger.log(`No transactions for ${addrXpub} got ${heat_server_common_1.prettyPrint(data)}`);
            value = [];
        }
        else if (minimal) {
            value = data.map(({ txData }) => txData.transaction);
        }
        else {
            value = [];
            for (let i = 0; i < data.length; i++) {
                let { txData, events } = data[i];
                events.forEach((event) => {
                    event.data = heat_server_common_1.createEventData(event);
                });
                let date = new Date(Date.UTC(2013, 10, 24, 12, 0, 0, 0) + txData.timestamp * 1000);
                value.push({
                    timestamp: date.getTime(),
                    sourceId: txData.transaction,
                    sourceType: heat_server_common_1.SourceTypes.TRANSACTION,
                    confirmations: txData.confirmations,
                    events,
                });
            }
        }
        return {
            value,
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.eventLookup = eventLookup;
function transactionsLookupReq(context, addrXpub, from, to) {
    const { req, protocol, host } = context;
    const url = `${protocol}://${host}?requestType=getBlockchainTransactions&account=${addrXpub}&firstIndex=${from}&lastIndex=${to}`;
    return req.get(url);
}
function unconfirmedTransactionsLookupReq(context, addrXpub) {
    const { req, protocol, host } = context;
    const url = `${protocol}://${host}?requestType=getUnconfirmedTransactions&account=${addrXpub}`;
    return req.get(url);
}
async function smartEventsLookup(context, param) {
    const { req, protocol, host, logger, middleWare } = context;
    const { blockchain, assetType, assetId, addrXpub, from, to, minimal } = param;
    const size = to - from;
    let unconfirmedTransactionsJson = await unconfirmedTransactionsLookupReq(context, addrXpub);
    let data = heat_server_common_1.tryParse(unconfirmedTransactionsJson);
    let transactions = [];
    if (Array.isArray(data.unconfirmedTransactions)) {
        transactions = data.unconfirmedTransactions.map((txData) => {
            return {
                txData,
                events: getEventsFromTransaction(txData, addrXpub),
            };
        });
    }
    else {
        logger.warn(`No unconfirmed transactions ${heat_server_common_1.prettyPrint(data)}`);
    }
    transactions = transactions.filter(({ events }) => {
        return events.find(event => event.assetType == assetType && event.assetId == assetId);
    });
    let slice = transactions.slice(from, to + 1);
    if (slice.length == size) {
        return transactions;
    }
    let cursor = 0;
    let endReached = false;
    while (cursor < to) {
        let confirmedTransactionJson = await transactionsLookupReq(context, addrXpub, cursor, cursor + 100);
        cursor = cursor + 100 + 1;
        let data = heat_server_common_1.tryParse(confirmedTransactionJson);
        if (Array.isArray(data.transactions)) {
            if (data.transactions.length < 100) {
                endReached = true;
            }
            let temp = data.transactions.map((txData) => {
                return {
                    txData,
                    events: getEventsFromTransaction(txData, addrXpub),
                };
            });
            temp = temp.filter(({ events }) => {
                return events.find(event => event.assetType == assetType && event.assetId == assetId);
            });
            transactions = transactions.concat(temp);
        }
        else {
            logger.warn(`No unconfirmed transactions ${heat_server_common_1.prettyPrint(data)}`);
        }
        let slice = transactions.slice(from, to + 1);
        if (slice.length == size || endReached) {
            return transactions;
        }
    }
    logger.warn(`Not reached.. `);
    return null;
}
function getEventsFromTransaction(txData, _addrXpub) {
    try {
        const isIncoming = txData.recipient == _addrXpub;
        const addrXpub = isIncoming ? txData.sender : txData.recipient;
        const publicKey = isIncoming
            ? txData.senderPublicKey
            : txData.recipientPublicKey;
        const events = [];
        switch (txData.type) {
            case TYPE_PAYMENT:
                if (txData.subtype == SUBTYPE_PAYMENT_ORDINARY_PAYMENT) {
                    events.push(isIncoming
                        ? heat_server_common_1.buildEventReceive({ addrXpub, publicKey }, heat_server_common_1.AssetTypes.NATIVE, '0', txData.amountNQT, 0)
                        : heat_server_common_1.buildEventSend({ addrXpub, publicKey }, heat_server_common_1.AssetTypes.NATIVE, '0', txData.amountNQT, 0));
                }
                break;
            case TYPE_COLORED_COINS:
                switch (txData.subtype) {
                    case SUBTYPE_COLORED_COINS_ASSET_ISSUANCE:
                        break;
                    case SUBTYPE_COLORED_COINS_ASSET_TRANSFER: {
                        let { asset, quantityQNT } = txData.attachment;
                        events.push(isIncoming
                            ? heat_server_common_1.buildEventReceive({ addrXpub, publicKey }, heat_server_common_1.AssetTypes.TOKEN_TYPE_1, asset, quantityQNT, 0)
                            : heat_server_common_1.buildEventSend({ addrXpub, publicKey }, heat_server_common_1.AssetTypes.TOKEN_TYPE_1, asset, quantityQNT, 0));
                        break;
                    }
                    case SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT:
                    case SUBTYPE_COLORED_COINS_BID_ORDER_PLACEMENT: {
                        const isAsk = txData.subtype == SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT;
                        let { asset, quantityQNT, priceNQT } = txData.attachment;
                        const assetType = heat_server_common_1.AssetTypes.TOKEN_TYPE_1;
                        const currencyType = heat_server_common_1.AssetTypes.NATIVE;
                        events.push(isAsk
                            ? heat_server_common_1.buildEventSellOrder(assetType, asset, currencyType, '0', quantityQNT, priceNQT)
                            : heat_server_common_1.buildEventBuyOrder(assetType, asset, currencyType, '0', quantityQNT, priceNQT));
                        break;
                    }
                }
                break;
            case TYPE_ACCOUNT_CONTROL:
                switch (txData.subtype) {
                    case SUBTYPE_ACCOUNT_CONTROL_EFFECTIVE_BALANCE_LEASING:
                        const { period } = txData.attachment;
                        events.push(heat_server_common_1.buildEventLeaseBalance({ addrXpub, publicKey }, period));
                        break;
                }
                break;
        }
        if (!isIncoming) {
            events.push(heat_server_common_1.buildEventFee(txData.feeNQT));
        }
        return events;
    }
    catch (e) {
        this.logger.error(e);
        throw e;
    }
}
//# sourceMappingURL=event_lookup.js.map