"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.balanceLookup = void 0;
const heat_server_common_1 = require("heat-server-common");
const token_discovery_1 = require("./token_discovery");
async function balanceLookup(context, param) {
    const { assetType, addrXpub, blockchain, assetId } = param;
    const response = await token_discovery_1.tokenDiscovery(context, {
        blockchain,
        assetType,
        addrXpub
    });
    if (response.value) {
        let entry = response.value.find(entry => entry.assetType == assetType &&
            heat_server_common_1.compareCaseInsensitive(entry.assetId, assetId));
        return {
            value: {
                value: entry ? entry.value : '0',
                exists: entry ? entry.exists : false,
            },
        };
    }
    return { error: response.error };
}
exports.balanceLookup = balanceLookup;
//# sourceMappingURL=balance_lookup.js.map