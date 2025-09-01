// src/components/ui/GameLog.tsx
"use client";
import { useStore } from "zustand";
import useGameStore from "@/store/gameStore";
import { LogEntry, LogType } from "@/store/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
// Không cần useRef và useEffect nữa

const logTypeClasses: Record<LogType, string> = {
  info: "text-muted-foreground",
  action: "text-foreground font-semibold",
  system: "text-blue-400 italic",
  cost: "text-yellow-500",
};

export default function GameLog() {
  const logs = useStore(useGameStore, (state) => state.logs);
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-4 right-4 w-80 h-64 bg-card/70 backdrop-blur-sm border rounded-lg shadow-lg pointer-events-auto flex flex-col">
      <div className="p-2 border-b">
        <h4 className="font-bold text-center text-sm">{t("gameLog.title")}</h4>
      </div>
      {/* 
        SỬ DỤNG LẠI flex-col-reverse:
        Nó sẽ làm cho các phần tử con được xếp từ dưới lên trên.
        Kết hợp với overflow-y-auto, thanh cuộn sẽ bắt đầu từ dưới cùng.
      */}
      <div className="flex-grow p-2 overflow-y-auto flex flex-col-reverse">
        <AnimatePresence>
          {/*
            KHÔNG cần đảo ngược mảng logs ở đây nữa vì
            chúng ta đã unshift log mới vào đầu mảng trong store.
            flex-col-reverse sẽ tự động đặt phần tử đầu tiên (log mới nhất) ở dưới cùng.
          */}
          {logs.map((log: LogEntry) => (
            <motion.p
              key={log.id}
              layout
              initial={{ opacity: 0, x: -20 }} // Hiệu ứng trượt từ trái sang
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("text-xs mb-1", logTypeClasses[log.type])}
            >
              {t(log.key, log.payload)}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
