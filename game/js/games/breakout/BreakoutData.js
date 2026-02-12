const DataBase = require('../../framework/DataBase');

/**
 * BreakoutData - 打砖块游戏数据
 *
 * 存储网格砖块状态、小球位置/速度等所有游戏状态。
 *
 * bricks 二维数组值含义:
 *   0  = 空（无砖块）
 *  -1  = 不可破坏砖块
 *  1~20 = 可破坏砖块剩余耐久度
 */
class BreakoutData extends DataBase {
  static ID = 'BreakoutData';

  constructor() {
    super();

    // ---- 网格常量 ----
    /** @type {number} 单格像素大小 */
    this.cellSize = 32;
    /** @type {number} 网格列数 */
    this.cols = 10;
    /** @type {number} 网格行数 */
    this.rows = 15;
    /** @type {number} 可破坏砖块初始耐久度 */
    this.brickMaxHP = 20;

    // ---- 网格位置（屏幕居中后的左上角坐标）----
    /** @type {number} */
    this.gridOffsetX = 0;
    /** @type {number} */
    this.gridOffsetY = 0;

    // ---- 砖块网格 ----
    /** @type {number[][]} bricks[row][col] */
    this.bricks = [];

    // ---- 小球 ----
    /** @type {number} 小球中心 X（屏幕绝对坐标）*/
    this.ballX = 0;
    /** @type {number} 小球中心 Y（屏幕绝对坐标）*/
    this.ballY = 0;
    /** @type {number} 小球 X 方向速度（像素/秒）*/
    this.ballVX = 0;
    /** @type {number} 小球 Y 方向速度（像素/秒）*/
    this.ballVY = 0;
    /** @type {number} 小球半径 */
    this.ballRadius = 5;
    /** @type {number} 小球速度标量（像素/秒）*/
    this.ballSpeed = 200;
  }
}

module.exports = BreakoutData;
