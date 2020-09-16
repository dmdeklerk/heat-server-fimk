import { EventLookupParam, EventLookupResult, EventLookupEvent, tryParse, SourceTypes, CallContext, ModuleResponse, prettyPrint, createEventData, EventStandardType, AssetTypes, buildEventReceive, buildEventSend, buildEventSellOrder, buildEventBuyOrder, buildEventLeaseBalance, buildEventFee } from 'heat-server-common'
import { isFunction } from 'lodash';

interface TransactionApiResponse {
  type: number;
  subtype: number;
  amountNQT: string;
  feeNQT: string;
  sender: string;
  recipient: string;
  timestamp: number;
  confirmations?: number;
  transaction: string;
  senderPublicKey?: string;
  recipientPublicKey?: string;
  attachment: AttachmentApiResponse;
}

interface AttachmentApiResponse {
  quantityQNT?: string;
  asset?: string;
  priceNQT?: string;
  order?: string;
  period?: number;
}

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

export async function eventLookup(context: CallContext, param: EventLookupParam): Promise<ModuleResponse<Array<EventLookupResult>>> {
  try {
    const { logger, middleWare } = context
    const { addrXpub, minimal } = param
    const addrXpub_ =
      middleWare && isFunction(middleWare.getAddress)
        ? await middleWare.getAddress(addrXpub)
        : addrXpub;

    param.addrXpub = addrXpub_
    const data = await smartEventsLookup(context, param);
    let value;
    if (!Array.isArray(data)) {
      logger.log(
        `No transactions for ${addrXpub} got ${prettyPrint(data)}`,
      );
      value = [];
    } else if (minimal) {
      value = data.map(({ txData }) => txData.transaction);
    } else {
      value = [];
      for (let i = 0; i < data.length; i++) {
        let { txData, events } = data[i];
        events.forEach((event: any) => {
          event.data = createEventData(event);
        });
        let date = new Date(
          Date.UTC(2013, 10, 24, 12, 0, 0, 0) + txData.timestamp * 1000,
        );
        value.push({
          timestamp: date.getTime(),
          sourceId: txData.transaction,
          sourceType: SourceTypes.TRANSACTION,
          confirmations: txData.confirmations,
          events,
        });
      }
    }
    return {
      value,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}

function transactionsLookupReq(context: CallContext, addrXpub: string, from: number, to: number) {
  const { req, protocol, host } = context
  const url = `${protocol}://${host}?requestType=getBlockchainTransactions&account=${addrXpub}&firstIndex=${from}&lastIndex=${to}`;
  return req.get(url);
}

function unconfirmedTransactionsLookupReq(context: CallContext, addrXpub: string) {
  const { req, protocol, host } = context
  const url = `${protocol}://${host}?requestType=getUnconfirmedTransactions&account=${addrXpub}`;
  return req.get(url);
}

/**
   * Algorithm to obtain both confirmed and unconfirmed transactions and filter these based on
   * assetType and assetId. The returned data has to be a range section determined by {from} and
   * {to} parameters provided.
   *
   * 1. Lookup all unconfirmed transactions for account
   * 2. Filter out all transactions that do not match {assetType} + {assetId}
   * 3. If {from} + {to} was satisfied with this data alone, return that
   * 4. If insuficient keep loading transactions and filter these for {assetType} + {assetId}
   *    untill we have sufficient transactions to satisfy {from} + {to} or when we reach
   *    the end of the transactions for account.
   */
async function smartEventsLookup(
  context: CallContext, param: EventLookupParam,
): Promise<
  Array<{
    txData: TransactionApiResponse;
    events: Array<EventStandardType>;
  }>
> {
  const { req, protocol, host, logger, middleWare } = context
  const { blockchain, assetType, assetId, addrXpub, from, to, minimal } = param
  const size = to - from;

  // 1. Lookup all unconfirmed transactions for account
  let unconfirmedTransactionsJson = await unconfirmedTransactionsLookupReq(context, addrXpub);
  let data = tryParse(unconfirmedTransactionsJson);
  let transactions: Array<{
    txData: TransactionApiResponse;
    events: Array<EventStandardType>;
  }> = [];
  if (Array.isArray(data.unconfirmedTransactions)) {
    transactions = data.unconfirmedTransactions.map(
      (txData: TransactionApiResponse) => {
        return {
          txData,
          events: getEventsFromTransaction(txData, addrXpub),
        };
      },
    );
  } else {
    logger.warn(`No unconfirmed transactions ${prettyPrint(data)}`);
  }

  // 2. Filter out all transactions that do not match {assetType} + {assetId}
  transactions = transactions.filter(({ events }) => {
    return events.find(
      event => event.assetType == assetType && event.assetId == assetId,
    );
  });

  // 3. If {from} + {to} was satisfied with this data alone, return that
  let slice = transactions.slice(from, to + 1);
  if (slice.length == size) {
    return transactions;
  }

  let cursor = 0;
  let endReached = false;
  while (cursor < to) {
    let confirmedTransactionJson = await transactionsLookupReq(
      context,
      addrXpub,
      cursor,
      cursor + 100,
    );
    cursor = cursor + 100 + 1;
    let data = tryParse(confirmedTransactionJson);
    if (Array.isArray(data.transactions)) {
      if (data.transactions.length < 100) {
        endReached = true;
      }
      let temp = data.transactions.map((txData: TransactionApiResponse) => {
        return {
          txData,
          events: getEventsFromTransaction(txData, addrXpub),
        };
      });
      temp = temp.filter(({ events }) => {
        return events.find(
          event => event.assetType == assetType && event.assetId == assetId,
        );
      });
      transactions = transactions.concat(temp);
    } else {
      logger.warn(`No unconfirmed transactions ${prettyPrint(data)}`);
    }

    // 3. If {from} + {to} was satisfied with this data alone, return that
    let slice = transactions.slice(from, to + 1);
    if (slice.length == size || endReached) {
      return transactions;
    }
  }
  logger.warn(`Not reached.. `);
  return null;
}

function getEventsFromTransaction(txData: TransactionApiResponse, _addrXpub) {
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
          events.push(
            isIncoming
              ? buildEventReceive(
                { addrXpub, publicKey },
                AssetTypes.NATIVE,
                '0',
                txData.amountNQT,
                0,
              )
              : buildEventSend(
                { addrXpub, publicKey },
                AssetTypes.NATIVE,
                '0',
                txData.amountNQT,
                0,
              ),
          );
        }
        break;
      case TYPE_COLORED_COINS:
        switch (txData.subtype) {
          case SUBTYPE_COLORED_COINS_ASSET_ISSUANCE:
            break;
          case SUBTYPE_COLORED_COINS_ASSET_TRANSFER: {
            let { asset, quantityQNT } = txData.attachment;
            events.push(
              isIncoming
                ? buildEventReceive(
                  { addrXpub, publicKey },
                  AssetTypes.TOKEN_TYPE_1,
                  asset,
                  quantityQNT,
                  0,
                )
                : buildEventSend(
                  { addrXpub, publicKey },
                  AssetTypes.TOKEN_TYPE_1,
                  asset,
                  quantityQNT,
                  0,
                ),
            );
            break;
          }
          case SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT:
          case SUBTYPE_COLORED_COINS_BID_ORDER_PLACEMENT: {
            const isAsk =
              txData.subtype == SUBTYPE_COLORED_COINS_ASK_ORDER_PLACEMENT;
            let { asset, quantityQNT, priceNQT } = txData.attachment;
            const assetType = AssetTypes.TOKEN_TYPE_1;
            const currencyType = AssetTypes.NATIVE;
            events.push(
              isAsk
                ? buildEventSellOrder(
                  assetType,
                  asset,
                  currencyType,
                  '0',
                  quantityQNT,
                  priceNQT,
                )
                : buildEventBuyOrder(
                  assetType,
                  asset,
                  currencyType,
                  '0',
                  quantityQNT,
                  priceNQT,
                ),
            );
            break;
          }
          // case SUBTYPE_COLORED_COINS_ASK_ORDER_CANCELLATION:
          // case SUBTYPE_COLORED_COINS_BID_ORDER_CANCELLATION:
          //   const isAsk =
          //     txData.subtype == SUBTYPE_COLORED_COINS_ASK_ORDER_CANCELLATION;
          //   const {
          //     order,
          //   } = txData.attachment;
          //   const assetType =
          //     cancelledOrderAsset == '0'
          //       ? AssetTypes.NATIVE
          //       : AssetTypes.TOKEN_TYPE_1;
          //   const currencyType =
          //     cancelledOrderCurrency == '0'
          //       ? AssetTypes.NATIVE
          //       : AssetTypes.TOKEN_TYPE_1;
          //   events.push(
          //     isAsk
          //       ? buildEventCancelSell(
          //           assetType,
          //           cancelledOrderAsset,
          //           currencyType,
          //           cancelledOrderCurrency,
          //           cancelledOrderQuantity,
          //           cancelledOrderPrice,
          //         )
          //       : buildEventCancelBuy(
          //           assetType,
          //           cancelledOrderAsset,
          //           currencyType,
          //           cancelledOrderCurrency,
          //           cancelledOrderQuantity,
          //           cancelledOrderPrice,
          //         ),
          //   );
          //   break;
        }
        break;
      case TYPE_ACCOUNT_CONTROL:
        switch (txData.subtype) {
          case SUBTYPE_ACCOUNT_CONTROL_EFFECTIVE_BALANCE_LEASING:
            const { period } = txData.attachment;
            events.push(
              buildEventLeaseBalance({ addrXpub, publicKey }, period),
            );
            break;
        }
        break;
    }
    if (!isIncoming) {
      events.push(buildEventFee(txData.feeNQT));
    }
    return events;
  } catch (e) {
    this.logger.error(e);
    throw e;
  }
}