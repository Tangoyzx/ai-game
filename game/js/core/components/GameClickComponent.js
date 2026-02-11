const Component = require('../../framework/Component');

/**
 * GameClickComponent - 游戏层点击回调组件
 * 用于游戏层 Entity 的点击交互，自带命中区域定义（bounds）。
 * 命中检测由 GameInputSystem 负责，匹配后调用 TriggerClick。
 *
 * bounds 为相对于 Entity 位置的点击区域：
 *   实际命中区域 = (x + offsetX, y + offsetY, width, height)
 * 其中 x/y 由 GetPosition 回调返回，允许游戏层自定义坐标来源。
 */
class GameClickComponent extends Component {
  static ID = 'GameClickComponent';

  /**
   * @param {Object} options
   * @param {Function|null} [options.onClick=null] - 点击回调函数
   * @param {number} [options.offsetX=0]   - 命中区域相对 Entity 位置的 X 偏移
   * @param {number} [options.offsetY=0]   - 命中区域相对 Entity 位置的 Y 偏移
   * @param {number} [options.width=0]     - 命中区域宽度
   * @param {number} [options.height=0]    - 命中区域高度
   * @param {Function|null} [options.getPosition=null] - 获取 Entity 世界坐标的回调 () => {x, y}，
   *   为 null 时默认返回 (0, 0)，使用者可根据自己的 Transform/位置组件来提供
   */
  constructor(options = {}) {
    super();
    /** @private @type {Function|null} */
    this._onClick = options.onClick || null;
    /** @private @type {number} */
    this._offsetX = options.offsetX || 0;
    /** @private @type {number} */
    this._offsetY = options.offsetY || 0;
    /** @private @type {number} */
    this._width = options.width || 0;
    /** @private @type {number} */
    this._height = options.height || 0;
    /** @private @type {Function|null} */
    this._getPosition = options.getPosition || null;
    /** @private @type {boolean} */
    this._enabled = true;
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
   * 设置点击回调
   * @param {Function} callback
   */
  SetOnClick(callback) {
    this._onClick = callback;
  }

  /**
   * 获取点击回调
   * @returns {Function|null}
   */
  GetOnClick() {
    return this._onClick;
  }

  /**
   * 设置获取位置的回调
   * @param {Function} callback - () => { x: number, y: number }
   */
  SetGetPosition(callback) {
    this._getPosition = callback;
  }

  /**
   * 设置是否启用
   * @param {boolean} enabled
   */
  SetEnabled(enabled) {
    this._enabled = enabled;
  }

  /**
   * 是否可点击（启用且有回调）
   * @returns {boolean}
   */
  IsEnabled() {
    return this._enabled && this._onClick !== null;
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
   * @param {number} px - 测试点 X（世界坐标）
   * @param {number} py - 测试点 Y（世界坐标）
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
   * 触发点击回调
   */
  TriggerClick() {
    if (this.IsEnabled()) {
      this._onClick();
    }
  }

  OnDispose() {
    this._onClick = null;
    this._getPosition = null;
    this._enabled = true;
  }
}

module.exports = GameClickComponent;
