"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicKeyLookup = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
async function publicKeyLookup(context, param) {
    try {
        const { req, protocol, host, logger, middleWare } = context;
        const { addrXpub } = param;
        const addrXpub_ = middleWare && (0, lodash_1.isFunction)(middleWare.getAddress)
            ? await middleWare.getAddress(addrXpub)
            : addrXpub;
        const url = `${protocol}://${host}?requestType=getAccount&account=${addrXpub}&includeLessors=false&includeAssets=false&includeAssetDetails=false&includeCurrencies=false&includeEffectiveBalance=false`;
        const json = await req.get(url);
        const data = (0, heat_server_common_1.tryParse)(json, logger);
        if ((0, lodash_1.isString)(data.account)) {
            return {
                value: {
                    publicKey: data.publicKey,
                },
            };
        }
        else {
            logger.warn(`No public key for ${addrXpub} ${(0, heat_server_common_1.prettyPrint)(data)}`);
            return {
                value: {
                    publicKey: null,
                },
            };
        }
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.publicKeyLookup = publicKeyLookup;
//# sourceMappingURL=publickey_lookup.js.map