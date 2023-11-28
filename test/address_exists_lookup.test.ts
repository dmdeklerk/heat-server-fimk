import * as chai from 'chai';
const { isObject, isTrue, isFalse } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { addressExistsLookup } from '../src/modules/address_exists_lookup';
import { Blockchains } from 'heat-server-common';

describe('Address Exists', () => {
  it('should work for existing', async () => {
    let resp = await addressExistsLookup(createContext('Address Exists'), {
      blockchain: Blockchains.FIMK,
      addrXpub: 'FIM-VDAK-EKPL-CKKP-E9DUJ'
    })
    //console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    isTrue(result?.exists)
  });
  it('should work for non existing', async () => {
    let resp = await addressExistsLookup(createContext('Address Exists'), {
      blockchain: Blockchains.FIMK,
      addrXpub: '222222222222222'
    })
    //console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    isFalse(result?.exists)
  });

});