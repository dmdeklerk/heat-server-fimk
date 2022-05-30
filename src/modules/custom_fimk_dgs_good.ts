import {
  Blockchains,
  CallContext,
  CustomFimkDgsGoodParam,
  CustomFimkDgsGoodResult,
  ModuleResponse,
  tryParse,
} from "heat-server-common";
import { isEmpty, isString } from "lodash";
import { publicKeyLookup } from './publickey_lookup'

export async function customFimkDgsGood(
  context: CallContext,
  param: CustomFimkDgsGoodParam
): Promise<ModuleResponse<CustomFimkDgsGoodResult>> {
  try {
    const { req, protocol, host, logger } = context;
    const { goods, includeCounts } = param;
    const url = `${protocol}://${host}?requestType=getDGSGood&goods=${goods}&includeCounts=${includeCounts}`;
    const json = await req.get(url);
    const data: CustomFimkDgsGoodResult = tryParse(json, logger);
    const { seller } = data;
    if (isString(seller)) {
      const publicKey = await getPublicKey(context, param.blockchain, seller);
      data.sellerPublicKey = publicKey;
    }
    return {
      value: data,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}

const publicKeyCache = new Map<string, string>();
async function getPublicKey(context: CallContext, blockchain: Blockchains, addrXpub: string,): Promise<string> {
  const { logger } = context
  if (publicKeyCache.has(addrXpub)) {
    return publicKeyCache.get(addrXpub);
  }

  const response = await publicKeyLookup(context, { blockchain, addrXpub });
  if (response.error) {
    logger.error(`public key lookup failed: ${response.error}`);
    return ''
  }
  else if (!isString(response.value?.publicKey)) {
    logger.error(`public key lookup returns null`);
    return ''
  }
  const publicKey = response.value?.publicKey ?? '';
  if (!isEmpty(publicKey)) {
    publicKeyCache.set(addrXpub, publicKey);
  }
  return publicKey;
}