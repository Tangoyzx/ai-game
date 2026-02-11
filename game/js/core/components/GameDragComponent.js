const Component = require('../../framework/Component');

/**
 * GameDragComponent - 游戏层拖动组件
 * 用于游戏层 Entity 的拖动交互，自带命中区域（bounds）和位置读写回调。
 * 拖动时通过 setPosition 回调更新 Entity 位置。命中检测由 GameInputSystem 调度。
 *
 * bounds 为相对于 Entity 位置的命中区域：
 *   实际命中区域 = (position.x + offsetX, position.y + offsetY, width, height)
 *
 * 回调参数格式: (x, y) - 屏幕坐标
 */
class GameDragComponent extends Component {
  static ID = 'GameDragComponent';

  /**
   * @param {Object} [options]
   * @param {Function|null} [options.onDragStart=null] - 拖动开始回调 (x, y)
   * @param {Function|null} [options.onDrag=null]      - 拖动中回调 (x, y)
   * @param {Function|null} [options.onDragEnd=null]   - 拖动结束回调 (x, y)
   * @param {Function|null} [options.getPosition=null]  - 获取 Entity 世界坐标 () => {x, y}
   * @param {Function|null} [options.setPosition=null]  - 设置 Entity 世界坐标 (x, y) => void
   * @param {number} [options.offsetX=0]   - 命中区域 X 偏移
   * @param {number} [options.offsetY=0]   - 命中区域 Y 偏移
   * @param {number} [options.width=0]     - 命中区域宽度
   * @param {number} [options.height=0]    - 命中区域高度
   */
  constructor(options = {}) {
    super();
    /** @private @type {Function|null} */
    this._onDragStart = options.onDragStart || null;
    /** @private @type {Function|null} */
    this._onDrag = options.onDrag || null;
    /** @private @type {Function|null} */
    this._onDragEnd = options.onDragEnd || null;
    /** @private @type {Function|null} */
    this._getPosition = options.getPosition || null;
    /** @private @type {Function|null} */
    this._setPosition = options.setPosition || null;
    /** @private @type {number} */
    this._offsetX = options.offsetX || 0;
    /** @private @type {number} */
    this._offsetY = options.offsetY || 0;
    /** @private @type {number} */
    this._width = options.width || 0;
    /** @private @type {number} */
    this._height = options.height || 0;
    /** @private @type {boolean} */
    this._enabled = true;

    // 拖动状态
    /** @private @type {number} */
    this._startX = 0;
    /** @private @type {number} */
    this._startY = 0;
    /** @private @type {number} */
    this._originX = 0;
    /** @private @type {number} */
    this._originY = 0;
  }

  // ---- bounds getter/setter ----

  get offsetX() { return this._offsetX; }
  set offsetX(v) { this._offsetX = v; }

  get offsetY() { return this._offsetY; }
  set offsetY(v) { this._offsetY = v; }

  get width() { return this._width; }
  set width(v) { this._width = v; }

  get height() { return this._height; }
  set height(v) { this._height = v; }

  /**
   * 设置是否启用
   * @param {boolean} enabled
   */
  SetEnabled(enabled) {
    this._enabled = enabled;
  }

  /**
   * @returns {boolean}
   */
  IsEnabled() {
    return this._enabled;
  }

  /**
   * 设置获取位置的回调
   * @param {Function} callback - () => { x: number, y: number }
   */
  SetGetPosition(callback) {
    this._getPosition = callback;
  }

  /**
   * 设置设置位置的回调
   * @param {Function} callback - (x: number, y: number) => void
   */
  SetSetPosition(callback) {
    this._setPosition = callback;
  }

  /**
   * 获取 Entity 的世界位置
   * @returns {{ x: number, y: number }}
   */
  GetPosition() {
    if (this._getPosition) {
      return this._getPosition();
    }
    return { x: 0, y: 0 };
  }

  /**
   * 判断点是否在命中区域内
   * @param {number} px
   * @param {number} py
   * @returns {boolean}
   */
  ContainsPoint(px, py) {
    const pos = this.GetPosition();
    const left = pos.x + this._offsetX;
    const top = pos.y + this._offsetY;
    return px >= left && px <= left + this._width
        && py >= top && py <= top + this._height;
  }

  /**
   * 触发拖动开始
   * @param {number} x
   * @param {number} y
   */
  TriggerDragStart(x, y) {
    this._startX = x;
    this._startY = y;
    const pos = this.GetPosition();
    this._originX = pos.x;
    this._originY = pos.y;

    if (this._onDragStart) {
      this._onDragStart(x, y);
    }
  }

  /**
   * 触发拖动中
   * @param {number} x
   * @param {number} y
   */
  TriggerDrag(x, y) {
    if (this._setPosition) {
      this._setPosition(
        this._originX + (x - this._startX),
        this._originY + (y - this._startY)
      );
    }

    if (this._onDrag) {
      this._onDrag(x, y);
    }
  }

  /**
   * 触发拖动结束
   * @param {number} x
   * @param {number} y
   */
  TriggerDragEnd(x, y) {
    if (this._onDragEnd) {
      this._onDragEnd(x, y);
    }
  }

  OnDispose() {
    this._onDragStart = null;
    this._onDrag = null;
    this._onDragEnd = null;
    this._getPosition = null;
    this._setPosition = null;
    this._enabled = true;
  }
}

module.exports = GameDragComponent;
