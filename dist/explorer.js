"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Explorer = void 0;
const heat_server_common_1 = require("heat-server-common");
const balance_lookup_1 = require("./modules/balance_lookup");
const event_lookup_1 = require("./modules/event_lookup");
const network_status_1 = require("./modules/network_status");
const publickey_lookup_1 = require("./modules/publickey_lookup");
const token_discovery_1 = require("./modules/token_discovery");
const transaction_status_1 = require("./modules/transaction_status");
const broadcast_1 = require("./modules/broadcast");
const custom_fimk_dgs_good_1 = require("./modules/custom_fimk_dgs_good");
const ID = "fimk";
const modules = {
    balanceLookup: balance_lookup_1.balanceLookup,
    eventLookup: event_lookup_1.eventLookup,
    broadcast: broadcast_1.broadcast,
    networkStatus: network_status_1.networkStatus,
    publicKeyLookup: publickey_lookup_1.publicKeyLookup,
    tokenDiscovery: token_discovery_1.tokenDiscovery,
    transactionStatus: transaction_status_1.transactionStatus,
    customFimkDgsGood: custom_fimk_dgs_good_1.customFimkDgsGood,
};
class Explorer extends heat_server_common_1.ExplorerBase {
    constructor(protocol, host, rateLimiter, apiKey, middleWare) {
        super(ID, protocol, host, modules, middleWare);
        this.host = host;
        this.rateLimiter = rateLimiter;
    }
}
exports.Explorer = Explorer;
//# sourceMappingURL=explorer.js.map