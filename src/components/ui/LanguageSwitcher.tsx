"use client";

import { useTranslation } from "react-i18next";
import { Button } from "./button";

const languages = ["vi", "en"];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    // Hàm này sẽ thay đổi ngôn ngữ và tự động lưu vào cookie/localStorage
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
          {lng.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
