"use client";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import useGameStore from "@/store/gameStore"; // Import store
import { globalEntity } from "@/logic/ecs/world.miniplex"; // Import globalEntity
import { GamePhase } from "@/logic/constants"; // Import GamePhase

const languages = ["vi", "en"];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const initializeGame = useGameStore((state) => state.initializeGame); // Lấy hàm initializeGame

  const changeLanguage = (lng: string) => {
    const currentPhase = globalEntity.globalState?.phase;
    const isGameInProgress =
      currentPhase && currentPhase !== GamePhase.PRE_GAME;

    if (isGameInProgress) {
      // Hỏi người dùng xác nhận
      if (
        window.confirm(
          i18n.language === "vi"
            ? "Thay đổi ngôn ngữ sẽ bắt đầu lại trận đấu. Bạn có muốn tiếp tục?"
            : "Changing the language will restart the match. Do you want to continue?"
        )
      ) {
        i18n.changeLanguage(lng).then(() => {
          // Khởi tạo lại game sau khi đổi ngôn ngữ
          initializeGame();
        });
      }
    } else {
      // Nếu game chưa bắt đầu, chỉ cần đổi ngôn ngữ
      i18n.changeLanguage(lng);
    }
  };

  return (
    <div className="absolute top-4 left-4 pointer-events-auto z-20 space-x-2">
      {languages.map((lng) => (
        <Button
          key={lng}
          variant={i18n.language === lng ? "default" : "outline"}
          size="sm"
          onClick={() => changeLanguage(lng)}
        >
          {t(`languages.${lng}`)}{" "}
          {/* Sử dụng key để có thể dịch tên ngôn ngữ */}
        </Button>
      ))}
    </div>
  );
}
