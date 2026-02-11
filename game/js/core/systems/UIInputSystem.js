const System = require('../../framework/System');
const UITransformComponent = require('../components/UITransformComponent');
const UIClickComponent = require('../components/UIClickComponent');
const UIDragComponent = require('../components/UIDragComponent');
const ScreenData = require('../data/ScreenData');

/**
 * UIInputSystem - UI 输入系统
 * 监听微信小游戏触摸事件（touchStart / touchMove / touchEnd），
 * 对 UI Entity 树进行命中检测，处理 UI 拖动和点击。
 *
 * 事件调度规则（UI 优先，游戏层兜底）：
 *
 * touchStart:
 *   1. 遍历 UI 树查找可拖动目标（UIDragComponent）
 *   2. 若命中 → UI 拥有本次触摸会话，开始拖动
 *   3. 若未命中 → 广播 'input_touch_start'，交由游戏层处理
 *
 * touchMove:
 *   - UI 拥有触摸 → 更新 UI 拖动
 *   - 否则 → 广播 'input_touch_move'
 *
 * touchEnd:
 *   - UI 拥有触摸（正在拖动）→ 结束拖动
 *   - 否则 → 检测 UI 点击（UIClickComponent），命中则触发回调
 *   - UI 既无拖动也无点击 → 广播 'input_touch_end'，交由游戏层处理
 */
class UIInputSystem extends System {
  /**
   * @param {import('../../framework/EventDispatcher')} eventDispatcher
   * @param {import('../../framework/DataManager')} dataManager
   * @param {Map<number, import('../../framework/Entity')>} entities
   */
  constructor(eventDispatcher, dataManager, entities) {
    super(eventDispatcher, dataManager, entities);

    /** @private @type {boolean} 当前触摸会话是否由 UI 层拥有 */
    this._uiOwnTouch = false;
    /** @private @type {import('../../framework/Entity')|null} 当前拖动的 UI Entity */
    this._activeDragEntity = null;

    /** @private @type {Function} */
    this._touchStartHandler = this._onTouchStart.bind(this);
    /** @private @type {Function} */
    this._touchMoveHandler = this._onTouchMove.bind(this);
    /** @private @type {Function} */
    this._touchEndHandler = this._onTouchEnd.bind(this);

    wx.onTouchStart(this._touchStartHandler);
    wx.onTouchMove(this._touchMoveHandler);
    wx.onTouchEnd(this._touchEndHandler);
  }

  // ---- 触摸事件处理 ----

  /**
   * @private
   * @param {Object} res
   */
  _onTouchStart(res) {
    const touch = res.changedTouches[0];
    if (!touch) return;

    const { clientX, clientY } = touch;

    this._uiOwnTouch = false;
    this._activeDragEntity = null;

    // 在 UI 树中查找可拖动目标
    const dragTarget = this._findDragTarget(clientX, clientY);
    if (dragTarget) {
      this._uiOwnTouch = true;
      this._activeDragEntity = dragTarget;
      const dragComp = dragTarget.GetComponent(UIDragComponent.ID);
      dragComp.TriggerDragStart(clientX, clientY);
      return; // UI 消费
    }

    // UI 未消费，广播给游戏层
    this._eventDispatcher.Emit('input_touch_start', { x: clientX, y: clientY });
  }

  /**
   * @private
   * @param {Object} res
   */
  _onTouchMove(res) {
    const touch = res.changedTouches[0];
    if (!touch) return;

    const { clientX, clientY } = touch;

    if (this._uiOwnTouch && this._activeDragEntity) {
      const dragComp = this._activeDragEntity.GetComponent(UIDragComponent.ID);
      if (dragComp) {
        dragComp.TriggerDrag(clientX, clientY);
      }
      return; // UI 消费
    }

    // UI 未消费，广播给游戏层
    this._eventDispatcher.Emit('input_touch_move', { x: clientX, y: clientY });
  }

  /**
   * @private
   * @param {Object} res
   */
  _onTouchEnd(res) {
    const touch = res.changedTouches[0];
    if (!touch) return;

    const { clientX, clientY } = touch;

    // 情况 1：UI 正在拖动 → 结束拖动
    if (this._uiOwnTouch && this._activeDragEntity) {
      const dragComp = this._activeDragEntity.GetComponent(UIDragComponent.ID);
      if (dragComp) {
        dragComp.TriggerDragEnd(clientX, clientY);
      }
      this._activeDragEntity = null;
      this._uiOwnTouch = false;
      return; // UI 消费
    }

    // 情况 2：非 UI 拖动会话 → 检测 UI 点击
    const screenData = this._dataManager.GetData(ScreenData.ID);
    if (screenData && screenData.uiRootId) {
      const rootEntity = this._entities.get(screenData.uiRootId);
      if (rootEntity) {
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
              return; // UI 消费了点击
            }
          }
        }
      }
    }

    // 情况 3：UI 层既无拖动也无点击 → 广播给游戏层
    this._eventDispatcher.Emit('input_touch_end', { x: clientX, y: clientY });
  }

  // ---- 辅助方法 ----

  /**
   * 在 UI 树中查找可拖动的目标
   * 深度优先收集后反向遍历（上层优先）
   * @private
   * @param {number} px
   * @param {number} py
   * @returns {import('../../framework/Entity')|null}
   */
  _findDragTarget(px, py) {
    const screenData = this._dataManager.GetData(ScreenData.ID);
    if (!screenData || !screenData.uiRootId) return null;

    const rootEntity = this._entities.get(screenData.uiRootId);
    if (!rootEntity) return null;

    const draggables = [];
    this._collectDraggables(rootEntity, draggables);

    // 反向遍历
    for (let i = draggables.length - 1; i >= 0; i--) {
      const entity = draggables[i];
      const uiTransform = entity.GetComponent(UITransformComponent.ID);
      if (uiTransform && uiTransform.ContainsPoint(px, py)) {
        const dragComp = entity.GetComponent(UIDragComponent.ID);
        if (dragComp && dragComp.IsEnabled()) {
          return entity;
        }
      }
    }

    return null;
  }

  /**
   * 递归收集所有带 UIDragComponent 的 Entity
   * @private
   * @param {import('../../framework/Entity')} entity
   * @param {Array<import('../../framework/Entity')>} list
   */
  _collectDraggables(entity, list) {
    const uiTransform = entity.GetComponent(UITransformComponent.ID);
    if (!uiTransform || !uiTransform.visible) return;

    if (entity.GetComponent(UIDragComponent.ID)) {
      list.push(entity);
    }

    const children = entity.GetChildren();
    for (let i = 0; i < children.length; i++) {
      this._collectDraggables(children[i], list);
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
    wx.offTouchStart(this._touchStartHandler);
    wx.offTouchMove(this._touchMoveHandler);
    wx.offTouchEnd(this._touchEndHandler);
    this._touchStartHandler = null;
    this._touchMoveHandler = null;
    this._touchEndHandler = null;
    this._activeDragEntity = null;
    this._uiOwnTouch = false;
    super.Dispose();
  }
}

module.exports = UIInputSystem;
