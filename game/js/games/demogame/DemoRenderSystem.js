const System = require('../../framework/System');
const ScreenData = require('../../core/data/ScreenData');
const UITransformComponent = require('../../core/components/UITransformComponent');

/**
 * DemoRenderSystem - 演示用渲染系统
 *
 * 职责：
 * 1. 在 Game Canvas 上绘制带有 _demoRender 数据的游戏层 Entity（彩色方块 + 文字标签）
 * 2. 在 UI Canvas 上绘制带有 _demoBg 数据的 UI Entity 背景（用于给 UI 元素加底色）
 *
 * 注意：这是演示专用系统，正式项目应有独立的游戏渲染系统。
 */
class DemoRenderSystem extends System {
  /**
   * @param {number} dt
   */
  Update(dt) {
    const screenData = this._dataManager.GetData(ScreenData.ID);
    if (!screenData) return;

    // 渲染游戏层元素
    if (screenData.gameCtx) {
      this._renderGameEntities(screenData.gameCtx, screenData);
    }

    // 渲染 UI 背景（在 UIRenderSystem 之前调用，所以背景在文字下方）
    if (screenData.uiCtx) {
      this._renderUIBackgrounds(screenData.uiCtx, screenData);
    }
  }

  /**
   * 绘制游戏层方块
   * @private
   * @param {CanvasRenderingContext2D} ctx
   * @param {ScreenData} screenData
   */
  _renderGameEntities(ctx, screenData) {
    // 背景网格（帮助观察拖动效果）
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, screenData.width, screenData.height);

    // 绘制网格线
    ctx.strokeStyle = '#2a2a4e';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < screenData.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, screenData.height);
      ctx.stroke();
    }
    for (let y = 0; y < screenData.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(screenData.width, y);
      ctx.stroke();
    }

    // 绘制带 _demoRender 的 Entity
    for (const [id, entity] of this._entities) {
      const renderData = entity._demoRender;
      if (!renderData) continue;

      const pos = renderData.getPos();
      const size = renderData.size;
      const color = renderData.getColor ? renderData.getColor() : renderData.color;
      const label = renderData.getLabel ? renderData.getLabel() : renderData.label;

      // 方块阴影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(pos.x + 4, pos.y + 4, size, size);

      // 方块本体
      ctx.fillStyle = color;
      ctx.fillRect(pos.x, pos.y, size, size);

      // 方块边框
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, size, size);

      // 标签文字
      if (label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, pos.x + size / 2, pos.y + size / 2);
      }
    }
  }

  /**
   * 绘制 UI 元素背景色
   * @private
   * @param {CanvasRenderingContext2D} ctx
   * @param {ScreenData} screenData
   */
  _renderUIBackgrounds(ctx, screenData) {
    const rootEntity = this._entities.get(screenData.uiRootId);
    if (!rootEntity) return;

    this._renderUIBgRecursive(ctx, rootEntity);
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('../../framework/Entity')} entity
   */
  _renderUIBgRecursive(ctx, entity) {
    const uiTransform = entity.GetComponent(UITransformComponent.ID);
    if (!uiTransform || !uiTransform.visible) return;

    const bgData = entity._demoBg;
    if (bgData) {
      const pos = uiTransform.GetAbsolutePosition();
      const w = uiTransform.width;
      const h = uiTransform.height;

      // 圆角矩形背景
      const radius = 6;
      ctx.fillStyle = bgData.color;
      ctx.beginPath();
      ctx.moveTo(pos.x + radius, pos.y);
      ctx.lineTo(pos.x + w - radius, pos.y);
      ctx.quadraticCurveTo(pos.x + w, pos.y, pos.x + w, pos.y + radius);
      ctx.lineTo(pos.x + w, pos.y + h - radius);
      ctx.quadraticCurveTo(pos.x + w, pos.y + h, pos.x + w - radius, pos.y + h);
      ctx.lineTo(pos.x + radius, pos.y + h);
      ctx.quadraticCurveTo(pos.x, pos.y + h, pos.x, pos.y + h - radius);
      ctx.lineTo(pos.x, pos.y + radius);
      ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
      ctx.closePath();
      ctx.fill();

      // 边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const children = entity.GetChildren();
    for (let i = 0; i < children.length; i++) {
      this._renderUIBgRecursive(ctx, children[i]);
    }
  }
}

module.exports = DemoRenderSystem;
