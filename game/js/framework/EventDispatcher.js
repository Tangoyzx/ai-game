/**
 * EventDispatcher - 事件派发器
 * 监听并广播事件，传递事件类型id、事件派发器本身以及一个hashmap的弱类型参数。
 */
class EventDispatcher {
  constructor() {
    /** @type {Map<string, Array<{callback: Function, context: any}>>} */
    this._listeners = new Map();
  }

  /**
   * 注册事件监听
   * @param {string} eventId - 事件类型ID
   * @param {Function} callback - 回调函数，参数为 (eventId, dispatcher, params)
   * @param {any} [context] - 回调函数的上下文
   */
  On(eventId, callback, context) {
    if (!eventId || !callback) {
      console.warn('[EventDispatcher] On: eventId 和 callback 不能为空');
      return;
    }

    if (!this._listeners.has(eventId)) {
      this._listeners.set(eventId, []);
    }

    const listeners = this._listeners.get(eventId);
    // 避免重复注册同一个 callback + context
    const exists = listeners.some(
      (listener) => listener.callback === callback && listener.context === context
    );
    if (!exists) {
      listeners.push({ callback, context: context || null });
    }
  }

  /**
   * 移除事件监听
   * @param {string} eventId - 事件类型ID
   * @param {Function} callback - 回调函数
   * @param {any} [context] - 回调函数的上下文
   */
  Off(eventId, callback, context) {
    if (!this._listeners.has(eventId)) {
      return;
    }

    const listeners = this._listeners.get(eventId);
    const ctx = context || null;
    const index = listeners.findIndex(
      (listener) => listener.callback === callback && listener.context === ctx
    );

    if (index !== -1) {
      listeners.splice(index, 1);
    }

    // 如果该事件已无监听者，移除 key
    if (listeners.length === 0) {
      this._listeners.delete(eventId);
    }
  }

  /**
   * 广播事件
   * @param {string} eventId - 事件类型ID
   * @param {Object} [params] - hashmap 弱类型参数
   */
  Emit(eventId, params) {
    if (!this._listeners.has(eventId)) {
      return;
    }

    // 拷贝一份防止在回调中修改监听列表导致问题
    const listeners = this._listeners.get(eventId).slice();
    for (const listener of listeners) {
      if (listener.context) {
        listener.callback.call(listener.context, eventId, this, params || {});
      } else {
        listener.callback(eventId, this, params || {});
      }
    }
  }

  /**
   * 移除所有事件监听
   */
  Clear() {
    this._listeners.clear();
  }
}

module.exports = EventDispatcher;
