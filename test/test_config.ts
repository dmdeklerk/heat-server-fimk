import { MonitoredRequest, CallContext, createLogger } from 'heat-server-common';
import { FIMK_GETADDRESS } from '../src/index'

export const testConfig = {
  protocol: 'https',
  host: 'fimk1.heatwallet.com/nxt'
}

export function createContext(label?: string) {
  let { host, protocol } = testConfig;
  let logger = createLogger(label)
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

