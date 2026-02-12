const Game = require('../../framework/Game');
const ScreenData = require('../../core/data/ScreenData');
const BreakoutData = require('./BreakoutData');
const BreakoutPhysicsSystem = require('./BreakoutPhysicsSystem');
const BreakoutRenderSystem = require('./BreakoutRenderSystem');

/**
 * BreakoutGame - 打砖块游戏
 *
 * 游戏区域 10x15 网格（32x32 像素），屏幕居中。
 *   - 最外一圈：不可破坏砖块
 *   - 往内两圈：可破坏砖块（20 HP）
 *   - 内部：小球运动空间
 *
 * 小球初始在中心，随机方向匀速运动，碰到砖块反弹。
 */
class BreakoutGame extends Game {
  OnInit() {
    const screenData = this.dataManager.GetData(ScreenData.ID);
    const sw = screenData.width;
    const sh = screenData.height;

    // ---- 注册并初始化游戏数据 ----
    const data = this.dataManager.RegisterData(BreakoutData);

    // 计算游戏区域居中偏移
    const areaW = data.cols * data.cellSize; // 320
    const areaH = data.rows * data.cellSize; // 480
    data.gridOffsetX = Math.floor((sw - areaW) / 2);
    data.gridOffsetY = Math.floor((sh - areaH) / 2);

    // ---- 初始化砖块网格 ----
    this._initBricks(data);

    // ---- 初始化小球 ----
    this._initBall(data);

    // ---- 添加系统 ----
    this.AddSystem(BreakoutPhysicsSystem);
    this.AddSystem(BreakoutRenderSystem);

    console.log('[BreakoutGame] 初始化完成');
    console.log('  画布尺寸:', sw, 'x', sh);
    console.log('  游戏区域:', areaW, 'x', areaH, '偏移:', data.gridOffsetX, ',', data.gridOffsetY);
  }

  /**
   * 初始化砖块网格
   * 第 0 圈（最外圈）：不可破坏 (-1)
   * 第 1 圈：可破坏 (20 HP)
   * 第 2 圈：可破坏 (20 HP)
   * 其余：空 (0)
   * @private
   * @param {BreakoutData} data
   */
  _initBricks(data) {
    const { rows, cols, brickMaxHP } = data;

    // 初始化为全空
    data.bricks = [];
    for (let r = 0; r < rows; r++) {
      data.bricks[r] = [];
      for (let c = 0; c < cols; c++) {
        data.bricks[r][c] = 0;
      }
    }

    // 按圈填充
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // 计算当前格子所在的圈数（距离最近边框的最小距离）
        const ring = Math.min(r, c, rows - 1 - r, cols - 1 - c);

        if (ring === 0) {
          // 第 0 圈：不可破坏
          data.bricks[r][c] = -1;
        } else if (ring === 1 || ring === 2) {
          // 第 1、2 圈：可破坏
          data.bricks[r][c] = brickMaxHP;
        }
        // ring >= 3: 保持 0（空）
      }
    }
  }

  /**
   * 初始化小球
   * 位于游戏区域正中心，随机方向匀速运动
   * @private
   * @param {BreakoutData} data
   */
  _initBall(data) {
    const { gridOffsetX, gridOffsetY, cellSize, cols, rows, ballSpeed } = data;

    // 小球在游戏区域正中心
    data.ballX = gridOffsetX + (cols * cellSize) / 2;
    data.ballY = gridOffsetY + (rows * cellSize) / 2;

    // 随机方向（避免过于水平或垂直的角度，确保游戏可玩性）
    // 角度范围: 30°~60°, 120°~150°, 210°~240°, 300°~330°
    const quadrant = Math.floor(Math.random() * 4);
    const baseAngle = quadrant * 90 + 30;
    const angle = (baseAngle + Math.random() * 30) * (Math.PI / 180);

    data.ballVX = Math.cos(angle) * ballSpeed;
    data.ballVY = Math.sin(angle) * ballSpeed;
  }
}

module.exports = BreakoutGame;
