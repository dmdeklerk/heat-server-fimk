import * as chai from 'chai';
const { isObject, isBoolean, isString } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { publicKeyLookup } from '../src/modules/publickey_lookup';
import { Blockchains } from 'heat-server-common';

describe('Publickey Lookup', () => {
  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const addrXpub: string = 'FIM-34B3-PWY5-TMHC-9JYW8'
    let resp = await publicKeyLookup(createContext('Publickey'), {
      blockchain, addrXpub
    })
    //console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isObject(result)
    isString(result.publicKey)
    chai.assert.equal(result.publicKey, 'a375c5c75157a872c8a3fca88900ad0a3100207efd734e46915490f970e4b766')
  });
});