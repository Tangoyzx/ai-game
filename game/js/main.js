/**
 * 游戏启动入口
 */
const GameManager = require('./framework/GameManager');
const Game = require('./framework/Game');

// 获取微信小游戏 canvas
const canvas = wx.createCanvas();

// 创建 GameManager 并初始化
const gameManager = new GameManager();
gameManager.Init(canvas);

// 启动默认 Game
gameManager.SwitchGame(Game);

console.log('[Main] 游戏框架启动完成');
