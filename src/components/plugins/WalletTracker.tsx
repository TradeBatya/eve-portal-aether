import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export const WalletTracker = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: mainCharacter } = useQuery({
    queryKey: ['main-character', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('eve_characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Mock transaction data - in production this would come from ESI API
  const mockTransactions = [
    {
      id: 1,
      type: "bounty_prizes",
      amount: 15_450_000,
      date: new Date(Date.now() - 3600000),
      description: "Bounty prize",
    },
    {
      id: 2,
      type: "market_sell",
      amount: 125_000_000,
      date: new Date(Date.now() - 7200000),
      description: "Sold: 1000x Veldspar",
    },
    {
      id: 3,
      type: "market_buy",
      amount: -45_000_000,
      date: new Date(Date.now() - 10800000),
      description: "Bought: Caracal Navy Issue",
    },
    {
      id: 4,
      type: "mission_reward",
      amount: 8_500_000,
      date: new Date(Date.now() - 14400000),
      description: "Mission reward",
    },
    {
      id: 5,
      type: "market_sell",
      amount: 67_000_000,
      date: new Date(Date.now() - 18000000),
      description: "Sold: Salvage materials",
    },
  ];

  const totalIncome = mockTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    mockTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const t = {
    en: {
      title: "Wallet Tracker",
      balance: "Current Balance",
      income: "Total Income",
      expenses: "Total Expenses",
      recentTransactions: "Recent Transactions",
      noCharacter: "No main character set",
      ago: "ago",
    },
    ru: {
      title: "Отслеживание кошелька",
      balance: "Текущий баланс",
      income: "Общий доход",
      expenses: "Общие расходы",
      recentTransactions: "Последние транзакции",
      noCharacter: "Основной персонаж не установлен",
      ago: "назад",
    },
  }[language];

  if (!mainCharacter) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.noCharacter}
        </CardContent>
      </Card>
    );
  }

  const formatISK = (amount: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Stats */}
        <div className="grid gap-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">{t.balance}</div>
            <div className="text-3xl font-bold text-primary">
              {formatISK(Number(mainCharacter.wallet_balance || 0))} ISK
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">{t.income}</span>
              </div>
              <div className="text-xl font-bold text-green-500">
                +{formatISK(totalIncome)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-xs text-muted-foreground">{t.expenses}</span>
              </div>
              <div className="text-xl font-bold text-red-500">
                -{formatISK(totalExpense)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="text-sm font-semibold mb-3">{t.recentTransactions}</h4>
          <div className="space-y-2">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.amount > 0 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {transaction.amount > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(transaction.date, {
                        locale: language === 'ru' ? ru : undefined,
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}
                  {formatISK(transaction.amount)} ISK
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
