const Component = require('../../framework/Component');

/**
 * TransformComponent - 变换组件
 * Entity 默认持有的组件，负责管理父子层级关系。
 */
class TransformComponent extends Component {
  static ID = 'TransformComponent';

  constructor() {
    super();
    /** @private @type {import('../../framework/Entity')|null} */
    this._parent = null;
    /** @private @type {Array<import('../../framework/Entity')>} */
    this._children = [];
  }

  /**
   * 设置父 Entity
   * @param {import('../../framework/Entity')|null} parentEntity
   */
  SetParent(parentEntity) {
    // 先从旧父节点中移除自身
    if (this._parent) {
      const parentTransform = this._parent.GetTransform();
      if (parentTransform) {
        parentTransform._removeChildInternal(this.entity);
      }
    }

    this._parent = parentEntity;

    // 添加到新父节点的子列表
    if (parentEntity) {
      const parentTransform = parentEntity.GetTransform();
      if (parentTransform) {
        parentTransform._addChildInternal(this.entity);
      }
    }
  }

  /**
   * 添加子 Entity
   * @param {import('../../framework/Entity')} childEntity
   */
  AddChild(childEntity) {
    if (!childEntity) {
      console.warn('[TransformComponent] AddChild: childEntity 不能为空');
      return;
    }

    const childTransform = childEntity.GetTransform();
    if (childTransform) {
      childTransform.SetParent(this.entity);
    }
  }

  /**
   * 移除子 Entity
   * @param {import('../../framework/Entity')} childEntity
   */
  RemoveChild(childEntity) {
    if (!childEntity) return;

    const childTransform = childEntity.GetTransform();
    if (childTransform && childTransform._parent === this.entity) {
      childTransform._parent = null;
      this._removeChildInternal(childEntity);
    }
  }

  /**
   * 获取父 Entity
   * @returns {import('../../framework/Entity')|null}
   */
  GetParent() {
    return this._parent;
  }

  /**
   * 获取所有子 Entity
   * @returns {Array<import('../../framework/Entity')>}
   */
  GetChildren() {
    return this._children.slice();
  }

  /**
   * 内部方法：添加子节点到列表（不触发 SetParent 逻辑）
   * @private
   * @param {import('../../framework/Entity')} childEntity
   */
  _addChildInternal(childEntity) {
    if (this._children.indexOf(childEntity) === -1) {
      this._children.push(childEntity);
    }
  }

  /**
   * 内部方法：从列表移除子节点（不触发 SetParent 逻辑）
   * @private
   * @param {import('../../framework/Entity')} childEntity
   */
  _removeChildInternal(childEntity) {
    const index = this._children.indexOf(childEntity);
    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  OnDispose() {
    // 从父节点移除
    if (this._parent) {
      const parentTransform = this._parent.GetTransform();
      if (parentTransform) {
        parentTransform._removeChildInternal(this.entity);
      }
    }
    this._parent = null;
    this._children.length = 0;
  }
}

module.exports = TransformComponent;
