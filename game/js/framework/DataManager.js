/**
 * DataManager - 数据管理器
 * 持有各种数据的管理器，本身不实现任何功能。
 * 只负责提供相关的数据结构供其他功能增删改。
 */
class DataManager {
  constructor() {
    /** @private @type {Map<string, import('./DataBase')>} key 为 DataBase 子类的静态 ID，value 为子类实例 */
    this._dataMap = new Map();
  }

  /**
   * 注册数据类型，以 DataBase 子类的静态 ID 为 key 创建并存储其实例
   * @param {typeof import('./DataBase')} dataClass - DataBase 的子类（类本身，非实例）
   * @returns {import('./DataBase')} 创建的子类实例
   */
  RegisterData(dataClass) {
    const dataId = dataClass.ID;
    if (this._dataMap.has(dataId)) {
      console.warn(`[DataManager] RegisterData: 数据 "${dataId}" 已存在，将返回已有数据`);
      return this._dataMap.get(dataId);
    }

    const data = new dataClass();
    this._dataMap.set(dataId, data);
    return data;
  }

  /**
   * 获取数据
   * @param {string} dataId - DataBase 子类的静态 ID
   * @returns {import('./DataBase')|undefined} 对应的数据实例
   */
  GetData(dataId) {
    return this._dataMap.get(dataId);
  }

  /**
   * 移除数据
   * @param {string} dataId - DataBase 子类的静态 ID
   */
  RemoveData(dataId) {
    this._dataMap.delete(dataId);
  }

  /**
   * 检查是否已注册某种数据
   * @param {string} dataId
   * @returns {boolean}
   */
  HasData(dataId) {
    return this._dataMap.has(dataId);
  }

  /**
   * 清空所有数据
   */
  Clear() {
    this._dataMap.clear();
  }
}

module.exports = DataManager;
