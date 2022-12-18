import { TypeormDatabase } from "@subsquid/typeorm-store";
import {decodeHex, EvmBatchProcessor} from '@subsquid/evm-processor'
import { events } from "./abi/DaiToken";
import { ethers } from "ethers";
import { Gravatar } from "./model/generated/gravatar.model";

const processor = new EvmBatchProcessor()
  .setDataSource({
    // uncomment and set RPC_ENDPOINT to enable contract state queries.
    // Both https and wss endpoints are supported.
    // chain: process.env.RPC_ENDPOINT,

    // Change the Archive endpoints for run the squid
    // against the other EVM networks
    // For a full list of supported networks and config options
    // see https://docs.subsquid.io/develop-a-squid/evm-processor/configuration/

    archive: 'https://eth.archive.subsquid.io',
  })
  .setBlockRange({ from: 15175243 })
  .addLog('0xdac17f958d2ee523a2206206994597c13d831ec7', {
    filter: [[
      //events.Approval.topic,
      events.Transfer.topic,
   ]],
    data: {
        evmLog: {
            topics: true,
            data: true,
        },
    } as const,
});


processor.run(new TypeormDatabase(), async (ctx) => {
    const gravatars: Map<string, Gravatar> = new Map();
    for (const c of ctx.blocks) {
      for (const e of c.items) {
        if(e.kind !== "evmLog") {
          continue
        }
        const { _from, _to, _value} = extractData(e.evmLog)
        gravatars.set('1', new Gravatar({
          id: '1',
          owner: decodeHex(_from),

        }))
      }
    }
    await ctx.store.save([...gravatars.values()])
});


function extractData(evmLog: any): { _from: string, _to: string, _value: ethers.BigNumber} {
  if (evmLog.topics[0] === events.Transfer.topic) {
    return events.Transfer.decode(evmLog)
  }
  if (evmLog.topics[0] === events.Approval.topic) {
    return events.Approval.decode(evmLog)
  }
  throw new Error('Unsupported topic')
}
