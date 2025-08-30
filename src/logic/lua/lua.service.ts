// src/logic/lua/lua.service.ts
import { LuaFactory } from "wasmoon";

// Wasmoon Engine interface
interface LuaEngine {
  doString(code: string): Promise<any>;
  global: {
    get(name: string): any;
    set(name: string, value: any): void;
    [key: string]: any;
  };
  close?(): void;
}

class LuaService {
  private factory: LuaFactory | null = null;
  public engine: LuaEngine | null = null;
  private isInitialized = false;

  constructor() {}

  /**
   * Khởi tạo máy ảo Lua. Phải được gọi một lần trước khi sử dụng.
   * Đây là một hàm bất đồng bộ vì nó cần tải file WASM.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.factory = new LuaFactory();
    this.engine = await this.factory.createEngine();
    this.isInitialized = true;
    console.log("Wasmoon Lua VM Initialized");
  }

  /**
   * Expose một object TypeScript cho môi trường global của Lua.
   * @param name - Tên của object trong Lua (ví dụ: "Game").
   * @param apiObject - Object chứa các hàm TypeScript cần expose.
   */
  public expose(name: string, apiObject: Record<string, any>): void {
    if (!this.engine) {
      console.error("Lua engine not initialized.");
      return;
    }
    // API của wasmoon rất đơn giản, chỉ cần gán object vào global
    this.engine.global.set(name, apiObject);
  }

  /**
   * Thực thi một đoạn mã Lua.
   * @param script - Đoạn mã Lua dưới dạng string.
   */
  public async doString(script: string): Promise<any> {
    if (!this.engine) {
      console.error("Lua engine not initialized.");
      return;
    }
    try {
      return await this.engine.doString(script);
    } catch (e) {
      console.error("Lua Error:", e);
    }
  }
}

// Tạo một instance duy nhất (Singleton pattern)
const luaServiceInstance = new LuaService();
export default luaServiceInstance;
