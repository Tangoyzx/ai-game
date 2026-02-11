/**
 * DataBase - 数据基类
 * 所有数据类型都必须继承 DataBase，每个子类有自己的静态 ID。
 * 子类通过构造函数定义自身的数据字段。
 * 通过 DataManager 注册后以实例形式存储和访问。
 */
class DataBase {
  /** @type {string} 子类必须重写此属性 */
  static ID = 'DataBase';
}

module.exports = DataBase;
