const Component = require('../../framework/Component');

/**
 * UIClickComponent - 点击回调组件
 * 简单的点击交互组件，不处理事件冒泡/穿透。
 * 命中检测由 UIInputSystem 负责，匹配后调用 TriggerClick。
 */
class UIClickComponent extends Component {
  static ID = 'UIClickComponent';

  /**
   * @param {Function|null} [onClick=null] - 点击回调函数
   */
  constructor(onClick) {
    super();
    /** @private @type {Function|null} */
    this._onClick = onClick || null;
    /** @private @type {boolean} */
    this._enabled = true;
  }

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
   * 触发点击回调
   */
  TriggerClick() {
    if (this.IsEnabled()) {
      this._onClick();
    }
  }

  OnDispose() {
    this._onClick = null;
    this._enabled = true;
  }
}

module.exports = UIClickComponent;
