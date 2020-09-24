import { Logger } from '@nestjs/common';
import { MonitoredRequest, CallContext } from 'heat-server-common';
import { FIMK_GETADDRESS } from '../src/index'

export const testConfig = {
  protocol: 'https',
  host: 'cloud.mofowallet.org:7886/nxt'
}

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

