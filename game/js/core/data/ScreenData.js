const DataBase = require('../../framework/DataBase');

/**
 * ScreenData - 屏幕/画布数据
 * 存储双层 Canvas context 引用和画布尺寸信息。
 * 通过 DataManager 注册后，所有 System/Component 均可读取。
 */
class ScreenData extends DataBase {
  static ID = 'ScreenData';

  constructor() {
    super();
    /** @type {CanvasRenderingContext2D|null} 游戏层 context */
    this.gameCtx = null;
    /** @type {CanvasRenderingContext2D|null} UI 层 context */
    this.uiCtx = null;
    /** @type {number} 画布宽度 */
    this.width = 0;
    /** @type {number} 画布高度 */
    this.height = 0;
    /** @type {number|null} UI 根 Entity 的 id */
    this.uiRootId = null;
  }
}

module.exports = ScreenData;
