import {
  CallContext,
  CustomFimkDgsGoodParam,
  CustomFimkDgsGoodResult,
  ModuleResponse,
  tryParse,
} from "heat-server-common";

export async function customFimkDgsGood(
  context: CallContext,
  param: CustomFimkDgsGoodParam
): Promise<ModuleResponse<CustomFimkDgsGoodResult>> {
  try {
    const { req, protocol, host, logger } = context;
    const { goods, includeCounts } = param;
    const url = `${protocol}://${host}?requestType=getDGSGood&goods=${goods}&includeCounts=${includeCounts}`;
    const json = await req.get(url);
    const data = tryParse(json, logger);
    return {
      value: data,
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
}
