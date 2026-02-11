const System = require('../../framework/System');
const GameClickComponent = require('../components/GameClickComponent');
const GameDragComponent = require('../components/GameDragComponent');

/**
 * GameInputSystem - 游戏层输入系统
 * 通过 EventDispatcher 监听 UIInputSystem 广播的触摸事件，
 * 对游戏层 Entity 做拖动和点击的命中检测。
 *
 * 事件调度规则：
 *
 * input_touch_start:
 *   1. 遍历所有带 GameDragComponent 的 Entity，查找拖动目标
 *   2. 若命中 → 开始游戏层拖动
 *
 * input_touch_move:
 *   - 有活跃拖动 → 更新拖动
 *
 * input_touch_end:
 *   - 有活跃拖动 → 结束拖动
 *   - 无拖动 → 检测点击（GameClickComponent）
 *
 * 使用方式：在 UIInputSystem 之后通过 Game.AddSystem(GameInputSystem) 添加。
 */
class GameInputSystem extends System {
  /**
   * @param {import('../../framework/EventDispatcher')} eventDispatcher
   * @param {import('../../framework/DataManager')} dataManager
   * @param {Map<number, import('../../framework/Entity')>} entities
   */
  constructor(eventDispatcher, dataManager, entities) {
    super(eventDispatcher, dataManager, entities);

    /** @private @type {import('../../framework/Entity')|null} 当前拖动的游戏 Entity */
    this._activeDragEntity = null;

    /** @private @type {Function} */
    this._handleTouchStartBound = this._handleTouchStart.bind(this);
    /** @private @type {Function} */
    this._handleTouchMoveBound = this._handleTouchMove.bind(this);
    /** @private @type {Function} */
    this._handleTouchEndBound = this._handleTouchEnd.bind(this);

    this._eventDispatcher.On('input_touch_start', this._handleTouchStartBound, this);
    this._eventDispatcher.On('input_touch_move', this._handleTouchMoveBound, this);
    this._eventDispatcher.On('input_touch_end', this._handleTouchEndBound, this);
  }

  // ---- 事件处理 ----

  /**
   * @private
   * @param {string} eventId
   * @param {import('../../framework/EventDispatcher')} dispatcher
   * @param {{ x: number, y: number }} params
   */
  _handleTouchStart(eventId, dispatcher, params) {
    const { x, y } = params;
    this._activeDragEntity = null;

    // 收集可拖动的 Entity，反向遍历（后添加 = 上层 = 优先）
    const draggables = [];
    for (const [id, entity] of this._entities) {
      const dragComp = entity.GetComponent(GameDragComponent.ID);
      if (dragComp && dragComp.IsEnabled()) {
        draggables.push(entity);
      }
    }

    for (let i = draggables.length - 1; i >= 0; i--) {
      const entity = draggables[i];
      const dragComp = entity.GetComponent(GameDragComponent.ID);
      if (dragComp.ContainsPoint(x, y)) {
        this._activeDragEntity = entity;
        dragComp.TriggerDragStart(x, y);
        return;
      }
    }
  }

  /**
   * @private
   * @param {string} eventId
   * @param {import('../../framework/EventDispatcher')} dispatcher
   * @param {{ x: number, y: number }} params
   */
  _handleTouchMove(eventId, dispatcher, params) {
    if (!this._activeDragEntity) return;

    const { x, y } = params;
    const dragComp = this._activeDragEntity.GetComponent(GameDragComponent.ID);
    if (dragComp) {
      dragComp.TriggerDrag(x, y);
    }
  }

  /**
   * @private
   * @param {string} eventId
   * @param {import('../../framework/EventDispatcher')} dispatcher
   * @param {{ x: number, y: number }} params
   */
  _handleTouchEnd(eventId, dispatcher, params) {
    const { x, y } = params;

    // 有拖动 → 结束拖动
    if (this._activeDragEntity) {
      const dragComp = this._activeDragEntity.GetComponent(GameDragComponent.ID);
      if (dragComp) {
        dragComp.TriggerDragEnd(x, y);
      }
      this._activeDragEntity = null;
      return; // 拖动消费了事件
    }

    // 无拖动 → 检测点击
    const clickables = [];
    for (const [id, entity] of this._entities) {
      const clickComp = entity.GetComponent(GameClickComponent.ID);
      if (clickComp && clickComp.IsEnabled()) {
        clickables.push(entity);
      }
    }

    // 反向遍历
    for (let i = clickables.length - 1; i >= 0; i--) {
      const entity = clickables[i];
      const clickComp = entity.GetComponent(GameClickComponent.ID);
      if (clickComp.ContainsPoint(x, y)) {
        clickComp.TriggerClick();
        return; // 命中即停止
      }
    }
  }

  /**
   * 释放系统，取消事件监听
   */
  Dispose() {
    this._eventDispatcher.Off('input_touch_start', this._handleTouchStartBound, this);
    this._eventDispatcher.Off('input_touch_move', this._handleTouchMoveBound, this);
    this._eventDispatcher.Off('input_touch_end', this._handleTouchEndBound, this);
    this._handleTouchStartBound = null;
    this._handleTouchMoveBound = null;
    this._handleTouchEndBound = null;
    this._activeDragEntity = null;
    super.Dispose();
  }
}

module.exports = GameInputSystem;
