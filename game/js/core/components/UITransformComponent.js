const Component = require('../../framework/Component');

/**
 * UITransformComponent - UI 定位组件
 * UI 专用定位组件，管理位置、尺寸、锚点和可见性。
 * 与 TransformComponent 共存：TransformComponent 管理父子层级，UITransformComponent 管理 UI 布局。
 *
 * 坐标计算规则：
 *   absoluteX = parent.absoluteX + anchorX * parent.width + x
 *   absoluteY = parent.absoluteY + anchorY * parent.height + y
 *
 * anchorX/anchorY 取值 0~1，表示在父级区域内的参考点：
 *   (0, 0) = 父级左上角, (1, 0) = 父级右上角, (0.5, 0.5) = 父级中心
 */
class UITransformComponent extends Component {
  static ID = 'UITransformComponent';

  /**
   * @param {Object} [options]
   * @param {number} [options.x=0] - 相对父锚点的 X 偏移（像素）
   * @param {number} [options.y=0] - 相对父锚点的 Y 偏移（像素）
   * @param {number} [options.width=0] - 宽度（像素）
   * @param {number} [options.height=0] - 高度（像素）
   * @param {number} [options.anchorX=0] - 父级参考点 X（0~1）
   * @param {number} [options.anchorY=0] - 父级参考点 Y（0~1）
   * @param {boolean} [options.visible=true] - 是否可见（不可见时跳过自身及子树渲染）
   */
  constructor(options = {}) {
    super();
    /** @private @type {number} */
    this._x = options.x || 0;
    /** @private @type {number} */
    this._y = options.y || 0;
    /** @private @type {number} */
    this._width = options.width || 0;
    /** @private @type {number} */
    this._height = options.height || 0;
    /** @private @type {number} */
    this._anchorX = options.anchorX || 0;
    /** @private @type {number} */
    this._anchorY = options.anchorY || 0;
    /** @private @type {boolean} */
    this._visible = options.visible !== undefined ? options.visible : true;
  }

  // ---- getter / setter ----

  /** @returns {number} */
  get x() { return this._x; }
  /** @param {number} value */
  set x(value) { this._x = value; }

  /** @returns {number} */
  get y() { return this._y; }
  /** @param {number} value */
  set y(value) { this._y = value; }

  /** @returns {number} */
  get width() { return this._width; }
  /** @param {number} value */
  set width(value) { this._width = value; }

  /** @returns {number} */
  get height() { return this._height; }
  /** @param {number} value */
  set height(value) { this._height = value; }

  /** @returns {number} */
  get anchorX() { return this._anchorX; }
  /** @param {number} value */
  set anchorX(value) { this._anchorX = value; }

  /** @returns {number} */
  get anchorY() { return this._anchorY; }
  /** @param {number} value */
  set anchorY(value) { this._anchorY = value; }

  /** @returns {boolean} */
  get visible() { return this._visible; }
  /** @param {boolean} value */
  set visible(value) { this._visible = value; }

  // ---- 方法 ----

  /**
   * 计算绝对坐标（递归向上查找父级 UITransformComponent）
   * @returns {{ x: number, y: number }}
   */
  GetAbsolutePosition() {
    let absX = this._x;
    let absY = this._y;

    const parentEntity = this.entity.GetParent();
    if (parentEntity) {
      const parentUI = parentEntity.GetComponent(UITransformComponent.ID);
      if (parentUI) {
        const parentPos = parentUI.GetAbsolutePosition();
        absX = parentPos.x + this._anchorX * parentUI._width + this._x;
        absY = parentPos.y + this._anchorY * parentUI._height + this._y;
      }
    }

    return { x: absX, y: absY };
  }

  /**
   * 判断一个点是否在当前 UI 元素的区域内（用于命中检测）
   * @param {number} px - 点的 X 坐标
   * @param {number} py - 点的 Y 坐标
   * @returns {boolean}
   */
  ContainsPoint(px, py) {
    const pos = this.GetAbsolutePosition();
    return px >= pos.x && px <= pos.x + this._width
        && py >= pos.y && py <= pos.y + this._height;
  }

  OnDispose() {
    this._x = 0;
    this._y = 0;
    this._width = 0;
    this._height = 0;
    this._anchorX = 0;
    this._anchorY = 0;
    this._visible = true;
  }
}

module.exports = UITransformComponent;
