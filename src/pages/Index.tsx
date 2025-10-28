import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Icon from "@/components/ui/icon";

type Rarity = "common" | "rare" | "legendary";

interface BoxResult {
  rarity: Rarity;
  reward: number;
  image: string;
  name: string;
}

const COMMON_BOOBA = {
  image: "https://cdn.poehali.dev/files/013288d5-b69b-4695-93f4-ede0ba07d56a.jpg",
  reward: 50,
  name: "Обычный Буба"
};

const RARE_BOOBA = {
  image: "https://cdn.poehali.dev/files/ff56f3ff-c208-45e4-997d-122a25da7945.jpg",
  reward: 100,
  name: "Военный Буба"
};

const LEGENDARY_BOOBA = {
  image: "https://cdn.poehali.dev/files/100dc695-74a4-4380-94e0-7b5c5d07288f.jpg",
  reward: 500,
  name: "Легендарный Буба"
};

const BOX_PRICE = 50;
const AD_REWARD = 100;
const RARE_CHANCE = 0.15;
const LEGENDARY_CHANCE = 0.05;
const AD_COOLDOWN = 60 * 60 * 1000;

const Index = () => {
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
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("balance", balance.toString());
  }, [balance]);

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
        if (timePassed < 10000) {
          setBalance(0);
          setAdCooldown(Date.now() + AD_COOLDOWN);
          toast({
            title: "❌ ОБМАНЩИК ЗАБЛОКИРОВАН!",
            description: "Ты не посмотрел рекламу! Все деньги изъяты. Блокировка на 1 час.",
            variant: "destructive",
          });
          playSound("error");
        }
        setAdClickTime(null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [adClickTime]);

  useEffect(() => {
    if (!adCooldown) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = adCooldown - now;

      if (remaining <= 0) {
        setAdCooldown(null);
        setTimeLeft("");
        toast({
          title: "✅ Блокировка снята!",
          description: "Теперь можешь снова смотреть рекламу",
        });
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [adCooldown]);

  const playSound = (type: "open" | "common" | "rare" | "legendary" | "error") => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "open") {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === "common") {
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (type === "rare") {
      [0, 0.15, 0.3].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(440 + time * 150, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.25, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.4);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.4);
      });
    } else if (type === "legendary") {
      [0, 0.1, 0.2, 0.3].forEach((time) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(523.25 + time * 200, audioContext.currentTime + time);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.3);
        osc.start(audioContext.currentTime + time);
        osc.stop(audioContext.currentTime + time + 0.3);
      });
    } else if (type === "error") {
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    }
  };

  const openBox = () => {
    if (balance < BOX_PRICE) {
      toast({
        title: "Недостаточно валюты!",
        description: "Посмотри рекламу, чтобы получить 100 валюты",
        variant: "destructive",
      });
      return;
    }

    setBalance(balance - BOX_PRICE);
    setIsOpening(true);
    setShowResult(false);
    playSound("open");

    setTimeout(() => {
      const rand = Math.random();
      let result: BoxResult;

      if (rand < LEGENDARY_CHANCE) {
        result = {
          rarity: "legendary",
          reward: LEGENDARY_BOOBA.reward,
          image: LEGENDARY_BOOBA.image,
          name: LEGENDARY_BOOBA.name,
        };
      } else if (rand < LEGENDARY_CHANCE + RARE_CHANCE) {
        result = {
          rarity: "rare",
          reward: RARE_BOOBA.reward,
          image: RARE_BOOBA.image,
          name: RARE_BOOBA.name,
        };
      } else {
        result = {
          rarity: "common",
          reward: COMMON_BOOBA.reward,
          image: COMMON_BOOBA.image,
          name: COMMON_BOOBA.name,
        };
      }

      setCurrentResult(result);
      setIsOpening(false);
      setShowResult(true);
      setBalance((prev) => prev + result.reward);
      playSound(result.rarity);

      const titles = {
        legendary: "🎉 ЛЕГЕНДАРКА!",
        rare: "⚔️ ОЧЕНЬ РЕДКИЙ!",
        common: "Выпал Буба!"
      };

      toast({
        title: titles[result.rarity],
        description: `Ты получил ${result.reward} валюты!`,
      });
    }, 2000);
  };

  const watchAd = () => {
    if (adCooldown && Date.now() < adCooldown) {
      toast({
        title: "⏳ Блокировка активна!",
        description: `Осталось: ${timeLeft}`,
        variant: "destructive",
      });
      return;
    }

    setAdClickTime(Date.now());
    window.open("https://t.me/+r0KZTuxnHuUzNGZi", "_blank");

    setTimeout(() => {
      if (adClickTime && Date.now() - adClickTime >= 10000) {
        setBalance((prev) => prev + AD_REWARD);
        setAdCooldown(Date.now() + AD_COOLDOWN);
        toast({
          title: "✅ Спасибо за просмотр!",
          description: `Ты получил ${AD_REWARD} валюты! Следующая реклама через 1 час.`,
        });
        setAdClickTime(null);
      }
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 overflow-hidden">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            БУБА КЕЙСЫ
          </h1>
          <p className="text-gray-400 text-sm">Открывай ящики и собирай коллекцию!</p>
        </div>

        <div className="flex justify-center items-center gap-6 mb-8 animate-scale-in">
          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-400 border-2 px-8 py-4">
            <div className="flex items-center gap-3">
              <Icon name="Coins" className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-xs text-purple-200">Баланс</p>
                <p className="text-3xl font-black text-white">{balance}</p>
              </div>
            </div>
          </Card>

          <Button
            onClick={watchAd}
            disabled={adCooldown !== null && Date.now() < adCooldown}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-6 text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adCooldown && Date.now() < adCooldown ? (
              <>
                <Icon name="Clock" className="mr-2 w-6 h-6" />
                {timeLeft}
              </>
            ) : (
              <>
                <Icon name="Play" className="mr-2 w-6 h-6" />
                Реклама +{AD_REWARD}
              </>
            )}
          </Button>
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
                  <p className="text-sm text-gray-400 mt-2">{BOX_PRICE} валюты</p>
                </div>
              )}

              {isOpening && (
                <div className="text-center animate-spin">
                  <Icon name="Package" className="w-32 h-32 text-purple-400" />
                </div>
              )}

              {showResult && currentResult && (
                <div className="text-center animate-scale-in">
                  <img
                    src={currentResult.image}
                    alt={currentResult.name}
                    className="w-48 h-48 object-contain animate-fade-in"
                  />
                </div>
              )}
            </Card>
          </div>

          {showResult && currentResult && (
            <Card
              className={`px-8 py-4 ${
                currentResult.rarity === "legendary"
                  ? "bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-400 animate-pulse"
                  : currentResult.rarity === "rare"
                  ? "bg-gradient-to-r from-orange-600 to-red-600 border-orange-400 shadow-lg shadow-orange-500/30"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400"
              } border-2 animate-scale-in`}
            >
              <p className="text-2xl font-black text-center">
                {currentResult.rarity === "legendary" 
                  ? "⭐ ЛЕГЕНДАРНЫЙ БУБА ⭐" 
                  : currentResult.rarity === "rare"
                  ? "⚔️ ВОЕННЫЙ БУБА ⚔️"
                  : currentResult.name}
              </p>
              <p className="text-xl font-bold text-center mt-2">+{currentResult.reward} валюты</p>
            </Card>
          )}

          <Button
            onClick={openBox}
            disabled={isOpening || balance < BOX_PRICE}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black px-12 py-8 text-2xl shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            {isOpening ? (
              <>
                <Icon name="Loader2" className="mr-3 w-8 h-8 animate-spin" />
                Открытие...
              </>
            ) : balance < BOX_PRICE ? (
              <>
                <Icon name="Lock" className="mr-3 w-8 h-8" />
                Недостаточно валюты
              </>
            ) : (
              <>
                <Icon name="Gift" className="mr-3 w-8 h-8" />
                Открыть ящик
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-blue-500/30 p-6">
            <div className="flex items-start gap-4">
              <img src={COMMON_BOOBA.image} alt="Обычный Буба" className="w-20 h-20 object-contain rounded-lg" />
              <div>
                <p className="text-xl font-bold text-blue-400">Обычный Буба</p>
                <p className="text-gray-400 text-sm mt-1">Награда: {COMMON_BOOBA.reward} валюты</p>
                <p className="text-gray-500 text-xs mt-2">Шанс: 80%</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-orange-500/30 p-6 shadow-lg shadow-orange-500/10">
            <div className="flex items-start gap-4">
              <img
                src={RARE_BOOBA.image}
                alt="Военный Буба"
                className="w-20 h-20 object-contain rounded-lg"
              />
              <div>
                <p className="text-xl font-bold text-orange-400">⚔️ Военный Буба ⚔️</p>
                <p className="text-gray-400 text-sm mt-1">Награда: {RARE_BOOBA.reward} валюты</p>
                <p className="text-gray-500 text-xs mt-2">Шанс: 15% (очень редкий!)</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-yellow-500/30 p-6 shadow-lg shadow-yellow-500/10">
            <div className="flex items-start gap-4">
              <img
                src={LEGENDARY_BOOBA.image}
                alt="Легендарный Буба"
                className="w-20 h-20 object-contain rounded-lg"
              />
              <div>
                <p className="text-xl font-bold text-yellow-400">⭐ Легендарный Буба ⭐</p>
                <p className="text-gray-400 text-sm mt-1">Награда: {LEGENDARY_BOOBA.reward} валюты</p>
                <p className="text-gray-500 text-xs mt-2">Шанс: 5% (супер редкий!)</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-purple-500/20 p-4 text-center text-xs text-gray-500 animate-fade-in">
          <p className="leading-relaxed">
            Сделано <span className="text-purple-400 font-bold">RED BUBA</span>
            <br />
            <span className="text-blue-400">@vocal_endr</span> и{" "}
            <span className="text-pink-400">@PinguinoPenguins</span>
            <br />
            От сериала <span className="text-orange-400 font-bold">Буба против мессенджера MAX</span>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Index;