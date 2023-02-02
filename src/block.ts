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

const checkBlockFormat = (block: any): Block | string => {
    const requiredFields = [
        "T",
        "created",
        "miner",
        "nonce",
        "note",
        "previd",
        "txids",
        "type"
    ];

    for (const field of requiredFields) {
        if (!(field in block)) {
            throw new AnnotatedError('INVALID_FORMAT', `Block is missing some required fields: ${field}`)
        }
    }

    if (
        typeof block.T !== "string" ||
        block.T.length !== 64 ||
        !/^[0-9a-fA-F]+$/.test(block.T)
    ) {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid T field format`)
    }

    if (typeof block.created !== "number") {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid created field format.`)
    }

    if (typeof block.miner !== "string") {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid miner field format.`)
    }

    if (
        typeof block.nonce !== "string" ||
        block.nonce.length !== 64 ||
        !/^[0-9a-fA-F]+$/.test(block.nonce)
    ) {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid nonce field format.`)
    }

    if (typeof block.note !== "string") {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid note field format.`)
    }

    if (
        typeof block.previd !== "string" ||
        block.previd.length !== 64 ||
        !/^[0-9a-fA-F]+$/.test(block.previd)
    ) {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid previd field format.`)
    }

    if (!Array.isArray(block.txids) || !block.txids.every((txid: any) => typeof txid === "string")) {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid txids field format.`)
    }

    if (typeof block.type !== "string" || block.type !== "block") {
        throw new AnnotatedError('INVALID_FORMAT', `Invalid type field format.`)
    }

    return block as Block;
};

export class Block {
    txids: string[]
    nonce: string
    previd: string | null
    created: number
    T: string
    miner: string
    note: string
    type: string

    static fromNetworkObject(blockObj: BlockObjectType): Block {
        let txids: string[] = blockObj.txids
        let nonce: string = blockObj.nonce
        let previd: string | null = blockObj.previd
        let created: number = blockObj.created
        let T: string = blockObj.T
        let miner: string = blockObj.miner
        let note: string = blockObj.note
        let type: string = blockObj.type

        return new Block(txids, nonce, previd, created, T, miner, note, type);
    }
    constructor(txids: string[], nonce: string, previd: string | null, created: number, T: string, miner: string, note: string, type: string) {
        this.txids = txids
        this.nonce = nonce
        this.previd = previd
        this.created = created
        this.T = T
        this.miner = miner
        this.note = note
        this.type = type
    }

    async check_coinbase(tx: Transaction) {
        if (tx.inputs.length != 0) {
            throw new AnnotatedError('INVALID_BLOCK_COINBASE', `Coinbase transaction has inputs`)
        }
        if (tx.outputs.length != 1) {
            throw new AnnotatedError('INVALID_FORMAT', `Coinbase transaction has more than one output`)
        }
        // Check if the coinbase transaction has a height
        if (tx.height == null) {
            throw new AnnotatedError('INVALID_FORMAT', `Coinbase transaction has no height`)
        }
        // Check if public key is a valid format
        if (tx.outputs[0].pubkey.length != 66) {
            throw new AnnotatedError('INVALID_FORMAT', `Coinbase transaction has invalid public key`)
        }
        // Check if the coinbase transaction is less than 50 x 10^12  + (sum of inputs minus sum of outputs)
        if (tx.outputs[0].value > 5000000000000 + (0 - tx.outputs[0].value)) {
            throw new AnnotatedError('INVALID_BLOCK_COINBASE', `Coinbase transaction has invalid value`)
        }
    }

    async check_UTXO(tx: Transaction){
        // See if tx is in UTXO_set
        for (var input in tx.inputs) {
            if (!utxo.check_in_set(input)) {
                throw new AnnotatedError('INVALID_TX_OUTPOINT', `Block is missing required fields`)
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
            } catch (error) {
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
                throw new AnnotatedError('UNFINDABLE_OBJECT', `Block did not pass proof of work`)
            }

            const tx = Transaction.fromNetworkObject(await ObjectStorage.get(txid))
            await tx.validate()

            // Check that each input transaction corresponds to an output that is in the UTXO set
            await this.check_UTXO(tx)

            // Check for valid coinbase transaction
            if (txid == this.txids[0]) {
                await this.check_coinbase(tx)
            }
        }
        // Adding the block to db
        await ObjectStorage.put(ObjectStorage.id(this))
    }
}