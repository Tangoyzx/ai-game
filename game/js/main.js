/**
 * 游戏启动入口
 */
const GameManager = require('./framework/GameManager');
const BreakoutGame = require('./games/breakout/BreakoutGame');

// 获取微信小游戏 canvas
const canvas = wx.createCanvas();

// 创建 GameManager 并初始化
const gameManager = new GameManager();
gameManager.Init(canvas);

// 启动打砖块游戏
gameManager.SwitchGame(BreakoutGame);

console.log('[Main] 游戏框架启动完成');
