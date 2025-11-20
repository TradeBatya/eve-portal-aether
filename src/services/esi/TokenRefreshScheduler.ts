import { tokenManager } from './TokenManager';

/**
 * TokenRefreshScheduler - Фоновое обновление токенов
 * Автоматически обновляет токены за 10 минут до истечения
 */
class TokenRefreshScheduler {
  private static instance: TokenRefreshScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkInterval = 5 * 60 * 1000; // 5 минут
  private refreshThreshold = 10 * 60 * 1000; // 10 минут до истечения

  private constructor() {}

  static getInstance(): TokenRefreshScheduler {
    if (!TokenRefreshScheduler.instance) {
      TokenRefreshScheduler.instance = new TokenRefreshScheduler();
    }
    return TokenRefreshScheduler.instance;
  }

  /**
   * Запустить планировщик
   */
  start(): void {
    if (this.isRunning) {
      console.log('[TokenRefreshScheduler] Already running');
      return;
    }

    console.log('[TokenRefreshScheduler] Starting scheduler');
    this.isRunning = true;

    // Первая проверка сразу
    this.checkAndRefreshTokens();

    // Затем каждые 5 минут
    this.intervalId = setInterval(() => {
      this.checkAndRefreshTokens();
    }, this.checkInterval);
  }

  /**
   * Остановить планировщик
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[TokenRefreshScheduler] Stopped');
  }

  /**
   * Проверить и обновить токены
   */
  private async checkAndRefreshTokens(): Promise<void> {
    try {
      console.log('[TokenRefreshScheduler] Checking tokens for refresh...');

      const expiredTokens = await tokenManager.getExpiredTokens();

      if (expiredTokens.length === 0) {
        console.log('[TokenRefreshScheduler] No tokens need refresh');
        return;
      }

      console.log(`[TokenRefreshScheduler] Found ${expiredTokens.length} tokens to refresh`);

      const refreshPromises = expiredTokens.map(async (characterId) => {
        try {
          // getValidToken automatically refreshes if needed
          await tokenManager.getValidToken(characterId);
          console.log(`[TokenRefreshScheduler] Successfully refreshed token for character ${characterId}`);
          return { characterId, success: true };
        } catch (error: any) {
          console.error(`[TokenRefreshScheduler] Failed to refresh token for character ${characterId}:`, error);
          return { characterId, success: false, error: error.message };
        }
      });

      const results = await Promise.allSettled(refreshPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      console.log(`[TokenRefreshScheduler] Refresh completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('[TokenRefreshScheduler] Error in checkAndRefreshTokens:', error);
    }
  }

  /**
   * Принудительная проверка сейчас
   */
  async forceCheck(): Promise<void> {
    console.log('[TokenRefreshScheduler] Force check triggered');
    await this.checkAndRefreshTokens();
  }

  /**
   * Получить статус планировщика
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      refreshThreshold: this.refreshThreshold
    };
  }

  /**
   * Изменить интервал проверки
   */
  setCheckInterval(minutes: number): void {
    if (minutes < 1) {
      throw new Error('Check interval must be at least 1 minute');
    }

    this.checkInterval = minutes * 60 * 1000;

    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`[TokenRefreshScheduler] Check interval updated to ${minutes} minutes`);
  }

  /**
   * Изменить порог обновления
   */
  setRefreshThreshold(minutes: number): void {
    if (minutes < 1) {
      throw new Error('Refresh threshold must be at least 1 minute');
    }

    this.refreshThreshold = minutes * 60 * 1000;
    console.log(`[TokenRefreshScheduler] Refresh threshold updated to ${minutes} minutes`);
  }
}

export const tokenRefreshScheduler = TokenRefreshScheduler.getInstance();
