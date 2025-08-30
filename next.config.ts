import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Bỏ qua ESLint khi build
    ignoreDuringBuilds: true,
  },

  webpack: (config, { isServer }) => {
    // Chỉ áp dụng cấu hình này cho bundle phía client
    if (!isServer) {
      // 'fallback' nói cho Webpack biết phải làm gì khi không tìm thấy module.
      // Bằng cách đặt là 'false', chúng ta ra lệnh cho nó thay thế
      // require('fs') bằng một object rỗng, tránh gây lỗi.
      config.resolve.fallback = {
        ...config.resolve.fallback, // Giữ lại các fallback mặc định khác
        fs: false,
        child_process: false,
        module: false, // Thêm fallback cho 'module'
        // Bạn có thể thêm các module khác ở đây nếu cần
        // os: false,
        // path: false,
        // crypto: false,
      };
    }

    // Luôn trả về config đã được sửa đổi
    return config;
  },
};

export default nextConfig;
