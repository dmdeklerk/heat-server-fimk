import * as chai from 'chai';
const { isObject, isTrue, isNumber, isString, isArray, isBoolean } = chai.assert
import 'mocha';
import { createContext } from './test_config'
import { eventLookup } from '../src/modules/event_lookup';
import { Blockchains, AssetTypes } from 'heat-server-common';

describe('Event Lookup', () => {
  it('should be able to skip', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const assetType: AssetTypes = AssetTypes.NATIVE
    const addrXpub: string = '8426830062500828617'
    const assetId: string = '0'
    const from: number = 100
    const to: number = 200
    const minimal: boolean = false

    let resp = await eventLookup(createContext('Event'), {
      blockchain, assetType, assetId, addrXpub, from, to, minimal
    })
    // console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isArray(result)
    chai.expect(result!.length).to.equal(100)

    const txnids = result?.map((txn) => txn.sourceId)
    const asSet = new Set(txnids)
    chai.expect(Array.from(asSet).length).to.equal(100)
  });

  it('should limit results based on from and to', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const assetType: AssetTypes = AssetTypes.NATIVE
    const addrXpub: string = '8426830062500828617'
    const assetId: string = '0'
    const from: number = 0
    const to: number = 20
    const minimal: boolean = false

    let resp = await eventLookup(createContext('Event'), {
      blockchain, assetType, assetId, addrXpub, from, to, minimal
    })
    // console.log('response', resp)
    isObject(resp)
    let result = resp.value
    isArray(result)
    chai.expect(result!.length).to.equal(20)
  });

  it('should work', async () => {
    const blockchain: Blockchains = Blockchains.FIMK
    const assetType: AssetTypes = AssetTypes.NATIVE
    const addrXpub: string = 'FIM-FHNN-4T8T-Q8HG-BAJ2U'
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
    for (const entry of result!) {
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