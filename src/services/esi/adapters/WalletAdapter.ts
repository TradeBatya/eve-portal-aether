import { BaseAdapter } from './BaseAdapter';

export interface WalletBalance {
  balance: number;
  lastUpdated: string;
}

export interface WalletJournalEntry {
  id: number;
  date: string;
  refType: string;
  firstPartyId?: number;
  firstPartyName?: string;
  secondPartyId?: number;
  secondPartyName?: string;
  amount: number;
  balance?: number;
  reason?: string;
  description?: string;
}

export interface WalletTransaction {
  transactionId: number;
  date: string;
  typeId: number;
  typeName?: string;
  quantity: number;
  unitPrice: number;
  clientId: number;
  clientName?: string;
  locationId: number;
  locationName?: string;
  isBuy: boolean;
  isPersonal: boolean;
}

/**
 * WalletAdapter - Wallet and transaction data
 */
export class WalletAdapter extends BaseAdapter {
  
  async getBalance(characterId: number): Promise<WalletBalance> {
    // Phase 2: Don't block request if scopes missing - Edge Function will validate
    try {
      await this.validateToken(characterId, ['esi-wallet.read_character_wallet.v1']);
    } catch (err) {
      console.warn('[WalletAdapter] Scope validation warning:', err);
      // Continue - Edge Function will check permissions
    }
    
    this.log(`Fetching balance for character ${characterId}`);

    const balance = await this.fetchWithRetry<number>(
      `/characters/${characterId}/wallet/`,
      characterId,
      { ttl: 300 }
    );

    return {
      balance,
      lastUpdated: new Date().toISOString()
    };
  }

  async getJournal(characterId: number, fromDate?: Date): Promise<WalletJournalEntry[]> {
    try {
      await this.validateToken(characterId, ['esi-wallet.read_character_wallet.v1']);
    } catch (err) {
      console.warn('[WalletAdapter] Scope validation warning:', err);
    }
    this.log(`Fetching wallet journal for character ${characterId}`);

    const data = await this.fetchPaginated<any>(
      `/characters/${characterId}/wallet/journal/`,
      characterId,
      5 // Max 5 pages
    );

    let entries = data.map(entry => ({
      id: entry.id,
      date: entry.date,
      refType: entry.ref_type,
      firstPartyId: entry.first_party_id,
      secondPartyId: entry.second_party_id,
      amount: entry.amount,
      balance: entry.balance,
      reason: entry.reason,
      description: entry.description
    }));

    // Filter by date if provided
    if (fromDate) {
      const fromTime = fromDate.getTime();
      entries = entries.filter(entry => new Date(entry.date).getTime() >= fromTime);
    }

    return entries;
  }

  async getTransactions(characterId: number, limit: number = 100): Promise<WalletTransaction[]> {
    try {
      await this.validateToken(characterId, ['esi-wallet.read_character_wallet.v1']);
    } catch (err) {
      console.warn('[WalletAdapter] Scope validation warning:', err);
    }
    this.log(`Fetching wallet transactions for character ${characterId}`);

    const data = await this.fetchWithRetry<any[]>(
      `/characters/${characterId}/wallet/transactions/`,
      characterId,
      { ttl: 300 }
    );

    const transactions = data.slice(0, limit).map(tx => ({
      transactionId: tx.transaction_id,
      date: tx.date,
      typeId: tx.type_id,
      typeName: undefined as string | undefined,
      quantity: tx.quantity,
      unitPrice: tx.unit_price,
      clientId: tx.client_id,
      locationId: tx.location_id,
      isBuy: tx.is_buy,
      isPersonal: tx.is_personal
    }));

    // Resolve type names
    const typeIds = transactions.map(tx => tx.typeId);
    const typeNames = await this.nameResolver.getNames(typeIds);
    
    transactions.forEach(tx => {
      tx.typeName = typeNames.get(tx.typeId) || `[${tx.typeId}]`;
    });

    return transactions;
  }

  /**
   * Get wallet summary with balance and recent activity
   */
  async getSummary(characterId: number): Promise<any> {
    try {
      await this.validateToken(characterId, ['esi-wallet.read_character_wallet.v1']);
    } catch (err) {
      console.warn('[WalletAdapter] Scope validation warning:', err);
    }
    this.log(`Fetching wallet summary for character ${characterId}`);

    const [balance, recentJournal, recentTransactions] = await Promise.all([
      this.getBalance(characterId),
      this.getJournal(characterId).then(j => j.slice(0, 10)),
      this.getTransactions(characterId, 10)
    ]);

    // Calculate income/expense from recent journal
    let income = 0;
    let expense = 0;

    recentJournal.forEach(entry => {
      if (entry.amount > 0) {
        income += entry.amount;
      } else {
        expense += Math.abs(entry.amount);
      }
    });

    return {
      balance: balance.balance,
      lastUpdated: balance.lastUpdated,
      recentIncome: income,
      recentExpense: expense,
      netChange: income - expense,
      recentJournal,
      recentTransactions
    };
  }

  /**
   * Refresh wallet data
   */
  async refresh(characterId: number): Promise<void> {
    this.log(`Refreshing wallet data for character ${characterId}`);
    
    await this.invalidateCache(`char:${characterId}:wallet`);
    
    // Force fresh fetch
    await this.getSummary(characterId);
  }
}

export const walletAdapter = new WalletAdapter();
