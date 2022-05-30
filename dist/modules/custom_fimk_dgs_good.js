"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customFimkDgsGood = void 0;
const heat_server_common_1 = require("heat-server-common");
async function customFimkDgsGood(context, param) {
    try {
        const { req, protocol, host, logger } = context;
        const { goods, includeCounts } = param;
        const url = `${protocol}://${host}?requestType=getDGSGood&goods=${goods}&includeCounts=${includeCounts}`;
        const json = await req.get(url);
        const data = (0, heat_server_common_1.tryParse)(json, logger);
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
//# sourceMappingURL=custom_fimk_dgs_good.js.map