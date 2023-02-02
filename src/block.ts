import { Transaction } from './transaction'
import { AnnotatedError, BlockObjectType } from './message'
import { ObjectStorage } from './store'

// 
export class Block {
    static fromNetworkObject(txObj: BlockObjectType): Block {
        let txids: string[] = []
        let nonce: string
        let previd: string | null
        let created: number
        let T: string
        let miner: string
        let note: string
        let height: number | null = null

        // decompose block object and verify that everything is good

        // PoW

        // loop through transactions and process


        // if (SpendingTransactionObject.guard(txObj)) {
        //     inputs = Transaction.inputsFromNetworkObject(txObj.inputs)
        // }
        // else {
        //     height = txObj.height
        // }
        // const outputs = Transaction.outputsFromNetworkObject(txObj.outputs)

        return new Block(ObjectStorage.id(txObj), txids, nonce, previd, created, T, miner, note, height)
    }
    async validate() {
        // const unsignedTxStr = canonicalize(this.toNetworkObject(false))

        // if (this.inputs.length == 0) {
        //   // assume all coinbases are valid for now
        //   return
        // }

        // const inputValues = await Promise.all(
        //   this.inputs.map(async (input, i) => {
        //     const prevOutput = await input.outpoint.resolve()

        //     if (input.sig === null) {
        //       throw new AnnotatedError('INVALID_TX_SIGNATURE', `No signature available for input ${i} of transaction ${this.txid}`)
        //     }
        //     if (!await ver(input.sig, unsignedTxStr, prevOutput.pubkey)) {
        //       throw new AnnotatedError('INVALID_TX_SIGNATURE', `Signature validation failed for input ${i} of transaction ${this.txid}`)
        //     }

        //     return prevOutput.value
        //   })
        // )
        // let sumInputs = 0
        // let sumOutputs = 0

        // for (const inputValue of inputValues) {
        //   sumInputs += inputValue
        // }
        // for (const output of this.outputs) {
        //   sumOutputs += output.value
        // }
        // if (sumInputs < sumOutputs) {
        //   throw new AnnotatedError('INVALID_TX_CONSERVATION', `Transaction ${this.txid} does not respect the Law of Conservation. Inputs summed to ${sumInputs}, while outputs summed to ${sumOutputs}.`)
        // }
    }
}