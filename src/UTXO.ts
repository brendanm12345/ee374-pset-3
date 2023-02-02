export class UTXO {
    UTXO_set: Set<string> = new Set()

    add_set(txid: string) {
        this.UTXO_set.add(txid)
    }

    remove_set(txid: string) {
        this.UTXO_set.delete(txid)
    }
}