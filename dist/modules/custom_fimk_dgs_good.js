"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customFimkDgsGood = void 0;
const heat_server_common_1 = require("heat-server-common");
const lodash_1 = require("lodash");
const publickey_lookup_1 = require("./publickey_lookup");
async function customFimkDgsGood(context, param) {
    try {
        const { req, protocol, host, logger } = context;
        const { goods, includeCounts } = param;
        const url = `${protocol}://${host}?requestType=getDGSGood&goods=${goods}&includeCounts=${includeCounts}`;
        const json = await req.get(url);
        const data = (0, heat_server_common_1.tryParse)(json, logger);
        const { seller } = data;
        if ((0, lodash_1.isString)(seller)) {
            const publicKey = await getPublicKey(context, param.blockchain, seller);
            data.sellerPublicKey = publicKey;
        }
        return {
            value: data,
        };
    }
    catch (e) {
        return {
            error: e.message,
        };
    }
}
exports.customFimkDgsGood = customFimkDgsGood;
const publicKeyCache = new Map();
async function getPublicKey(context, blockchain, addrXpub) {
    var _a, _b, _c;
    const { logger } = context;
    if (publicKeyCache.has(addrXpub)) {
        return publicKeyCache.get(addrXpub);
    }
    const response = await (0, publickey_lookup_1.publicKeyLookup)(context, { blockchain, addrXpub });
    if (response.error) {
        logger.error(`public key lookup failed: ${response.error}`);
        return '';
    }
    else if (!(0, lodash_1.isString)((_a = response.value) === null || _a === void 0 ? void 0 : _a.publicKey)) {
        logger.error(`public key lookup returns null`);
        return '';
    }
    const publicKey = (_c = (_b = response.value) === null || _b === void 0 ? void 0 : _b.publicKey) !== null && _c !== void 0 ? _c : '';
    if (!(0, lodash_1.isEmpty)(publicKey)) {
        publicKeyCache.set(addrXpub, publicKey);
    }
    return publicKey;
}
//# sourceMappingURL=custom_fimk_dgs_good.js.map