import { TransactionStatusParam, TransactionStatusResult, tryParse, CallContext, ModuleResponse } from 'heat-server-common'
import { isNumber, isString } from 'lodash';

interface AttachmentApiResponse {
  quantityQNT?: string;
  asset?: string;
  priceNQT?: string;
  order?: string;
  period?: number;
}

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

interface TransactionBytesApiResponse {
  transactionBytes: string
}

export async function transactionStatus(context: CallContext, param: TransactionStatusParam): Promise<ModuleResponse<TransactionStatusResult>> {
  try {
    const { logger } = context
    const { addrXpub, transactionId } = param

    const body = await transactionStatusReq(context, transactionId);
    const transaction: TransactionApiResponse = tryParse(body, logger);
    if (isNumber(transaction.confirmations)) {
      /// lookup the transaction bytes
      const body2 = await transactionBytesReq(context, transactionId);
      const transaction2: TransactionBytesApiResponse = tryParse(body2, logger);
      const hex = isString(transaction2.transactionBytes) ? transaction2.transactionBytes : null;
      return {
        value: {
          isAccepted: true,
          confirmations: transaction.confirmations,
          hex: hex,
        },
      };
    }
    let body2 = await unconfirmedReq(context, addrXpub);
    let unconfirmedTransactions: {
      unconfirmedTransactions: Array<TransactionApiResponse>;
    } = tryParse(body2, logger);
    if (!Array.isArray(unconfirmedTransactions)) {
      return {
        value: {
          isAccepted: false,
          confirmations: 0,
        },
      };
    }
    const isAccepted = !!unconfirmedTransactions.find(
      txn => txn.transaction == transactionId,
    );
    return {
      value: {
        isAccepted,
        confirmations: 0,
      },
    };

  } catch (e) {
    return {
      error: e.message,
    };
  }
}

/**
 * https://wallet.fimk.fi:7886/nxt?requestType=getUnconfirmedTransactions&account=FIM-7PL3-2CC5-TKMV-6QDX2
 * {
 *  "unconfirmedTransactions":[
 *    SAME STRUCTURE AS TXN REQUEST ABOVE
 *  ]
 * }
 */
function unconfirmedReq(context: CallContext, addrXpub: string) {
  const { req, protocol, host } = context
  const url = `${protocol}://${host}?requestType=getUnconfirmedTransactions&account=${addrXpub}`;
  return req.get(url);
}

/**
 * https://wallet.fimk.fi:7886/nxt?requestType=getTransaction&transaction=10379042858355207665
 *
 * Unconfirmed transactions do NOT have the 'confirmations' field.
 *
 * {
 *  "signature":"be6152cd018c93da723437a05cb0d303254e94f91570ba1ecbf28007d8e5d205068f648f8de0cb7595c02b838acf1d171ef7758c1a2e4691007daeadbc4fd5aa",
 *  "transactionIndex":0,
 *  "type":0,
 *  "phased":false,
 *  "ecBlockId":"0",
 *  "signatureHash":"1335e586e84d742cd843cf13195e1aa5a2b042455559f39997c7a4caa9777f25",
 *  "attachment":{
 *    "version.Message":1,
 *    "messageIsText":true,
 *    "message":"With public message",
 *    "version.OrdinaryPayment":0
 *  },
 *  "senderRS":"FIM-7PL3-2CC5-TKMV-6QDX2",
 *  "subtype":0,
 *  "amountNQT":"10000000",
 *  "recipientRS":"FIM-6KE7-8M4D-GVNJ-39WF3",
 *  "senderEmail":"FIM-7PL3-2CC5-TKMV-6QDX2",
 *  "block":"10955686741509223278",
 *  "blockTimestamp":194214743,
 *  "deadline":1440,
 *  "recipientEmail":"FIM-6KE7-8M4D-GVNJ-39WF3",
 *  "timestamp":194214748,
 *  "height":3548771,
 *  "senderPublicKey":"b27b12f1982c6c57da981a4dcefe2ae75b00f0665b813e1b634c0b716e48524d",
 *  "feeNQT":"10000000",
 *  "requestProcessingTime":1,
 *  "confirmations":140,
 *  "fullHash":"f12dd1387dc409901fa1369ad8cb2d49e9650222ca9f95d628d45dc1a0eccc60",
 *  "version":1,
 *  "sender":"4644748344150906433",
 *  "recipient":"1204580086052963717",
 *  "ecBlockHeight":1,
 *  "transaction":"10379042858355207665"
 * }
 */
function transactionStatusReq(context: CallContext, transactionId: string) {
  const { req, protocol, host } = context
  const url = `${protocol}://${host}?requestType=getTransaction&transaction=${transactionId}`;
  return req.get(url);
}

/**
 * {
 *   "unsignedTransactionBytes":"0010..6765",
 *   "requestProcessingTime":0,
 *   "confirmations":1716670,
 *   "transactionBytes":"0010..6765"
 * }
 */
function transactionBytesReq(context: CallContext, transactionId: string) {
  const { req, protocol, host } = context
  const url = `${protocol}://${host}?requestType=getTransactionBytes&transaction=${transactionId}`;
  return req.get(url);
}