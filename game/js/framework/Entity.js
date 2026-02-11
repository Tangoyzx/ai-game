const TransformComponent = require('../core/components/TransformComponent');

/**
 * Entity - 实体（组件容器）
 * 游戏中所有内容都是 Entity，功能由 Component 实现。
 * Entity 的子类一般只负责添加不同的 Component 以方便作为预设。
 */
class Entity {
  /** @private @type {number} 静态自增计数器 */
  static _nextId = 1;

  constructor() {
    /** @private @type {number} 唯一实例 ID */
    this._id = Entity._nextId++;
    /** @private @type {Map<string, import('./Component')>} */
    this._components = new Map();
    /** @private @type {import('./EventDispatcher')|null} */
    this._eventDispatcher = null;
    /** @private @type {import('./DataManager')|null} */
    this._dataManager = null;
  }

  /** @returns {number} 实体唯一 ID */
  get id() {
    return this._id;
  }

  /**
   * 初始化实体，传入 EventDispatcher 与 DataManager 并持有引用
   * 自动添加 TransformComponent
   * @param {import('./EventDispatcher')} eventDispatcher
   * @param {import('./DataManager')} dataManager
   */
  Init(eventDispatcher, dataManager) {
    this._eventDispatcher = eventDispatcher;
    this._dataManager = dataManager;

    // 默认添加 TransformComponent
    this.AddComponent(new TransformComponent());
  }

  /**
   * 释放实体，调用所有 Component 的 Dispose
   */
  Dispose() {
    // 遍历所有组件并释放
    for (const [compId, comp] of this._components) {
      comp.Dispose();
    }
    this._components.clear();
    this._eventDispatcher = null;
    this._dataManager = null;
  }

  /**
   * 添加组件
   * 传入 Component 子类实例，以其类型 ID 为 key 存入 hashmap，并调用 Init。
   * 若同 ID 已存在则警告、移除原有 Component 并执行新 Component 的添加。
   * @param {import('./Component')} component
   * @returns {import('./Component')} 添加的组件实例
   */
  AddComponent(component) {
    const compId = component.GetID();

    if (this._components.has(compId)) {
      console.warn(
        `[Entity ${this._id}] AddComponent: 组件 "${compId}" 已存在，将替换为新实例`
      );
      this.RemoveComponent(compId);
    }

    this._components.set(compId, component);
    component.Init(this, this._eventDispatcher, this._dataManager);
    return component;
  }

  /**
   * 移除组件
   * @param {string} componentId - Component 子类的静态 ID
   */
  RemoveComponent(componentId) {
    const comp = this._components.get(componentId);
    if (comp) {
      comp.Dispose();
      this._components.delete(componentId);
    }
  }

  /**
   * 获取组件
   * @param {string} componentId - Component 子类的静态 ID
   * @returns {import('./Component')|undefined}
   */
  GetComponent(componentId) {
    return this._components.get(componentId);
  }

  /**
   * 快捷获取 TransformComponent
   * @returns {import('./TransformComponent')|undefined}
   */
  GetTransform() {
    return this._components.get(TransformComponent.ID);
  }

  // ---- 层级关系快捷方法（委托给 TransformComponent） ----

  /**
   * 设置父 Entity
   * @param {Entity|null} parentEntity
   */
  SetParent(parentEntity) {
    const transform = this.GetTransform();
    if (transform) {
      transform.SetParent(parentEntity);
    }
  }

  /**
   * 获取父 Entity
   * @returns {Entity|null}
   */
  GetParent() {
    const transform = this.GetTransform();
    return transform ? transform.GetParent() : null;
  }

  /**
   * 添加子 Entity
   * @param {Entity} childEntity
   */
  AddChild(childEntity) {
    const transform = this.GetTransform();
    if (transform) {
      transform.AddChild(childEntity);
    }
  }

  /**
   * 移除子 Entity
   * @param {Entity} childEntity
   */
  RemoveChild(childEntity) {
    const transform = this.GetTransform();
    if (transform) {
      transform.RemoveChild(childEntity);
    }
  }

  /**
   * 获取所有子 Entity
   * @returns {Array<Entity>}
   */
  GetChildren() {
    const transform = this.GetTransform();
    return transform ? transform.GetChildren() : [];
  }
}

module.exports = Entity;
