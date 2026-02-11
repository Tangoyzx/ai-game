const Component = require('../../framework/Component');
const UITransformComponent = require('./UITransformComponent');

/**
 * UIDragComponent - UI 层拖动组件
 * 拖动时自动更新同 Entity 上 UITransformComponent 的 x/y。
 * 命中检测复用 UITransformComponent.ContainsPoint，由 UIInputSystem 调度。
 *
 * 回调参数格式: (x, y) - 屏幕坐标
 */
class UIDragComponent extends Component {
  static ID = 'UIDragComponent';

  /**
   * @param {Object} [options]
   * @param {Function|null} [options.onDragStart=null] - 拖动开始回调 (x, y)
   * @param {Function|null} [options.onDrag=null]      - 拖动中回调 (x, y)
   * @param {Function|null} [options.onDragEnd=null]   - 拖动结束回调 (x, y)
   */
  constructor(options = {}) {
    super();
    /** @private @type {Function|null} */
    this._onDragStart = options.onDragStart || null;
    /** @private @type {Function|null} */
    this._onDrag = options.onDrag || null;
    /** @private @type {Function|null} */
    this._onDragEnd = options.onDragEnd || null;
    /** @private @type {boolean} */
    this._enabled = true;

    // 拖动状态（由 UIInputSystem 通过 Trigger 方法驱动）
    /** @private @type {number} 触摸起始 X */
    this._startX = 0;
    /** @private @type {number} 触摸起始 Y */
    this._startY = 0;
    /** @private @type {number} 拖动开始时 UITransform 的 x */
    this._originX = 0;
    /** @private @type {number} 拖动开始时 UITransform 的 y */
    this._originY = 0;
  }

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
   * 触发拖动开始
   * @param {number} x - 触摸屏幕 X
   * @param {number} y - 触摸屏幕 Y
   */
  TriggerDragStart(x, y) {
    this._startX = x;
    this._startY = y;

    const uiTransform = this.entity.GetComponent(UITransformComponent.ID);
    if (uiTransform) {
      this._originX = uiTransform.x;
      this._originY = uiTransform.y;
    }

    if (this._onDragStart) {
      this._onDragStart(x, y);
    }
  }

  /**
   * 触发拖动中
   * @param {number} x - 触摸屏幕 X
   * @param {number} y - 触摸屏幕 Y
   */
  TriggerDrag(x, y) {
    const uiTransform = this.entity.GetComponent(UITransformComponent.ID);
    if (uiTransform) {
      uiTransform.x = this._originX + (x - this._startX);
      uiTransform.y = this._originY + (y - this._startY);
    }

    if (this._onDrag) {
      this._onDrag(x, y);
    }
  }

  /**
   * 触发拖动结束
   * @param {number} x - 触摸屏幕 X
   * @param {number} y - 触摸屏幕 Y
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
    this._enabled = true;
  }
}

module.exports = UIDragComponent;
