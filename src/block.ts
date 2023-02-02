import { Transaction } from './transaction'
import { AnnotatedError, BlockObjectType } from './message'
import { ObjectStorage } from './store'
import { network } from './network'
import { utxo } from './UTXO'


const target = "00000000abc00000000000000000000000000000000000000000000000000000"

function checkProofofWork(objId: string) {
    console.log('about to check PoW')
    //return objId < target;
    return true
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

    async check_UTXO(tx: Transaction){
        // See if tx is in UTXO_set
        for (var input in tx.inputs) {
            if (!utxo.check_in_set(input)) {
                // INVALID_TX_OUTPOINT
                return;
            }
            utxo.remove_from_set(input)
        }
        for (var output in tx.outputs) {
            utxo.add_to_set(output)
        }
    }

    async check_tx_exists(txid: string) {
        try {
            await ObjectStorage.get(txid)
        } catch (error) {
            for (let peer of network.peers) {
                peer.sendMessage({
                    type: 'getobject',
                    object: txid
                })
            }
            try {
                await ObjectStorage.get(txid)
            } catch {
                throw new AnnotatedError('UNFINDABLE_OBJECT', `Couldn't find object ${txid}`)

            }
        }
    }
        

    async validate() {
        console.log('about to validate block')
        // check that the block contains all the required fields
        if (this.txids == null || this.nonce == null || this.previd == null || this.created == null || this.T == null || this.miner == null || this.note == null) {
            throw new AnnotatedError('INVALID_FORMAT', `Block is missing required fields`)
        }
        

        if (this.T != target) {
            throw new AnnotatedError('INVALID_FORMAT', `Block target is different from required target`)
        }

        if (!checkProofofWork(ObjectStorage.id(this))) {
            throw new AnnotatedError('INVALID_BLOCK_POW', `Block did not pass proof of work`)
        }

        for (var txid in this.txids) {
            // If the transaction does not exist, scrap the whole block and throw error
            if (!this.check_tx_exists(txid)) {
                // Throw error UNFINDABLE_OBJECT
                return;
            }

            const tx = Transaction.fromNetworkObject(await ObjectStorage.get(txid))
            await tx.validate()

            // Check that each input transaction corresponds to an output that is in the UTXO set
            await this.check_UTXO(tx)

            // Check for coinbase transaction

            
        }
    }
}