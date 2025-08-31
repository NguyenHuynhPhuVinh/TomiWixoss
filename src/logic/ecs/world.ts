// src/logic/ecs/world.ts
import { Entity, Component, ComponentClass, System } from "./ecs.types";
import { immerable } from "immer"; // <-- IMPORT IMMERABLE

export class World {
  // === ĐÁNH DẤU CLASS LÀ IMMERABLE ===
  static [immerable] = true;
  // =====================================

  private nextEntityId = 0;
  private entities = new Set<Entity>();

  // === THAY ĐỔI LỚN: DÙNG string LÀM KEY ===
  private components = new Map<string, Map<Entity, any>>();
  // =========================================
  private systems: System[] = [];

  // === QUẢN LÝ ENTITY ===
  public createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  // === QUẢN LÝ COMPONENT ===
  public addComponent<T extends Component>(
    entity: Entity,
    componentName: string,
    component: T
  ): void {
    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }
    this.components.get(componentName)!.set(entity, component);
  }

  public getComponent<T extends Component>(
    entity: Entity,
    componentName: string
  ): T | undefined {
    return this.components.get(componentName)?.get(entity);
  }

  public hasComponent(entity: Entity, componentName: string): boolean {
    return this.components.get(componentName)?.has(entity) ?? false;
  }

  // === QUẢN LÝ SYSTEM ===
  public addSystem(system: System): void {
    this.systems.push(system);
  }

  /**
   * Hàm truy vấn cốt lõi: Tìm tất cả các Entity có một tập hợp Component nhất định.
   */
  public query(componentNames: string[]): Entity[] {
    const entitiesWithComponents: Entity[] = [];
    for (const entity of this.entities) {
      if (componentNames.every((name) => this.hasComponent(entity, name))) {
        entitiesWithComponents.push(entity);
      }
    }
    return entitiesWithComponents;
  }

  /**
   * Hàm update chính của game loop.
   */
  public update(): void {
    for (const system of this.systems) {
      system.update(this);
    }
  }
}
