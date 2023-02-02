export class UTXO {
    UTXO_set: Set<string> = new Set()
    
    update_set(txid: string) {
        this.UTXO_set.add(txid)
    }
}