const System = require('../../framework/System');
const UITransformComponent = require('../components/UITransformComponent');
const UITextComponent = require('../components/UITextComponent');
const ScreenData = require('../data/ScreenData');

/**
 * UIRenderSystem - UI 渲染系统
 * 每帧从 UIRoot 开始深度优先遍历 UI Entity 树，
 * 按父先子后的顺序绘制到 UI 离屏 Canvas。
 * visible=false 的节点会跳过自身及整棵子树。
 *
 * 应在所有逻辑 System 之后添加，确保先完成逻辑更新再渲染。
 */
class UIRenderSystem extends System {
  /**
   * 每帧更新：渲染 UI Entity 树
   * @param {number} dt
   */
  Update(dt) {
    const screenData = this._dataManager.GetData(ScreenData.ID);
    if (!screenData || !screenData.uiCtx) return;

    const ctx = screenData.uiCtx;

    // 从 UIRoot 开始深度优先遍历
    const rootEntity = this._entities.get(screenData.uiRootId);
    if (!rootEntity) return;

    this._renderEntity(ctx, rootEntity);
  }

  /**
   * 递归渲染单个 Entity 及其子节点
   * @private
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../../framework/Entity')} entity
   */
  _renderEntity(ctx, entity) {
    const uiTransform = entity.GetComponent(UITransformComponent.ID);
    if (!uiTransform || !uiTransform.visible) return;

    // 绘制 Text
    const textComp = entity.GetComponent(UITextComponent.ID);
    if (textComp && textComp.text) {
      const pos = uiTransform.GetAbsolutePosition();
      ctx.fillStyle = textComp.color;
      ctx.font = `${textComp.fontSize}px ${textComp.fontFamily}`;
      ctx.textAlign = textComp.textAlign;
      ctx.textBaseline = textComp.textBaseline;
      ctx.fillText(textComp.text, pos.x, pos.y);
    }

    // 递归渲染子节点
    const children = entity.GetChildren();
    for (let i = 0; i < children.length; i++) {
      this._renderEntity(ctx, children[i]);
    }
  }
}

module.exports = UIRenderSystem;
