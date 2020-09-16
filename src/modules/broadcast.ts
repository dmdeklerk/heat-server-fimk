import { BroadcastParam, BroadcastResult, tryParse, CallContext, ModuleResponse } from 'heat-server-common'
import { isString, isObjectLike, isNumber } from 'lodash';

export async function broadcast(context: CallContext, param: BroadcastParam): Promise<ModuleResponse<BroadcastResult>> {
  try {
    const { logger } = context
    const body = await broadcastReq(context, param);
    const data = tryParse(body, logger)
    if (isObjectLike(data) && isString(data.transaction)) {
      return {
        value: {
          transactionId: data.transaction,
        },
      };
    } else {
      let errorMessage;
      if (
        isObjectLike(data) &&
        isObjectLike(data.error) &&
        isString(data.error.message)
      ) {
        errorMessage = data.error.message;
      } else if (isString(data.errorDescription)) {
        errorMessage = data.errorDescription;
      } else if (isNumber(data.errorCode)) {
        errorMessage = `Error code ${data.errorCode}`;
      } else {
        errorMessage = `Unregognized response: ${JSON.stringify(data)}`;
      }
      return {
        value: {
          errorMessage,
        },
      };
    }
  } catch (e) {
    return {
      error: e.message,
    };
  }
}

function broadcastReq(context: CallContext, param: BroadcastParam) {
  const { req, protocol, host, logger } = context
  const { transactionHex } = param
  const url = `${protocol}://${host}?requestType=broadcastTransaction`;
  return req.post(url, { form: { transactionBytes: transactionHex } }, [200, 201]);
}