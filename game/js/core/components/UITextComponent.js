const Component = require('../../framework/Component');

/**
 * UITextComponent - 文本渲染组件
 * 持有文本渲染所需的数据（文字内容、字体、颜色等）。
 * 不负责实际绘制，绘制由 UIRenderSystem 执行。
 */
class UITextComponent extends Component {
  static ID = 'UITextComponent';

  /**
   * @param {Object} [options]
   * @param {string} [options.text=''] - 文本内容
   * @param {number} [options.fontSize=16] - 字号（像素）
   * @param {string} [options.color='#ffffff'] - 文字颜色
   * @param {string} [options.fontFamily='Arial'] - 字体
   * @param {string} [options.textAlign='left'] - 水平对齐：left | center | right
   * @param {string} [options.textBaseline='top'] - 垂直对齐：top | middle | bottom
   */
  constructor(options = {}) {
    super();
    /** @private @type {string} */
    this._text = options.text || '';
    /** @private @type {number} */
    this._fontSize = options.fontSize || 16;
    /** @private @type {string} */
    this._color = options.color || '#ffffff';
    /** @private @type {string} */
    this._fontFamily = options.fontFamily || 'Arial';
    /** @private @type {string} */
    this._textAlign = options.textAlign || 'left';
    /** @private @type {string} */
    this._textBaseline = options.textBaseline || 'top';
  }

  // ---- getter / setter ----

  /** @returns {string} */
  get text() { return this._text; }
  /** @param {string} value */
  set text(value) { this._text = value; }

  /** @returns {number} */
  get fontSize() { return this._fontSize; }
  /** @param {number} value */
  set fontSize(value) { this._fontSize = value; }

  /** @returns {string} */
  get color() { return this._color; }
  /** @param {string} value */
  set color(value) { this._color = value; }

  /** @returns {string} */
  get fontFamily() { return this._fontFamily; }
  /** @param {string} value */
  set fontFamily(value) { this._fontFamily = value; }

  /** @returns {string} */
  get textAlign() { return this._textAlign; }
  /** @param {string} value */
  set textAlign(value) { this._textAlign = value; }

  /** @returns {string} */
  get textBaseline() { return this._textBaseline; }
  /** @param {string} value */
  set textBaseline(value) { this._textBaseline = value; }

  OnDispose() {
    this._text = '';
  }
}

module.exports = UITextComponent;
