import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

interface MarketListing {
  id: number;
  seller_id: string;
  price: number;
  booba_name: string;
  booba_image: string;
  booba_rarity: string;
  listed_at: string;
}

interface MarketProps {
  userId: string;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
  onBack: () => void;
}

const MARKET_API = "https://functions.poehali.dev/d9a8d264-107f-4a18-a611-4d6d65585675";

export default function Market({ userId, balance, onBalanceChange, onBack }: MarketProps) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMarket = async () => {
    try {
      const response = await fetch(MARKET_API);
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to load market:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
    const interval = setInterval(loadMarket, 5000);
    return () => clearInterval(interval);
  }, []);

  const buyItem = async (listingId: number, price: number) => {
    if (balance < price) {
      toast({
        title: "Недостаточно энергии!",
        description: `Нужно ${price} энергии, у тебя ${balance}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(MARKET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          action: "buy",
          listing_id: listingId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "🎉 Успешная покупка!",
          description: "Буба добавлен в твой инвентарь",
        });
        onBalanceChange(balance - price);
        loadMarket();
      } else {
        toast({
          title: "Ошибка покупки",
          description: data.error || "Не удалось купить",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Buy error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить покупку",
        variant: "destructive",
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "border-yellow-500 bg-gradient-to-br from-yellow-900/20 to-yellow-800/20";
      case "epic":
        return "border-purple-500 bg-gradient-to-br from-purple-900/20 to-purple-800/20";
      case "rare":
        return "border-orange-500 bg-gradient-to-br from-orange-900/20 to-orange-800/20";
      default:
        return "border-gray-500 bg-gradient-to-br from-gray-900/20 to-gray-800/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Button onClick={onBack} variant="outline" className="border-purple-500 text-purple-300">
            <Icon name="ArrowLeft" className="mr-2" />
            Назад
          </Button>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            РЫНОК БУБ
          </h1>
          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 border-2 px-6 py-3">
            <div className="flex items-center gap-2">
              <Icon name="Coins" className="w-6 h-6 text-yellow-400" />
              <span className="text-xl font-bold">{balance}</span>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" className="w-12 h-12 animate-spin mx-auto text-purple-400" />
            <p className="mt-4 text-gray-400">Загрузка рынка...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Store" className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <p className="text-2xl text-gray-400">Рынок пуст</p>
            <p className="text-gray-500 mt-2">Пока никто не выставил Буб на продажу</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card
                key={listing.id}
                className={`p-4 border-2 ${getRarityColor(listing.booba_rarity)} hover:scale-105 transition-all`}
              >
                <div className="relative">
                  <img
                    src={listing.booba_image}
                    alt={listing.booba_name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded-full">
                    <span className="text-sm font-bold">{listing.booba_rarity.toUpperCase()}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{listing.booba_name}</h3>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Icon name="Coins" className="w-5 h-5 text-yellow-400" />
                    <span className="text-2xl font-bold text-yellow-400">{listing.price}</span>
                  </div>
                  <Button
                    onClick={() => buyItem(listing.id, listing.price)}
                    disabled={balance < listing.price}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                  >
                    <Icon name="ShoppingCart" className="mr-2 w-4 h-4" />
                    Купить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
