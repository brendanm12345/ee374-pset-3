export class UTXO {
    UTXO_set: Set<string> = new Set()

    check_in_set(input: string) {
        return this.UTXO_set.has(input)
    }

    add_to_set(txid: string) {
        this.UTXO_set.add(txid)
    }

    remove_from_set(txid: string) {
        this.UTXO_set.delete(txid)
    }
}

export const utxo = new UTXO()