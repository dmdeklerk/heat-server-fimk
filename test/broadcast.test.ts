import * as chai from 'chai';
const { isObject, isTrue, isNumber, isString } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { broadcast } from '../src/modules/broadcast';
import { Blockchains, AssetTypes } from 'heat-server-common';

describe('Broadcast', () => {
  it('should work', async () => {
    const blockchain = Blockchains.FIMK
    const transactionHex = '01ABAB'
    const assetType = AssetTypes.NATIVE
    let resp = await broadcast(createContext('Broadcast'), {
      blockchain, transactionHex, assetType
    })
    //console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    if (result.transactionId) isString(result.transactionId)
    if (result.errorMessage) isString(result.errorMessage)
  });
});