import { Logger } from '@nestjs/common';
import { MonitoredRequest, CallContext } from 'heat-server-common';
import { RsAddress } from '../src/vendor/rs-address'

export const testConfig = {
  protocol: 'https',
  host: 'cloud.mofowallet.org:7886/nxt'
}

// Standard FIMK server
const FIMK_GETADDRESS = function(address) {
  const addr = new RsAddress('FIM');
  addr.set(address);
  return addr.account_id();
};

export function createContext(label?: string) {
  let { host, protocol } = testConfig;
  let logger = new Logger()
  let context: CallContext = {
    host,
    protocol,
    logger,
    req: new MonitoredRequest(logger, label ? label : ''),
    middleWare: {
      getAddress: FIMK_GETADDRESS,
    }
  }
  return context
}

