/**
 * Component - 组件基类
 * 各种功能实现类，必须挂载到 Entity 上以生效。
 * 每个子类必须提供一个不重复的静态 ID 属性。
 */
class Component {
  /** @type {string} 子类必须重写此属性 */
  static ID = 'Component';

  constructor() {
    /** @private @type {import('./Entity')|null} */
    this.__entity = null;
    /** @private @type {import('./EventDispatcher')|null} */
    this.__eventDispatcher = null;
    /** @private @type {import('./DataManager')|null} */
    this.__dataManager = null;
  }

  // ---- 只读属性 ----

  /** @returns {import('./Entity')} */
  get entity() {
    return this.__entity;
  }

  /** @returns {import('./EventDispatcher')} */
  get eventDispatcher() {
    return this.__eventDispatcher;
  }

  /** @returns {import('./DataManager')} */
  get dataManager() {
    return this.__dataManager;
  }

  /**
   * 获取该 Component 子类的类型 ID
   * @returns {string}
   */
  GetID() {
    return this.constructor.ID;
  }

  /**
   * 初始化组件，由 Entity.AddComponent 调用
   * @param {import('./Entity')} entity
   * @param {import('./EventDispatcher')} eventDispatcher
   * @param {import('./DataManager')} dataManager
   */
  Init(entity, eventDispatcher, dataManager) {
    this.__entity = entity;
    this.__eventDispatcher = eventDispatcher;
    this.__dataManager = dataManager;
    this.OnInit();
  }

  /**
   * 释放组件
   */
  Dispose() {
    this.OnDispose();
    this.__entity = null;
    this.__eventDispatcher = null;
    this.__dataManager = null;
  }

  // ---- 供子类重写的生命周期方法 ----

  /**
   * 初始化时回调，供子类重写
   */
  OnInit() {}

  /**
   * 释放时回调，供子类重写
   */
  OnDispose() {}

  // ---- EventDispatcher 中转方法 ----

  /**
   * 注册事件监听（中转给 EventDispatcher）
   * @param {string} eventId
   * @param {Function} callback
   * @param {any} [context]
   */
  On(eventId, callback, context) {
    if (this.__eventDispatcher) {
      this.__eventDispatcher.On(eventId, callback, context);
    }
  }

  /**
   * 移除事件监听（中转给 EventDispatcher）
   * @param {string} eventId
   * @param {Function} callback
   * @param {any} [context]
   */
  Off(eventId, callback, context) {
    if (this.__eventDispatcher) {
      this.__eventDispatcher.Off(eventId, callback, context);
    }
  }

  /**
   * 广播事件（中转给 EventDispatcher）
   * @param {string} eventId
   * @param {Object} [params]
   */
  Emit(eventId, params) {
    if (this.__eventDispatcher) {
      this.__eventDispatcher.Emit(eventId, params);
    }
  }
}

module.exports = Component;
