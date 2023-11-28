import { tryParse, CallContext, ModuleResponse, AddressExistsLookupParam, AddressExistsLookupResult } from 'heat-server-common'
import { isArray, isNumber, isObjectLike } from 'lodash'

export async function addressExistsLookup(context: CallContext, param: AddressExistsLookupParam): Promise<ModuleResponse<AddressExistsLookupResult>> {
  try {
    const { req, protocol, host, logger } = context
    const { blockchain, addrXpub } = param
    const url = `${protocol}://${host}?requestType=getAccountTransactionIds&account=${addrXpub}&timestamp=0&numberOfConfirmations=0`;
    const json = await req.get(url);
    const data = tryParse(json, logger);
    if (isObjectLike(data) && isArray(data.transactionIds)) {
      return {
        value: {
          exists: data.transactionIds.length > 0
        },
      };
    }
    else if (isObjectLike(data) && data["errorDescription"] == "Unknown account") {
      return {
        value: {
          exists: false
        },
      };
    }
    else {
      return {
        error: `Unregognized response: ${JSON.stringify(data)}`
      }
    }
  } catch (e) {
    return {
      error: e.message,
    };
  }
}