import * as chai from 'chai';
const { isObject } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { Blockchains } from 'heat-server-common';
import { customFimkDgsGood } from '../src/modules/custom_fimk_dgs_good';
import { isBoolean, isNumber, isString } from 'lodash';

describe('DGS Good', () => {
  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const goods: string = '14082828309544063421'
    let resp = await customFimkDgsGood(createContext('DGSGood'), {
      blockchain, goods, includeCounts: true
    })
    console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    isString(result.seller)
    isNumber(result.quantity)
    isString(result.goods)
    isString(result.description)
    isString(result.seller)
    isString(result.sellerRS)
    isString(result.sellerEmail)
    isBoolean(result.delisted)
    isString(result.tags)
    isString(result.priceNQT)
    isNumber(result.numberOfPublicFeedbacks)
    isString(result.name)
    isNumber(result.numberOfPurchases)
    isNumber(result.expiry)
    isNumber(result.timestamp)
  });
});