"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenDiscovery = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
async function tokenDiscovery(context, param) {
    try {
        const { req, protocol, host, logger, middleWare } = context;
        const { addrXpub } = param;
        const addrXpub_ = middleWare && lodash_1.isFunction(middleWare.getAddress)
            ? await middleWare.getAddress(addrXpub)
            : addrXpub;
        const url = `${protocol}://${host}?requestType=getAccount&includeAssets=true&account=${addrXpub_}`;
        const json = await req.get(url);
        const data = heat_server_common_1.tryParse(json, logger);
        const value = [];
        if (lodash_1.isString(data.unconfirmedBalanceNQT)) {
            value.push({
                assetId: '0',
                assetType: heat_server_common_1.AssetTypes.NATIVE,
                value: data.unconfirmedBalanceNQT || '0',
                exists: true,
            });
            if (Array.isArray(data.assetBalances)) {
                data.assetBalances.forEach(assetBalance => {
                    value.push({
                        assetId: assetBalance.asset,
                        assetType: heat_server_common_1.AssetTypes.TOKEN_TYPE_1,
                        value: assetBalance.balanceQNT || '0',
                        exists: true,
                    });
                });
            }
        }
        else {
            value.push({
                assetId: '0',
                assetType: heat_server_common_1.AssetTypes.NATIVE,
                value: '0',
                exists: false,
            });
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
exports.tokenDiscovery = tokenDiscovery;
//# sourceMappingURL=token_discovery.js.map