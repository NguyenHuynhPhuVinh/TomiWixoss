"use client";
import { useTranslation } from "react-i18next";
import { Button } from "./button";

const languages = ["vi", "en"];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation(); // Lấy thêm t

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
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
