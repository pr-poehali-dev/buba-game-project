import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface InventoryItem {
  id: number;
  booba_type: string;
  booba_name: string;
  booba_image: string;
  booba_rarity: string;
  acquired_at: string;
}

interface InventoryProps {
  userId: string;
  onBack: () => void;
}

const INVENTORY_API = "https://functions.poehali.dev/d9eaea3a-b55b-4015-962b-bdd83860a1f7";
const MARKET_API = "https://functions.poehali.dev/d9a8d264-107f-4a18-a611-4d6d65585675";

export default function Inventory({ userId, onBack }: InventoryProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [showSellDialog, setShowSellDialog] = useState(false);
  const { toast } = useToast();

  const loadInventory = async () => {
    try {
      const response = await fetch(INVENTORY_API, {
        headers: {
          "X-User-Id": userId,
        },
      });
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openSellDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setSellPrice("");
    setShowSellDialog(true);
  };

  const listOnMarket = async () => {
    if (!selectedItem || !sellPrice || parseInt(sellPrice) <= 0) {
      toast({
        title: "Укажи цену!",
        description: "Введи корректную цену продажи",
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
          action: "list_on_market",
          inventory_id: selectedItem.id,
          price: parseInt(sellPrice),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "✅ Выставлено на рынок!",
          description: `${selectedItem.booba_name} выставлен за ${sellPrice} энергии`,
        });
        setShowSellDialog(false);
        loadInventory();
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось выставить на рынок",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("List error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выставить на рынок",
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
            МОЙ ИНВЕНТАРЬ
          </h1>
          <div className="w-24"></div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" className="w-12 h-12 animate-spin mx-auto text-purple-400" />
            <p className="mt-4 text-gray-400">Загрузка инвентаря...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Package" className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <p className="text-2xl text-gray-400">Инвентарь пуст</p>
            <p className="text-gray-500 mt-2">Открывай ящики, чтобы получить Буб!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <Card
                key={item.id}
                className={`p-4 border-2 ${getRarityColor(item.booba_rarity)} hover:scale-105 transition-all`}
              >
                <div className="relative">
                  <img
                    src={item.booba_image}
                    alt={item.booba_name}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded-full">
                    <span className="text-sm font-bold">{item.booba_rarity.toUpperCase()}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.booba_name}</h3>
                <Button
                  onClick={() => openSellDialog(item)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 mt-3"
                >
                  <Icon name="Tag" className="mr-2 w-4 h-4" />
                  Продать на рынке
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="bg-slate-900 border-purple-500">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Продать {selectedItem?.booba_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <img
              src={selectedItem?.booba_image}
              alt={selectedItem?.booba_name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <label className="block text-sm text-gray-300 mb-2">Цена продажи (энергия)</label>
            <Input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Введи цену..."
              className="bg-slate-800 border-purple-500 text-white"
              min="1"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSellDialog(false)} variant="outline">
              Отмена
            </Button>
            <Button
              onClick={listOnMarket}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Выставить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
