// src/components/ui/DevPanel.tsx
"use client";
import { useEffect, useState } from "react";
import luaService from "@/logic/lua/lua.service";
import { GameAPI } from "@/logic/core/game.api";
import useGameStore from "@/store/gameStore";

// Import Button từ component vừa tạo
import { Button } from "@/components/ui/button";

export default function DevPanel() {
  const [isLuaReady, setIsLuaReady] = useState(false);
  // const turn = useGameStore((state) => state.turn); // <-- XÓA DÒNG NÀY

  // useEffect bây giờ là async để xử lý việc khởi tạo
  useEffect(() => {
    const initLua = async () => {
      await luaService.initialize();
      luaService.expose("Game", GameAPI);
      setIsLuaReady(true);
    };

    initLua();
  }, []);

  const runTestScript = async () => {
    if (!isLuaReady) return;
    try {
      const response = await fetch("/scripts/cards/test-card.lua");
      const script = await response.text();

      // Thực thi script đầu tiên để định nghĩa các hàm trong Lua
      await luaService.doString(script);
      // Sau đó gọi hàm cụ thể
      await luaService.doString("TestCard.OnEnterField()");
    } catch (error) {
      console.error("Failed to run test script:", error);
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow-lg z-10 border pointer-events-auto">
      <h2 className="text-lg font-bold mb-2 text-card-foreground">Dev Panel</h2>
      {/* <p className="text-muted-foreground">Current Turn: {turn}</p> */}{" "}
      {/* <-- COMMENT OUT DÒNG NÀY */}
      <Button
        onClick={runTestScript}
        disabled={!isLuaReady}
        className="mt-2 w-full"
      >
        {isLuaReady ? "Run Lua Test Script" : "Initializing Lua..."}
      </Button>
    </div>
  );
}
