/**
 * GameManager - 游戏管理器
 * Game 的上一层功能，负责游戏的初始化、切换、释放等。
 * 提供非 Game 形式的 Loading 界面供切换 Game 时使用。
 */
class GameManager {
  constructor() {
    /** @private @type {HTMLCanvasElement|null} */
    this._canvas = null;
    /** @private @type {CanvasRenderingContext2D|null} */
    this._ctx = null;
    /** @private @type {HTMLCanvasElement|null} 游戏层离屏 Canvas */
    this._gameCanvas = null;
    /** @private @type {CanvasRenderingContext2D|null} 游戏层 context */
    this._gameCtx = null;
    /** @private @type {HTMLCanvasElement|null} UI 层离屏 Canvas */
    this._uiCanvas = null;
    /** @private @type {CanvasRenderingContext2D|null} UI 层 context */
    this._uiCtx = null;
    /** @private @type {import('./Game')|null} */
    this._currentGame = null;
    /** @private @type {number} */
    this._lastTime = 0;
    /** @private @type {number} requestAnimationFrame 的 ID */
    this._rafId = 0;
    /** @private @type {boolean} */
    this._isLoading = false;
    /** @private @type {boolean} */
    this._initialized = false;
  }

  /** @returns {import('./Game')|null} */
  get currentGame() {
    return this._currentGame;
  }

  /** @returns {HTMLCanvasElement|null} */
  get canvas() {
    return this._canvas;
  }

  /**
   * 初始化 GameManager
   * @param {HTMLCanvasElement} canvas - 微信小游戏的 canvas
   */
  Init(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._lastTime = Date.now();
    this._initialized = true;

    // 创建游戏层离屏 Canvas
    this._gameCanvas = wx.createCanvas();
    this._gameCanvas.width = canvas.width;
    this._gameCanvas.height = canvas.height;
    this._gameCtx = this._gameCanvas.getContext('2d');

    // 创建 UI 层离屏 Canvas
    this._uiCanvas = wx.createCanvas();
    this._uiCanvas.width = canvas.width;
    this._uiCanvas.height = canvas.height;
    this._uiCtx = this._uiCanvas.getContext('2d');

    // 启动主循环
    this._startLoop();
  }

  /**
   * 切换到新 Game
   * @param {typeof import('./Game')} GameClass - Game 的子类
   */
  SwitchGame(GameClass) {
    // 显示 Loading
    this._showLoading();

    // 释放旧 Game
    if (this._currentGame) {
      this._currentGame.Dispose();
      this._currentGame = null;
    }

    // 创建并初始化新 Game，传入画布上下文
    const game = new GameClass();
    game.Init({
      gameCtx: this._gameCtx,
      uiCtx: this._uiCtx,
      width: this._canvas.width,
      height: this._canvas.height,
    });
    this._currentGame = game;

    // 隐藏 Loading
    this._hideLoading();
  }

  /**
   * 释放 GameManager
   */
  Dispose() {
    // 停止主循环
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }

    // 释放当前 Game
    if (this._currentGame) {
      this._currentGame.Dispose();
      this._currentGame = null;
    }

    this._canvas = null;
    this._ctx = null;
    this._gameCanvas = null;
    this._gameCtx = null;
    this._uiCanvas = null;
    this._uiCtx = null;
    this._initialized = false;
  }

  /**
   * 启动主循环
   * @private
   */
  _startLoop() {
    const loop = () => {
      const now = Date.now();
      const dt = (now - this._lastTime) / 1000; // 转换为秒
      this._lastTime = now;

      this._update(dt);

      this._rafId = requestAnimationFrame(loop);
    };

    this._rafId = requestAnimationFrame(loop);
  }

  /**
   * 每帧更新
   * @private
   * @param {number} dt - 距上一帧的时间间隔（秒）
   */
  _update(dt) {
    if (this._isLoading) {
      this._drawLoading();
      return;
    }

    if (!this._currentGame) return;

    const w = this._canvas.width;
    const h = this._canvas.height;

    // 1. 清屏两个离屏 Canvas
    this._gameCtx.clearRect(0, 0, w, h);
    this._uiCtx.clearRect(0, 0, w, h);

    // 2. Game 逻辑更新 + 渲染到离屏 Canvas
    this._currentGame.Update(dt);

    // 3. 合成到主 Canvas
    this._ctx.clearRect(0, 0, w, h);
    this._ctx.drawImage(this._gameCanvas, 0, 0);
    this._ctx.drawImage(this._uiCanvas, 0, 0);
  }

  /**
   * 显示 Loading 界面（非 Game 形式，直接用 canvas 2D 绘制）
   * @private
   */
  _showLoading() {
    this._isLoading = true;
    this._drawLoading();
  }

  /**
   * 隐藏 Loading 界面
   * @private
   */
  _hideLoading() {
    this._isLoading = false;
  }

  /**
   * 绘制 Loading 界面
   * @private
   */
  _drawLoading() {
    if (!this._ctx || !this._canvas) return;

    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    // 清屏 - 深色背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // 绘制 "Loading..." 文字
    ctx.fillStyle = '#e0e0e0';
    ctx.font = `${Math.floor(w * 0.06)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading...', w / 2, h / 2 - 30);

    // 绘制进度条背景
    const barWidth = w * 0.6;
    const barHeight = 8;
    const barX = (w - barWidth) / 2;
    const barY = h / 2 + 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 绘制进度条（简单动画效果）
    const progress = (Date.now() % 2000) / 2000;
    ctx.fillStyle = '#4ecca3';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  }
}

module.exports = GameManager;
