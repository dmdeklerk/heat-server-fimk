export * from './explorer'
export * from './vendor/rs-address'
import { RsAddress } from './vendor/rs-address';

// Standard FIMK server
export const FIMK_GETADDRESS = function(address) {
  const addr = new RsAddress('FIM');
  addr.set(address);
  return addr.account_id();
};