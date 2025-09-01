"use client";

import { I18nextProvider } from "react-i18next";
import { ReactNode, Suspense } from "react";
import i18n from "@/i18n"; // Import file cấu hình đã tạo

export default function I18nProvider({ children }: { children: ReactNode }) {
  return (
    // Suspense sẽ hiển thị fallback cho đến khi file ngôn ngữ được tải xong
    <Suspense fallback={<div>Loading translations...</div>}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Suspense>
  );
}
