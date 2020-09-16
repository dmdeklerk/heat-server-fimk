import { NetworkStatusParam, NetworkStatusResult, tryParse, CallContext, ModuleResponse } from 'heat-server-common'

export async function networkStatus(context: CallContext, param: NetworkStatusParam): Promise<ModuleResponse<NetworkStatusResult>> {
  try {
    const { req, protocol, host, logger } = context
    const url = `${protocol}://${host}?requestType=getBlock`;
    const json = await req.get(url);
    const data = tryParse(json, logger);
    // "195310367"
    const lastBlockTime = new Date(
      Date.UTC(2013, 10, 24, 12, 0, 0, 0) + data.timestamp * 1000,
    );
    const lastBlockHeight = data.height;
    const lastBlockId = data.block;
    return {
      value: {
        lastBlockTime,
        lastBlockHeight,
        lastBlockId,
      },
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}