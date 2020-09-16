import { PublicKeyLookupParam, PublicKeyLookupResult, tryParse, CallContext, ModuleResponse, prettyPrint } from 'heat-server-common'
import { isFunction, isString } from 'lodash';

export async function publicKeyLookup(context: CallContext, param: PublicKeyLookupParam): Promise<ModuleResponse<PublicKeyLookupResult>> {
  try {
    const { req, protocol, host, logger, middleWare } = context
    const { addrXpub } = param
    const addrXpub_ =
    middleWare && isFunction(middleWare.getAddress)
      ? await middleWare.getAddress(addrXpub)
      : addrXpub;    
    const url = `${protocol}://${host}?requestType=getAccount&account=${addrXpub}&includeLessors=false&includeAssets=false&includeAssetDetails=false&includeCurrencies=false&includeEffectiveBalance=false`;
    const json = await req.get(url);
    const data = tryParse(json, logger);
    if (isString(data.account)) {
      return {
        value: {
          publicKey: data.publicKey,
        },
      };
    } else {
      logger.warn(`No public key for ${addrXpub} ${prettyPrint(data)}`);
      return {
        value: {
          publicKey: null,
        },
      };
    }
  } catch (e) {
    return {
      error: e.message,
    };
  }
}