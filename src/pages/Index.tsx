import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";
import Market from "@/components/Market";
import Inventory from "@/components/Inventory";

type Rarity = "common" | "rare" | "epic" | "legendary";
type Page = "game" | "market" | "inventory";

interface BoxResult {
  rarity: Rarity;
  reward: number;
  image: string;
  name: string;
  type: string;
}

const COMMON_BOOBA = {
  type: "common",
  image: "https://cdn.poehali.dev/files/013288d5-b69b-4695-93f4-ede0ba07d56a.jpg",
  reward: 80,
  name: "Обычный Буба"
};

const RARE_BOOBA = {
  type: "rare",
  image: "https://cdn.poehali.dev/files/ff56f3ff-c208-45e4-997d-122a25da7945.jpg",
  reward: 200,
  name: "Военный Буба"
};

const EPIC_BOOBA = {
  type: "epic",
  image: "https://cdn.poehali.dev/files/476a23e9-cffb-4e67-910c-8486f77cbead.jpg",
  reward: 250,
  name: "Спящий Буба"
};

const LEGENDARY_BOOBA = {
  type: "legendary",
  image: "https://cdn.poehali.dev/files/100dc695-74a4-4380-94e0-7b5c5d07288f.jpg",
  reward: 500,
  name: "Легендарный Буба"
};

const MAGIC_BOOBA = {
  type: "magic",
  image: "https://cdn.poehali.dev/files/57e4ddfc-203a-455d-acf3-e11ddf5da903.jpg",
  reward: 1000000,
  name: "Магический Буба"
};

const BOX_PRICE = 50;
const AD_REWARD = 100;
const RARE_CHANCE = 0.12;
const EPIC_CHANCE = 0.05;
const LEGENDARY_CHANCE = 0.015;
const MAGIC_CHANCE = 0.001;
const AD_COOLDOWN = 60 * 60 * 1000;
const QUICK_RETURN_THRESHOLD = 5000;

const INVENTORY_API = "https://functions.poehali.dev/d9eaea3a-b55b-4015-962b-bdd83860a1f7";

const Index = () => {
  const [userId] = useState(() => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", id);
    }
    return id;
  });

  const [currentPage, setCurrentPage] = useState<Page>("game");
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("balance");
    return saved ? parseInt(saved) : 50;
  });
  const [isOpening, setIsOpening] = useState(false);
  const [currentResult, setCurrentResult] = useState<BoxResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [adCooldown, setAdCooldown] = useState<number | null>(() => {
    const saved = localStorage.getItem("adCooldown");
    return saved ? parseInt(saved) : null;
  });
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [adClickTime, setAdClickTime] = useState<number | null>(null);
  const [quickReturnCount, setQuickReturnCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("balance", balance.toString());
    
    const syncBalance = async () => {
      try {
        await fetch(INVENTORY_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
          body: JSON.stringify({
            action: "update_balance",
            balance: balance,
          }),
        });
      } catch (error) {
        console.error("Failed to sync balance:", error);
      }
    };
    syncBalance();
  }, [balance, userId]);

  useEffect(() => {
    if (adCooldown) {
      localStorage.setItem("adCooldown", adCooldown.toString());
    } else {
      localStorage.removeItem("adCooldown");
    }
  }, [adCooldown]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && adClickTime) {
        const timePassed = Date.now() - adClickTime;
        
        if (timePassed < QUICK_RETURN_THRESHOLD) {
          if (quickReturnCount === 0) {
            setQuickReturnCount(1);
            toast({
              title: "⚠️ Предупреждение!",
              description: "Первый быстрый возврат прощён. Второй = блокировка!",
              variant: "default",
            });
          } else {
            setBalance(0);
            setAdCooldown(Date.now() + AD_COOLDOWN);
            setQuickReturnCount(0);
            setAdClickTime(null);
            toast({
              title: "❌ ОБМАНЩИК ЗАБЛОКИРОВАН!",
              description: "Два быстрых возврата! Вся энергия изъята. Блокировка на 1 час.",
              variant: "destructive",
            });
            playSound("error");
            return;
          }
        } else {
          setBalance((prev) => prev + AD_REWARD);
          setAdCooldown(Date.now() + AD_COOLDOWN);
          setQuickReturnCount(0);
          setAdClickTime(null);
          toast({
            title: "✅ Задание выполнено!",
            description: `Ты получил ${AD_REWARD} энергии! Следующее задание через 1 час.`,
          });
          playSound("reward");
          return;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [adClickTime, quickReturnCount]);

  useEffect(() => {
    if (!adCooldown) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = adCooldown - now;

      if (remaining <= 0) {
        setAdCooldown(null);
        setTimeLeft("");
        toast({
          title: "✅ Таймер истёк!",
          description: "Теперь можешь снова зарабатывать энергию",
        });
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [adCooldown]);

  const playSound = (type: "open" | "common" | "rare" | "epic" | "legendary" | "magic" | "error" | "reward") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === "open") {
      [0, 0.1, 0.2].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(300 + time * 200, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.2, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.3);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.3);
      });
    } else if (type === "common") {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(400, audioContext.currentTime);
      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc.start();
      osc.stop(audioContext.currentTime + 0.2);
    } else if (type === "rare") {
      [0, 0.08, 0.16].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(523 + time * 100, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.2, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.3);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.3);
      });
    } else if (type === "epic") {
      [0, 0.07, 0.14, 0.21].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(659 + time * 150, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.25, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.35);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.35);
      });
    } else if (type === "legendary" || type === "magic") {
      [0, 0.05, 0.1, 0.15, 0.2].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(784 + time * 200, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.4);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.4);
      });
    } else if (type === "reward") {
      [0, 0.1].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(600 + time * 200, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.2, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.25);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.25);
      });
    } else if (type === "error") {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(200, audioContext.currentTime);
      osc.frequency.setValueAtTime(100, audioContext.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      osc.start();
      osc.stop(audioContext.currentTime + 0.4);
    }
  };

  const openBox = async () => {
    if (balance < BOX_PRICE) {
      toast({
        title: "Недостаточно энергии!",
        description: "Заработай энергию, чтобы открывать ящики",
        variant: "destructive",
      });
      return;
    }

    setBalance(balance - BOX_PRICE);
    setIsOpening(true);
    setShowResult(false);
    playSound("open");

    setTimeout(async () => {
      const rand = Math.random();
      let result: BoxResult;
      let boobaData;

      if (rand < MAGIC_CHANCE) {
        boobaData = MAGIC_BOOBA;
        result = { rarity: "legendary", ...boobaData };
        playSound("magic");
      } else if (rand < MAGIC_CHANCE + LEGENDARY_CHANCE) {
        boobaData = LEGENDARY_BOOBA;
        result = { rarity: "legendary", ...boobaData };
        playSound("legendary");
      } else if (rand < MAGIC_CHANCE + LEGENDARY_CHANCE + EPIC_CHANCE) {
        boobaData = EPIC_BOOBA;
        result = { rarity: "epic", ...boobaData };
        playSound("epic");
      } else if (rand < MAGIC_CHANCE + LEGENDARY_CHANCE + EPIC_CHANCE + RARE_CHANCE) {
        boobaData = RARE_BOOBA;
        result = { rarity: "rare", ...boobaData };
        playSound("rare");
      } else {
        boobaData = COMMON_BOOBA;
        result = { rarity: "common", ...boobaData };
        playSound("common");
      }

      setCurrentResult(result);
      setIsOpening(false);
      setShowResult(true);
      setBalance((prev) => prev + result.reward);

      try {
        await fetch(INVENTORY_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
          },
          body: JSON.stringify({
            action: "add",
            booba: {
              type: boobaData.type,
              name: boobaData.name,
              image: boobaData.image,
              rarity: result.rarity,
            },
          }),
        });
      } catch (error) {
        console.error("Failed to save to inventory:", error);
      }

      const titles = {
        legendary: boobaData.type === "magic" ? "✨ МАГИЧЕСКИЙ БУБА!!!" : "🎉 ЛЕГЕНДАРКА!",
        epic: "💤 ЭПИЧЕСКИЙ!",
        rare: "⚔️ ОЧЕНЬ РЕДКИЙ!",
        common: "Выпал Буба!"
      };

      toast({
        title: titles[result.rarity],
        description: `Ты получил ${result.reward} энергии!`,
      });
    }, 2000);
  };

  const watchAd = () => {
    if (adCooldown && Date.now() < adCooldown) {
      toast({
        title: "Подожди!",
        description: `Следующее задание доступно через ${timeLeft}`,
        variant: "destructive",
      });
      return;
    }

    setAdClickTime(Date.now());
    setQuickReturnCount(0);
    toast({
      title: "💰 Переходим к заработку...",
      description: "Выполни задание и вернись, чтобы получить 100 энергии!",
    });
    window.open("https://t.me/StarsovEarnBot?start=_tgr_c4nhr4M2MWZi", "_blank");
  };

  const supportDev = () => {
    toast({
      title: "💙 Спасибо за поддержку!",
      description: "Выполняй задания - это поможет делать больше обновлений!",
    });
    window.open("https://t.me/StarsovEarnBot?start=_tgr_c4nhr4M2MWZi", "_blank");
  };

  if (currentPage === "market") {
    return <Market userId={userId} balance={balance} onBalanceChange={setBalance} onBack={() => setCurrentPage("game")} />;
  }

  if (currentPage === "inventory") {
    return <Inventory userId={userId} onBack={() => setCurrentPage("game")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 overflow-hidden">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            БУБА КЕЙСЫ
          </h1>
          <p className="text-gray-400 text-sm">Открывай ящики и собирай коллекцию!</p>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8 animate-scale-in">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 border-2 px-8 py-4">
            <div className="flex items-center gap-3">
              <Icon name="Coins" className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-xs text-purple-200">Баланс</p>
                <p className="text-3xl font-black text-white">{balance}</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 w-full max-w-md">
            <Button
              onClick={watchAd}
              disabled={adCooldown !== null && Date.now() < adCooldown}
              size="lg"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adCooldown && Date.now() < adCooldown ? (
                <>
                  <Icon name="Clock" className="mr-2 w-5 h-5" />
                  {timeLeft}
                </>
              ) : (
                <>
                  <Icon name="Coins" className="mr-2 w-5 h-5" />
                  Заработать +{AD_REWARD}
                </>
              )}
            </Button>

            <Button
              onClick={supportDev}
              size="lg"
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-6 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Icon name="Heart" className="mr-2 w-5 h-5" />
              Поддержать разработчика
            </Button>
          </div>

          <div className="flex gap-3 w-full max-w-md">
            <Button
              onClick={() => setCurrentPage("inventory")}
              variant="outline"
              className="flex-1 border-2 border-purple-500 text-purple-300 hover:bg-purple-900/50 font-bold py-4"
            >
              <Icon name="Package" className="mr-2 w-5 h-5" />
              Мой инвентарь
            </Button>
            <Button
              onClick={() => setCurrentPage("market")}
              variant="outline"
              className="flex-1 border-2 border-pink-500 text-pink-300 hover:bg-pink-900/50 font-bold py-4"
            >
              <Icon name="Store" className="mr-2 w-5 h-5" />
              Рынок
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8 mb-12">
          <div className="relative">
            {isOpening && (
              <div className="absolute inset-0 flex items-center justify-center z-10 animate-pulse">
                <div className="w-64 h-64 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full opacity-50 blur-3xl"></div>
              </div>
            )}
            
            <Card
              className={`w-64 h-64 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border-4 ${
                isOpening
                  ? "border-purple-500 animate-pulse scale-110"
                  : showResult && currentResult?.rarity === "legendary"
                  ? "border-yellow-500 shadow-2xl shadow-yellow-500/50"
                  : showResult && currentResult?.rarity === "epic"
                  ? "border-pink-500 shadow-2xl shadow-pink-500/50"
                  : showResult && currentResult?.rarity === "rare"
                  ? "border-orange-500 shadow-2xl shadow-orange-500/50"
                  : "border-purple-700"
              } transition-all duration-500 cursor-pointer hover:scale-105`}
              onClick={!isOpening && !showResult ? openBox : undefined}
            >
              {!showResult && !isOpening && (
                <div className="text-center animate-fade-in">
                  <Icon name="Package" className="w-32 h-32 text-purple-400 mx-auto mb-4" />
                  <p className="text-2xl font-bold text-purple-300">ЯЩИК</p>
                  <p className="text-sm text-gray-400 mt-2">{BOX_PRICE} энергии</p>
                </div>
              )}

              {isOpening && (
                <div className="text-center animate-spin">
                  <Icon name="Package" className="w-32 h-32 text-purple-400" />
                </div>
              )}

              {showResult && currentResult && (
                <div className="text-center animate-fade-in p-4">
                  <img 
                    src={currentResult.image} 
                    alt={currentResult.name}
                    className="w-48 h-48 object-cover rounded-lg mb-2"
                  />
                  <p className="text-lg font-bold">{currentResult.name}</p>
                  <p className="text-green-400 font-bold">+{currentResult.reward} энергии</p>
                </div>
              )}
            </Card>
          </div>

          {showResult && (
            <Button
              onClick={() => {
                setShowResult(false);
                setCurrentResult(null);
              }}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 text-lg shadow-lg"
            >
              Продолжить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;