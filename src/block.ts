import { Transaction } from './transaction'
import { AnnotatedError, BlockObjectType } from './message'
import { ObjectStorage } from './store'
import { network } from './network'


const target = "00000000abc00000000000000000000000000000000000000000000000000000"

function checkProofofWork(objId: string) {
    console.log('about to check PoW')
    return objId < target;
}
export class Block {
    txids: string[]
    nonce: string
    previd: string | null
    created: number
    T: string
    miner: string
    note: string

    static fromNetworkObject(blockObj: BlockObjectType): Block {
        let txids: string[] = blockObj.txids
        let nonce: string = blockObj.nonce
        let previd: string | null = blockObj.previd
        let created: number = blockObj.created
        let T: string = blockObj.T
        let miner: string = blockObj.miner
        let note: string = blockObj.note

        // decompose block object and verify that everything is good





        // loop through transactions and process


        // if (SpendingTransactionObject.guard(txObj)) {
        //     inputs = Transaction.inputsFromNetworkObject(txObj.inputs)
        // }
        // else {
        //     height = txObj.height
        // }
        // const outputs = Transaction.outputsFromNetworkObject(txObj.outputs)

        return new Block(txids, nonce, previd, created, T, miner, note);
    }
    constructor(txids: string[], nonce: string, previd: string | null, created: number, T: string, miner: string, note: string,) {
        this.txids = txids
        this.nonce = nonce
        this.previd = previd
        this.created = created
        this.T = T
        this.miner = miner
        this.note = note
    }
    async validate() {
        console.log('about to validate block')
        // check that block has required fields and that they're in right format
        if (false) {
            return
        }

        if (this.T != target) {
            throw new AnnotatedError('INVALID_FORMAT', `Block target is different from required target`)
        }

        if (!checkProofofWork(ObjectStorage.id(this))) {
            throw new AnnotatedError('INVALID_BLOCK_POW', `Block did not pass proof of work`)
        }

        // loop through the txids checking if theres a corresponding txn in local if not send get object 
        for (var tx in this.txids) {
            try {
                if (await ObjectStorage.get(tx)) {
                    continue
                }
            } catch (error) {
                for (let peer of network.peers) {
                    peer.sendMessage({
                        type: 'getobject',
                        object: tx
                    })
                }
                try {
                    if (await ObjectStorage.get(tx)) {
                        continue
                    }
                } catch {
                    throw new AnnotatedError('UNFINDABLE_OBJECT', `Couldn't find object ${tx}`)

                }
            }
        }
    }
}