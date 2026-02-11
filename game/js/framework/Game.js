const EventDispatcher = require('./EventDispatcher');
const DataManager = require('./DataManager');
const Entity = require('./Entity');
const ScreenData = require('../core/data/ScreenData');

/**
 * Game - 单个游戏的主要实现
 * 负责 Entity、System、EventDispatcher、DataManager 的创建、删除、查询和持有。
 */
class Game {
  constructor() {
    /** @private @type {EventDispatcher} */
    this._eventDispatcher = null;
    /** @private @type {DataManager} */
    this._dataManager = null;
    /** @private @type {Map<number, Entity>} */
    this._entities = new Map();
    /** @private @type {Array<import('./System')>} */
    this._systems = [];
    /** @private @type {boolean} */
    this._initialized = false;
  }

  /** @returns {EventDispatcher} */
  get eventDispatcher() {
    return this._eventDispatcher;
  }

  /** @returns {DataManager} */
  get dataManager() {
    return this._dataManager;
  }

  /** @returns {Map<number, Entity>} */
  get entities() {
    return this._entities;
  }

  /**
   * 初始化 Game
   * 创建 EventDispatcher 和 DataManager
   * @param {Object} [context] - 可选上下文，由 GameManager 传入，包含画布信息
   * @param {CanvasRenderingContext2D} [context.gameCtx] - 游戏层 Canvas context
   * @param {CanvasRenderingContext2D} [context.uiCtx] - UI 层 Canvas context
   * @param {number} [context.width] - 画布宽度
   * @param {number} [context.height] - 画布高度
   */
  Init(context) {
    this._eventDispatcher = new EventDispatcher();
    this._dataManager = new DataManager();
    this._entities = new Map();
    this._systems = [];
    this._initialized = true;

    // 注册 ScreenData（如有 context）
    if (context) {
      const sd = this._dataManager.RegisterData(ScreenData);
      sd.gameCtx = context.gameCtx || null;
      sd.uiCtx = context.uiCtx || null;
      sd.width = context.width || 0;
      sd.height = context.height || 0;
    }

    this.OnInit();
  }

  /**
   * 子类重写的初始化回调
   */
  OnInit() {}

  /**
   * 释放 Game，清理所有 Entity 和 System
   */
  Dispose() {
    this.OnDispose();

    // 释放所有 Entity
    for (const [id, entity] of this._entities) {
      entity.Dispose();
    }
    this._entities.clear();

    // 释放所有 System
    for (const system of this._systems) {
      system.Dispose();
    }
    this._systems.length = 0;

    // 清空 EventDispatcher
    if (this._eventDispatcher) {
      this._eventDispatcher.Clear();
      this._eventDispatcher = null;
    }

    // 清空 DataManager
    if (this._dataManager) {
      this._dataManager.Clear();
      this._dataManager = null;
    }

    this._initialized = false;
  }

  /**
   * 子类重写的释放回调
   */
  OnDispose() {}

  /**
   * 创建一个新的 Entity 并初始化
   * @param {typeof Entity} [EntityClass=Entity] - Entity 的子类，默认为 Entity 基类
   * @returns {Entity} 创建的 Entity 实例
   */
  CreateEntity(EntityClass) {
    const Cls = EntityClass || Entity;
    const entity = new Cls();
    entity.Init(this._eventDispatcher, this._dataManager);
    this._entities.set(entity.id, entity);
    return entity;
  }

  /**
   * 移除 Entity
   * @param {number} entityId - Entity 的唯一 ID
   */
  RemoveEntity(entityId) {
    const entity = this._entities.get(entityId);
    if (entity) {
      entity.Dispose();
      this._entities.delete(entityId);
    }
  }

  /**
   * 获取 Entity
   * @param {number} entityId - Entity 的唯一 ID
   * @returns {Entity|undefined}
   */
  GetEntity(entityId) {
    return this._entities.get(entityId);
  }

  /**
   * 添加 System
   * @param {typeof import('./System')} SystemClass - System 的子类
   * @returns {import('./System')} 创建的 System 实例
   */
  AddSystem(SystemClass) {
    const system = new SystemClass(this._eventDispatcher, this._dataManager, this._entities);
    this._systems.push(system);
    return system;
  }

  /**
   * 移除 System
   * @param {import('./System')} system - 要移除的 System 实例
   */
  RemoveSystem(system) {
    const index = this._systems.indexOf(system);
    if (index !== -1) {
      system.Dispose();
      this._systems.splice(index, 1);
    }
  }

  /**
   * 每帧更新，遍历所有 System 调用 Update
   * @param {number} dt - 距上一帧的时间间隔（秒）
   */
  Update(dt) {
    for (const system of this._systems) {
      system.Update(dt);
    }
  }
}

module.exports = Game;
