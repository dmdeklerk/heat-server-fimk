import * as chai from 'chai';
const { isObject, isTrue, isNumber, isString, isArray, isBoolean } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { eventLookup } from '../src/modules/event_lookup';
import { Blockchains, AssetTypes } from 'heat-server-common';

describe('Event Lookup', () => {
  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const assetType: AssetTypes = AssetTypes.NATIVE
    const addrXpub: string = 'FIM-5JCD-ESDK-CHK6-FFJX2'
    const assetId: string = '0'
    const from: number = 0
    const to: number = 100
    const minimal: boolean = false

    let resp = await eventLookup(createContext('Event'), {
      blockchain, assetType, assetId, addrXpub, from, to, minimal
    })
    // console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isArray(result)
    for (const entry of result) {
      isObject(entry)
      isNumber(entry.timestamp)
      isString(entry.sourceId)
      isNumber(entry.sourceType)
      isNumber(entry.confirmations)
      isArray(entry.events)
      for (const event of entry.events) {
        isObject(event)
        isNumber(event.type)
        isNumber(event.assetType)
        isString(event.assetId)
        isArray(event.data)
      }
    }
  });
});