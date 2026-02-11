const System = require('../../framework/System');
const UITransformComponent = require('../components/UITransformComponent');
const UIClickComponent = require('../components/UIClickComponent');
const ScreenData = require('../data/ScreenData');

/**
 * UIInputSystem - UI 输入系统
 * 监听微信小游戏触摸事件，对 UI Entity 树进行命中检测。
 * 采用深度优先收集后反向遍历（后绘制 = 在上层 = 优先响应），
 * 找到第一个命中的 UIClickComponent 即触发回调并停止。
 */
class UIInputSystem extends System {
  /**
   * @param {import('../../framework/EventDispatcher')} eventDispatcher
   * @param {import('../../framework/DataManager')} dataManager
   * @param {Map<number, import('../../framework/Entity')>} entities
   */
  constructor(eventDispatcher, dataManager, entities) {
    super(eventDispatcher, dataManager, entities);

    /** @private @type {Function} */
    this._touchEndHandler = this._onTouchEnd.bind(this);
    wx.onTouchEnd(this._touchEndHandler);
  }

  /**
   * 触摸结束事件处理
   * @private
   * @param {Object} res - 微信触摸事件对象
   */
  _onTouchEnd(res) {
    const touch = res.changedTouches[0];
    if (!touch) return;

    const { clientX, clientY } = touch;

    const screenData = this._dataManager.GetData(ScreenData.ID);
    if (!screenData || !screenData.uiRootId) return;

    const rootEntity = this._entities.get(screenData.uiRootId);
    if (!rootEntity) return;

    // 深度优先收集所有可点击的 Entity
    const clickables = [];
    this._collectClickables(rootEntity, clickables);

    // 反向遍历（后绘制的在上层，优先响应）
    for (let i = clickables.length - 1; i >= 0; i--) {
      const entity = clickables[i];
      const uiTransform = entity.GetComponent(UITransformComponent.ID);
      if (uiTransform && uiTransform.ContainsPoint(clientX, clientY)) {
        const clickComp = entity.GetComponent(UIClickComponent.ID);
        if (clickComp && clickComp.IsEnabled()) {
          clickComp.TriggerClick();
          return; // 命中即停止
        }
      }
    }
  }

  /**
   * 递归收集所有带 UIClickComponent 的 Entity
   * @private
   * @param {import('../../framework/Entity')} entity
   * @param {Array<import('../../framework/Entity')>} list
   */
  _collectClickables(entity, list) {
    const uiTransform = entity.GetComponent(UITransformComponent.ID);
    // 不可见的节点跳过整棵子树
    if (!uiTransform || !uiTransform.visible) return;

    if (entity.GetComponent(UIClickComponent.ID)) {
      list.push(entity);
    }

    const children = entity.GetChildren();
    for (let i = 0; i < children.length; i++) {
      this._collectClickables(children[i], list);
    }
  }

  /**
   * 释放系统，取消触摸事件监听
   */
  Dispose() {
    wx.offTouchEnd(this._touchEndHandler);
    this._touchEndHandler = null;
    super.Dispose();
  }
}

module.exports = UIInputSystem;
