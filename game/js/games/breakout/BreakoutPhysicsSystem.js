const System = require('../../framework/System');
const BreakoutData = require('./BreakoutData');

/**
 * BreakoutPhysicsSystem - 打砖块物理系统
 *
 * 每帧更新小球位置并处理与砖块的碰撞。
 * 采用「分轴碰撞检测」策略：先移动 X 轴并处理碰撞，再移动 Y 轴并处理碰撞，
 * 从根本上避免同时命中两砖块缝隙导致的方向异常和嵌入问题。
 */
class BreakoutPhysicsSystem extends System {
  Update(dt) {
    const data = this._dataManager.GetData(BreakoutData.ID);
    if (!data) return;

    // 限制 dt 防止帧间隔过大导致穿越
    const clampedDt = Math.min(dt, 0.05);

    // 分轴移动 + 碰撞
    this._moveAxis(data, clampedDt, 'x');
    this._moveAxis(data, clampedDt, 'y');
  }

  /**
   * 沿单一轴移动小球并处理碰撞
   *
   * 核心逻辑：移动后迭代检测碰撞，每次只处理球运动方向上的第一个砖块。
   * 碰撞后速度反转，球被推出，然后重新检测——此时球已经朝反方向运动，
   * 之前同侧的相邻砖块自然不会再被命中（速度方向过滤会跳过它们）。
   *
   * @private
   * @param {BreakoutData} data
   * @param {number} dt
   * @param {'x'|'y'} axis
   */
  _moveAxis(data, dt, axis) {
    // 移动小球（仅当前轴）
    if (axis === 'x') {
      data.ballX += data.ballVX * dt;
    } else {
      data.ballY += data.ballVY * dt;
    }

    // 迭代处理碰撞：每次处理一个砖块，处理后速度反转再重新检测
    const MAX_ITER = 3; // 安全上限，正常情况下 1 次即可
    for (let iter = 0; iter < MAX_ITER; iter++) {
      const hit = this._findFirstHit(data, axis);
      if (!hit) break;

      // 推出球并反转速度
      if (axis === 'x') {
        data.ballX += hit.sign * hit.penetration;
        data.ballVX = -data.ballVX;
      } else {
        data.ballY += hit.sign * hit.penetration;
        data.ballVY = -data.ballVY;
      }

      // 砖块扣血
      const hp = data.bricks[hit.row][hit.col];
      if (hp > 0) {
        data.bricks[hit.row][hit.col] = hp - 1;
      }
    }
  }

  /**
   * 在当前轴上找到球运动方向上第一个碰到的砖块
   *
   * 速度方向过滤：只考虑球正在朝向的砖块。
   * 例如球向右运动，只处理球右侧碰到的砖块（推出方向为左），
   * 球左侧虽然可能 AABB 重叠，但球正在远离它们，不算碰撞。
   *
   * @private
   * @param {BreakoutData} data
   * @param {'x'|'y'} axis
   * @returns {{ row: number, col: number, penetration: number, sign: number }|null}
   */
  _findFirstHit(data, axis) {
    const { cellSize, cols, rows, gridOffsetX, gridOffsetY, ballRadius } = data;

    const bLeft = data.ballX - ballRadius;
    const bRight = data.ballX + ballRadius;
    const bTop = data.ballY - ballRadius;
    const bBottom = data.ballY + ballRadius;

    const colMin = Math.floor((bLeft - gridOffsetX) / cellSize);
    const colMax = Math.floor((bRight - gridOffsetX) / cellSize);
    const rowMin = Math.floor((bTop - gridOffsetY) / cellSize);
    const rowMax = Math.floor((bBottom - gridOffsetY) / cellSize);

    // 当前轴上的速度
    const vel = axis === 'x' ? data.ballVX : data.ballVY;

    let best = null;
    let bestPen = Infinity;

    for (let r = rowMin; r <= rowMax; r++) {
      for (let c = colMin; c <= colMax; c++) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        if (data.bricks[r][c] === 0) continue;

        const brickLeft = gridOffsetX + c * cellSize;
        const brickRight = brickLeft + cellSize;
        const brickTop = gridOffsetY + r * cellSize;
        const brickBottom = brickTop + cellSize;

        // AABB 重叠检测
        if (bRight <= brickLeft || bLeft >= brickRight ||
            bBottom <= brickTop || bTop >= brickBottom) {
          continue;
        }

        // 计算当前轴上的穿透深度和推出方向
        let penetration, sign;
        if (axis === 'x') {
          const penLeft = bRight - brickLeft;   // 球右边越过砖块左边的深度
          const penRight = brickRight - bLeft;  // 砖块右边越过球左边的深度
          if (penLeft < penRight) {
            penetration = penLeft;
            sign = -1; // 向左推出
          } else {
            penetration = penRight;
            sign = 1;  // 向右推出
          }
        } else {
          const penTop = bBottom - brickTop;
          const penBottom = brickBottom - bTop;
          if (penTop < penBottom) {
            penetration = penTop;
            sign = -1; // 向上推出
          } else {
            penetration = penBottom;
            sign = 1;  // 向下推出
          }
        }

        // 速度方向过滤：sign 是推出方向，vel 是运动方向
        // sign * vel < 0 表示球正朝这个砖块运动（推出方向与速度相反）
        // sign * vel >= 0 表示球正在远离这个砖块，跳过
        if (sign * vel >= 0) continue;

        // 穿透最小的砖块 = 球最先接触到的砖块
        if (penetration > 0 && penetration < bestPen) {
          bestPen = penetration;
          best = { row: r, col: c, penetration, sign };
        }
      }
    }

    return best;
  }
}

module.exports = BreakoutPhysicsSystem;
