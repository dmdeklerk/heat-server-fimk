"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIMK_GETADDRESS = void 0;
__exportStar(require("./explorer"), exports);
__exportStar(require("./vendor/rs-address"), exports);
const rs_address_1 = require("./vendor/rs-address");
const FIMK_GETADDRESS = function (address) {
    const addr = new rs_address_1.RsAddress('FIM');
    addr.set(address);
    return addr.account_id();
};
exports.FIMK_GETADDRESS = FIMK_GETADDRESS;
//# sourceMappingURL=index.js.map