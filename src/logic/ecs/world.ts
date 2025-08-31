// src/logic/ecs/world.ts
import { Entity, Component, ComponentClass, System } from "./ecs.types";

export class World {
  private nextEntityId = 0;
  private entities = new Set<Entity>();

  // Cấu trúc dữ liệu chính: Map từ loại Component -> (Map từ Entity -> instance Component)
  private components = new Map<ComponentClass<any>, Map<Entity, any>>();
  private systems: System[] = [];

  // === QUẢN LÝ ENTITY ===
  public createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  // === QUẢN LÝ COMPONENT ===
  public addComponent<T extends Component>(entity: Entity, component: T): void {
    const componentClass = component.constructor as ComponentClass<T>;
    if (!this.components.has(componentClass)) {
      this.components.set(componentClass, new Map());
    }
    this.components.get(componentClass)!.set(entity, component);
  }

  public getComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): T | undefined {
    return this.components.get(componentClass)?.get(entity);
  }

  public hasComponent<T extends Component>(
    entity: Entity,
    componentClass: ComponentClass<T>
  ): boolean {
    return this.components.get(componentClass)?.has(entity) ?? false;
  }

  // === QUẢN LÝ SYSTEM ===
  public addSystem(system: System): void {
    this.systems.push(system);
  }

  /**
   * Hàm truy vấn cốt lõi: Tìm tất cả các Entity có một tập hợp Component nhất định.
   */
  public query(componentClasses: ComponentClass<any>[]): Entity[] {
    const entitiesWithComponents: Entity[] = [];
    for (const entity of this.entities) {
      if (componentClasses.every((cls) => this.hasComponent(entity, cls))) {
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
