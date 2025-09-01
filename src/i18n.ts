import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  // Backend để tải file translation từ thư mục /public/locales
  .use(HttpBackend)
  // Tự động phát hiện ngôn ngữ
  .use(LanguageDetector)
  // Kết nối i18n với React
  .use(initReactI18next)
  .init({
    // Ngôn ngữ mặc định nếu không phát hiện được
    fallbackLng: "vi",

    // Namespace mặc định
    defaultNS: "common",
    ns: ["common", "cards"],

    // Bật debug trong môi trường development
    debug: process.env.NODE_ENV === "development",

    // Cấu hình cho LanguageDetector
    detection: {
      // Thứ tự phát hiện: cookie -> localStorage -> ngôn ngữ trình duyệt
      order: ["cookie", "localStorage", "navigator"],
      caches: ["cookie", "localStorage"], // Nơi lưu lựa chọn của người dùng
    },

    interpolation: {
      escapeValue: false, // React đã tự chống XSS
    },
  });

export default i18n;
