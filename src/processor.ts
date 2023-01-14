import { TypeormDatabase } from "@subsquid/typeorm-store";
import { EvmBatchProcessor, EvmBlock} from '@subsquid/evm-processor'
import { events } from "./abi/DaiToken";
import { Transfer, Approval, Balance } from "./model/generated";
import { LogItem } from "@subsquid/evm-processor/lib/interfaces/dataSelection";
import { In } from "typeorm";

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
  .setBlockRange({ from: 16304017 })
  .addLog('0x4Fabb145d64652a948d72533023f6E7A623C7C53', {
    filter: [[
      events.Approval.topic,
      events.Transfer.topic,
   ]],
    data: {
        evmLog: {
            topics: true,
            data: true,
            transaction: true
        },
        transaction: {
          hash: true,
      },
    } as const,
});


processor.run(new TypeormDatabase(), async (ctx) => {
    const approvals: Approval[] = []
    const transfers: Transfer[] = []

    const balanceUpdates: Map<string, bigint> = new Map()

    for (const block of ctx.blocks) {
      for (const item of block.items) {
        if (item.kind !== 'evmLog') {
          continue
        }
        if (item.evmLog.topics[0] == events.Approval.topic) {
          const approval = decodeApproval(block.header, item)
          approvals.push(approval)
        }
        if (item.evmLog.topics[0] == events.Transfer.topic) {
          const transfer = decodeTransfer(block.header, item)
          transfers.push(transfer)
        }
      }
    }

    // collect the state delta for balances from the transfers
    // in the batch
    transfers.map((t) => {
      const balanceFrom = balanceUpdates.get(t.from) ?? 0n
      balanceUpdates.set(t.from, balanceFrom - t.value)

      const balanceTo = balanceUpdates.get(t.to) ?? 0n
      balanceUpdates.set(t.to, balanceTo + t.value)
    })

    const oldBalances = await ctx.store
        .findBy(Balance, {id: In([...balanceUpdates.keys()])})

    // join new and old balances
    oldBalances.forEach((b) => {
      const balanceUpdate =  balanceUpdates.get(b.id) ?? 0n
      balanceUpdates.set(b.id, balanceUpdate + b.value)
    })

    const newBalances = Array.from(balanceUpdates.keys()).map((id) => new Balance({id, value: balanceUpdates.get(id)}))

    await ctx.store.save(approvals)
    await ctx.store.save(transfers)
    await ctx.store.save(newBalances)

    ctx.log.info(`Persisted ${approvals.length} approvals, ${transfers.length} transfers, ${newBalances.length} balance updates`)
});


function decodeTransfer(
  block: EvmBlock,
  item: LogItem<{evmLog: {topics: true; data: true}; transaction: {hash: true}}>
): Transfer {
  let event = events.Transfer.decode(item.evmLog)
  return new Transfer({
      id: `${item.transaction.hash}-${item.evmLog.index}`,
      blockNumber: BigInt(block.height),
      blockTimestamp: BigInt(block.timestamp),
      transactionHash: item.transaction.hash,
      from: event._from,
      to: event._to,
      value: event._value.toBigInt(),
  })
}


function decodeApproval(
  block: EvmBlock,
  item: LogItem<{evmLog: {topics: true; data: true}; transaction: {hash: true}}>
): Approval {
  let event = events.Approval.decode(item.evmLog)

  return new Approval({
    id: `${item.transaction.hash}-${item.evmLog.index}`,
    blockNumber: BigInt(block.height),
    blockTimestamp: BigInt(block.timestamp),
    transactionHash: item.transaction.hash,
    owner: event._owner,
    spender: event._spender,
    value: event._value.toBigInt(),
  })

}
