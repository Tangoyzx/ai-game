/**
 * System - 系统基类
 * 游戏中的各种系统，负责处理特定逻辑。
 * 子类需要重写 Update 方法。
 */
class System {
  /**
   * @param {import('./EventDispatcher')} eventDispatcher
   * @param {import('./DataManager')} dataManager
   * @param {Map<number, import('./Entity')>} entities - 当前 Game 的所有 Entity
   */
  constructor(eventDispatcher, dataManager, entities) {
    /** @protected @type {import('./EventDispatcher')} */
    this._eventDispatcher = eventDispatcher;
    /** @protected @type {import('./DataManager')} */
    this._dataManager = dataManager;
    /** @protected @type {Map<number, import('./Entity')>} */
    this._entities = entities;
  }

  /**
   * 每帧更新，由 Game 统一调用
   * @param {number} dt - 距上一帧的时间间隔（秒）
   */
  Update(dt) {
    // 子类重写
  }

  /**
   * 释放系统
   */
  Dispose() {
    this._eventDispatcher = null;
    this._dataManager = null;
    this._entities = null;
  }
}

module.exports = System;
