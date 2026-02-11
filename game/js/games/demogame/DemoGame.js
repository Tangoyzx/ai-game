const Game = require('../../framework/Game');
const ScreenData = require('../../core/data/ScreenData');

// UI 组件 & 系统
const UITransformComponent = require('../../core/components/UITransformComponent');
const UITextComponent = require('../../core/components/UITextComponent');
const UIClickComponent = require('../../core/components/UIClickComponent');
const UIDragComponent = require('../../core/components/UIDragComponent');
const UIRenderSystem = require('../../core/systems/UIRenderSystem');
const UIInputSystem = require('../../core/systems/UIInputSystem');

// 游戏层组件 & 系统
const GameClickComponent = require('../../core/components/GameClickComponent');
const GameDragComponent = require('../../core/components/GameDragComponent');
const GameInputSystem = require('../../core/systems/GameInputSystem');

// Demo 专用系统
const DemoRenderSystem = require('./DemoRenderSystem');

/**
 * DemoGame - 交互演示游戏
 *
 * 游戏层（Game Canvas）：
 *   - 蓝色方块：可拖动（GameDragComponent）
 *   - 绿色方块：可点击（GameClickComponent），点击后变色
 *
 * UI 层（UI Canvas）：
 *   - 红色面板：可拖动（UIDragComponent）
 *   - 计数按钮：可点击（UIClickComponent），点击后计数 +1
 *   - 提示文本：说明操作方式
 *
 * 验证要点：
 *   1. UI 层拖动/点击正常工作
 *   2. 游戏层拖动/点击正常工作
 *   3. UI 元素覆盖在游戏元素上方时，UI 拦截触摸，游戏层不响应
 */
class DemoGame extends Game {
  OnInit() {
    const screenData = this.dataManager.GetData(ScreenData.ID);
    const sw = screenData.width;
    const sh = screenData.height;

    // ============================================
    // 游戏层元素
    // ============================================

    // --- 蓝色方块（可拖动）---
    const blueBox = this.CreateEntity();
    const bluePos = { x: 60, y: 200 };
    const BLUE_SIZE = 80;

    blueBox.AddComponent(new GameDragComponent({
      getPosition: () => bluePos,
      setPosition: (x, y) => { bluePos.x = x; bluePos.y = y; },
      offsetX: 0,
      offsetY: 0,
      width: BLUE_SIZE,
      height: BLUE_SIZE,
      onDragStart: () => console.log('[Game] 蓝色方块 拖动开始'),
      onDragEnd: () => console.log('[Game] 蓝色方块 拖动结束'),
    }));

    // 给渲染系统提供绘制数据
    blueBox._demoRender = {
      getPos: () => bluePos,
      size: BLUE_SIZE,
      color: '#4a90d9',
      label: '拖动我',
    };

    // --- 绿色方块（可点击）---
    const greenBox = this.CreateEntity();
    const greenPos = { x: 200, y: 200 };
    const GREEN_SIZE = 80;
    let greenClickCount = 0;
    let greenColor = '#27ae60';

    greenBox.AddComponent(new GameClickComponent({
      onClick: () => {
        greenClickCount++;
        // 点击时交替变色
        greenColor = greenClickCount % 2 === 0 ? '#27ae60' : '#f39c12';
        console.log('[Game] 绿色方块 被点击, 次数:', greenClickCount);
      },
      getPosition: () => greenPos,
      offsetX: 0,
      offsetY: 0,
      width: GREEN_SIZE,
      height: GREEN_SIZE,
    }));

    greenBox._demoRender = {
      getPos: () => greenPos,
      size: GREEN_SIZE,
      getColor: () => greenColor,
      getLabel: () => '点击(' + greenClickCount + ')',
    };

    // ============================================
    // UI 层元素
    // ============================================

    // --- UI 根节点 ---
    const uiRoot = this.CreateEntity();
    uiRoot.AddComponent(new UITransformComponent({
      x: 0, y: 0, width: sw, height: sh,
    }));
    screenData.uiRootId = uiRoot.id;

    // --- 标题提示文本 ---
    const title = this.CreateEntity();
    title.AddComponent(new UITransformComponent({
      x: sw / 2, y: 20, width: sw, height: 30,
    }));
    title.AddComponent(new UITextComponent({
      text: '交互演示 - UI层(上) / 游戏层(下)',
      fontSize: 18,
      color: '#ffffff',
      textAlign: 'center',
    }));
    uiRoot.AddChild(title);

    // --- 操作说明 ---
    const hint = this.CreateEntity();
    hint.AddComponent(new UITransformComponent({
      x: sw / 2, y: 46, width: sw, height: 20,
    }));
    hint.AddComponent(new UITextComponent({
      text: '蓝=游戏层拖动 绿=游戏层点击 红=UI层拖动 按钮=UI层点击',
      fontSize: 12,
      color: '#aaaaaa',
      textAlign: 'center',
    }));
    uiRoot.AddChild(hint);

    // --- 红色面板（UI 可拖动）---
    const redPanel = this.CreateEntity();
    const RED_W = 120;
    const RED_H = 80;
    redPanel.AddComponent(new UITransformComponent({
      x: sw - RED_W - 20, y: 100, width: RED_W, height: RED_H,
    }));
    redPanel.AddComponent(new UITextComponent({
      text: 'UI 拖动',
      fontSize: 16,
      color: '#ffffff',
      textAlign: 'center',
      textBaseline: 'middle',
    }));
    redPanel.AddComponent(new UIDragComponent({
      onDragStart: () => console.log('[UI] 红色面板 拖动开始'),
      onDragEnd: () => console.log('[UI] 红色面板 拖动结束'),
    }));
    uiRoot.AddChild(redPanel);

    // 用于渲染红色面板背景（给 UIRenderSystem 的扩展信息）
    redPanel._demoBg = { color: '#c0392b' };

    // --- 点击计数按钮 ---
    let uiClickCount = 0;
    const countBtn = this.CreateEntity();
    const BTN_W = 140;
    const BTN_H = 40;
    countBtn.AddComponent(new UITransformComponent({
      x: 20, y: sh - BTN_H - 20, width: BTN_W, height: BTN_H,
    }));
    const countText = new UITextComponent({
      text: '点击计数: 0',
      fontSize: 16,
      color: '#ffffff',
      textAlign: 'center',
      textBaseline: 'middle',
    });
    countBtn.AddComponent(countText);
    countBtn.AddComponent(new UIClickComponent(() => {
      uiClickCount++;
      countText.text = '点击计数: ' + uiClickCount;
      console.log('[UI] 按钮 被点击, 次数:', uiClickCount);
    }));
    uiRoot.AddChild(countBtn);

    countBtn._demoBg = { color: '#8e44ad' };

    // ============================================
    // 添加系统（顺序重要）
    // ============================================

    // 1. UI 输入 → 统一接收触摸，UI 优先处理
    this.AddSystem(UIInputSystem);
    // 2. 游戏层输入 → 处理 UI 未消费的触摸事件
    this.AddSystem(GameInputSystem);
    // 3. 游戏层渲染
    this.AddSystem(DemoRenderSystem);
    // 4. UI 渲染（最后，确保 UI 画在最上层）
    this.AddSystem(UIRenderSystem);

    console.log('[DemoGame] 初始化完成');
    console.log('  画布尺寸:', sw, 'x', sh);
    console.log('  游戏层: 蓝色方块(拖动) + 绿色方块(点击)');
    console.log('  UI 层: 红色面板(拖动) + 紫色按钮(点击)');
  }
}

module.exports = DemoGame;
