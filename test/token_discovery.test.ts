import * as chai from 'chai';
const { isObject, isTrue, isNumber, isString, isArray, isBoolean } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { tokenDiscovery } from '../src/modules/token_discovery';
import { Blockchains, AssetTypes } from 'heat-server-common';

describe('Token Discovery', () => {
  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const assetType: AssetTypes = AssetTypes.NATIVE
    const addrXpub: string = 'FIM-5JCD-ESDK-CHK6-FFJX2'
    let resp = await tokenDiscovery(createContext('Token'), {
      blockchain, assetType, addrXpub
    })
    //console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isArray(result)
    for (const token of result) {
      isObject(token)
      isString(token.assetId)
      isNumber(token.assetType)
      isString(token.value)
      isBoolean(token.exists)
    }
  });
});