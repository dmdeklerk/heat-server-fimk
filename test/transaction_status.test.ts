import * as chai from 'chai';
const { isObject, isNumber, isBoolean } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { transactionStatus } from '../src/modules/transaction_status';
import { Blockchains, AssetTypes } from 'heat-server-common';

describe('Transaction Status', () => {
  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const assetType: AssetTypes = AssetTypes.NATIVE
    const addrXpub: string = 'FIM-34B3-PWY5-TMHC-9JYW8'
    const transactionId: string = '17969731842336387666'
    let resp = await transactionStatus(createContext('Transaction'), {
      blockchain, assetType, addrXpub, transactionId
    })
    console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    isNumber(result.confirmations)
    isBoolean(result.isAccepted)
  });
});