import { TokenDiscoveryParam, TokenDiscoveryResult, tryParse, CallContext, ModuleResponse, AssetTypes } from 'heat-server-common'
import { isString, isFunction } from 'lodash';

interface AssetBalanceApiResponse {
  balanceQNT: string;
  asset: string;
}

interface TokenDiscoveryApiResponse {
  unconfirmedBalanceNQT: string;
  balanceNQT: string;
  assetBalances: Array<AssetBalanceApiResponse>;
}

export async function tokenDiscovery(context: CallContext, param: TokenDiscoveryParam): Promise<ModuleResponse<Array<TokenDiscoveryResult>>> {
  try {
    const { req, protocol, host, logger, middleWare } = context
    const { addrXpub } = param
    const addrXpub_ =
      middleWare && isFunction(middleWare.getAddress)
        ? await middleWare.getAddress(addrXpub)
        : addrXpub;
    const url = `${protocol}://${host}?requestType=getAccount&includeAssets=true&account=${addrXpub_}`;
    const json = await req.get(url);
    const data: TokenDiscoveryApiResponse = tryParse(json, logger);
    const value = [];
    if (isString(data.unconfirmedBalanceNQT)) {
      value.push({
        assetId: '0',
        assetType: AssetTypes.NATIVE,
        value: data.unconfirmedBalanceNQT || '0',
        exists: true,
      });
      if (Array.isArray(data.assetBalances)) {
        data.assetBalances.forEach(assetBalance => {
          value.push({
            assetId: assetBalance.asset,
            assetType: AssetTypes.TOKEN_TYPE_1,
            value: assetBalance.balanceQNT || '0',
            exists: true,
          });
        });
      }
    } else {
      value.push({
        assetId: '0',
        assetType: AssetTypes.NATIVE,
        value: '0',
        exists: false,
      });
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