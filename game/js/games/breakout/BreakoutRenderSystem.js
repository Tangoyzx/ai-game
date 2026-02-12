const System = require('../../framework/System');
const ScreenData = require('../../core/data/ScreenData');
const BreakoutData = require('./BreakoutData');

/**
 * BreakoutRenderSystem - 打砖块渲染系统
 *
 * 在 Game Canvas 上绘制:
 *   1. 深色背景 + 网格线
 *   2. 砖块（不可破坏为灰色，可破坏按耐久度显示绿/黄/红）
 *   3. 小球（白色实心圆）
 */
class BreakoutRenderSystem extends System {
  Update(dt) {
    const screenData = this._dataManager.GetData(ScreenData.ID);
    const data = this._dataManager.GetData(BreakoutData.ID);
    if (!screenData || !data) return;

    const ctx = screenData.gameCtx;
    if (!ctx) return;

    this._renderBackground(ctx, screenData, data);
    this._renderBricks(ctx, data);
    this._renderBall(ctx, data);
  }

  /**
   * 绘制背景和网格线
   * @private
   */
  _renderBackground(ctx, screenData, data) {
    const { width, height } = screenData;
    const { gridOffsetX, gridOffsetY, cellSize, cols, rows } = data;

    // 全屏深色背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // 游戏区域背景（稍微亮一些）
    const areaW = cols * cellSize;
    const areaH = rows * cellSize;
    ctx.fillStyle = '#16213e';
    ctx.fillRect(gridOffsetX, gridOffsetY, areaW, areaH);

    // 网格线
    ctx.strokeStyle = '#1a2744';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      const x = gridOffsetX + c * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, gridOffsetY);
      ctx.lineTo(x, gridOffsetY + areaH);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const y = gridOffsetY + r * cellSize;
      ctx.beginPath();
      ctx.moveTo(gridOffsetX, y);
      ctx.lineTo(gridOffsetX + areaW, y);
      ctx.stroke();
    }
  }

  /**
   * 绘制所有砖块
   * @private
   */
  _renderBricks(ctx, data) {
    const { gridOffsetX, gridOffsetY, cellSize, cols, rows, bricks, brickMaxHP } = data;
    const pad = 1; // 砖块间距（像素）

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = bricks[r][c];
        if (hp === 0) continue;

        const x = gridOffsetX + c * cellSize + pad;
        const y = gridOffsetY + r * cellSize + pad;
        const w = cellSize - pad * 2;
        const h = cellSize - pad * 2;

        // 确定颜色
        let fillColor;
        let borderColor;

        if (hp === -1) {
          // 不可破坏砖块
          fillColor = '#555555';
          borderColor = '#777777';
        } else {
          // 可破坏砖块 - 按耐久度分三档颜色
          const ratio = hp / brickMaxHP;
          if (ratio > 0.65) {
            // 高耐久：绿色
            fillColor = '#27ae60';
            borderColor = '#2ecc71';
          } else if (ratio > 0.3) {
            // 中耐久：黄色
            fillColor = '#f1c40f';
            borderColor = '#f39c12';
          } else {
            // 低耐久：红色
            fillColor = '#e74c3c';
            borderColor = '#c0392b';
          }
        }

        // 砖块本体
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);

        // 砖块边框
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        // 可破坏砖块显示耐久度数字
        if (hp > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(hp), x + w / 2, y + h / 2);
        }
      }
    }
  }

  /**
   * 绘制小球
   * @private
   */
  _renderBall(ctx, data) {
    const { ballX, ballY, ballRadius } = data;

    // 小球阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(ballX + 2, ballY + 2, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // 小球本体
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // 小球高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ballX - ballRadius * 0.3, ballY - ballRadius * 0.3, ballRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

module.exports = BreakoutRenderSystem;
