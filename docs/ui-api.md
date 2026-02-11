# UI 模块 - API 与架构文档

## 概述

UI 模块基于框架的 ECS 架构实现，通过离屏 Canvas 将 UI 与游戏内容分层渲染。UI 元素以 Entity 树形式组织，复用 TransformComponent 管理父子关系，UITransformComponent 管理定位布局。

> 框架核心 API 见 [framework-api.md](framework-api.md)

## 双层渲染架构

GameManager 持有三个 Canvas：

| Canvas | 类型 | 用途 |
|--------|------|------|
| Main Canvas | 主画布 | 最终合成输出 |
| Game Canvas | 离屏 | 游戏内容渲染 |
| UI Canvas | 离屏 | UI 渲染（叠在游戏层之上） |

### 帧循环流程

每帧 GameManager 的 `_update(dt)` 执行以下步骤：
1. 清屏 Game Canvas 和 UI Canvas
2. 调用 `Game.Update(dt)`（逻辑 System 更新 -> UIRenderSystem 绘制到 UI Canvas）
3. 将 Game Canvas 和 UI Canvas 按顺序合成到主 Canvas（游戏在下，UI 在上）

## UI Entity 树结构

UI 元素以 Entity 树形式组织，复用 TransformComponent 管理父子关系，UITransformComponent 管理定位：

```
UIRoot (Entity)                                ← uiRootId 存入 ScreenData
├── UITransformComponent (0, 0, 屏幕宽, 屏幕高)
│
├── ScoreLabel (Entity)
│     ├── UITransformComponent (x:20, y:20, w:200, h:40)
│     └── UITextComponent (text:"Score: 0")
│
└── PauseBtn (Entity)
      ├── UITransformComponent (x:-80, y:20, w:60, h:40, anchorX:1)
      ├── UITextComponent (text:"暂停")
      └── UIClickComponent (onClick: handlePause)
```

---

## 类 API 文档

### UITransformComponent

**文件**: `game/js/core/components/UITransformComponent.js`

继承自 Component，UI 专用定位组件。与 TransformComponent 共存：TransformComponent 管理父子层级，UITransformComponent 管理 UI 布局定位。

坐标计算规则：`absoluteX = parent.absoluteX + anchorX * parent.width + x`

| 静态属性 | 值 |
|----------|----|
| `ID` | `"UITransformComponent"` |

| 构造参数 (options) | 类型 | 默认值 | 说明 |
|--------------------|------|--------|------|
| `x` | `number` | `0` | 相对父锚点的 X 偏移（像素） |
| `y` | `number` | `0` | 相对父锚点的 Y 偏移（像素） |
| `width` | `number` | `0` | 宽度（像素） |
| `height` | `number` | `0` | 高度（像素） |
| `anchorX` | `number` | `0` | 父级参考点 X（0\~1） |
| `anchorY` | `number` | `0` | 父级参考点 Y（0\~1） |
| `visible` | `boolean` | `true` | 是否可见（不可见时跳过自身及子树渲染） |

| 属性（getter/setter） | 类型 | 说明 |
|------------------------|------|------|
| `x` | `number` | X 偏移 |
| `y` | `number` | Y 偏移 |
| `width` | `number` | 宽度 |
| `height` | `number` | 高度 |
| `anchorX` | `number` | 父级参考点 X |
| `anchorY` | `number` | 父级参考点 Y |
| `visible` | `boolean` | 可见性 |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `GetAbsolutePosition()` | 无 | `{ x: number, y: number }` | 递归计算绝对坐标 |
| `ContainsPoint(px, py)` | `px: number`, `py: number` | `boolean` | 判断点是否在区域内（命中检测） |

---

### UITextComponent

**文件**: `game/js/core/components/UITextComponent.js`

继承自 Component，持有文本渲染数据。不负责实际绘制（由 UIRenderSystem 执行）。

| 静态属性 | 值 |
|----------|----|
| `ID` | `"UITextComponent"` |

| 构造参数 (options) | 类型 | 默认值 | 说明 |
|--------------------|------|--------|------|
| `text` | `string` | `''` | 文本内容 |
| `fontSize` | `number` | `16` | 字号（像素） |
| `color` | `string` | `'#ffffff'` | 文字颜色 |
| `fontFamily` | `string` | `'Arial'` | 字体 |
| `textAlign` | `string` | `'left'` | 水平对齐：`left` \| `center` \| `right` |
| `textBaseline` | `string` | `'top'` | 垂直对齐：`top` \| `middle` \| `bottom` |

| 属性（getter/setter） | 类型 | 说明 |
|------------------------|------|------|
| `text` | `string` | 文本内容 |
| `fontSize` | `number` | 字号 |
| `color` | `string` | 文字颜色 |
| `fontFamily` | `string` | 字体 |
| `textAlign` | `string` | 水平对齐 |
| `textBaseline` | `string` | 垂直对齐 |

---

### UIClickComponent

**文件**: `game/js/core/components/UIClickComponent.js`

继承自 Component，简单点击回调组件。不处理事件冒泡/穿透，命中检测由 UIInputSystem 负责。

| 静态属性 | 值 |
|----------|----|
| `ID` | `"UIClickComponent"` |

| 构造参数 | 类型 | 说明 |
|----------|------|------|
| `onClick` | `Function\|null` | 点击回调函数（可选） |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `SetOnClick(callback)` | `callback: Function` | `void` | 设置点击回调 |
| `GetOnClick()` | 无 | `Function\|null` | 获取点击回调 |
| `SetEnabled(enabled)` | `enabled: boolean` | `void` | 设置是否启用 |
| `IsEnabled()` | 无 | `boolean` | 是否可点击（启用且有回调） |
| `TriggerClick()` | 无 | `void` | 触发点击回调 |

---

### UIRenderSystem

**文件**: `game/js/core/systems/UIRenderSystem.js`

继承自 System，UI 渲染系统。每帧从 UIRoot 开始深度优先遍历 UI Entity 树，按父先子后的顺序绘制到 UI 离屏 Canvas。应在所有逻辑 System 之后通过 `Game.AddSystem(UIRenderSystem)` 添加。

当前支持的渲染组件：
- **UITextComponent**：绘制文本

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Update(dt)` | `dt: number` | `void` | 遍历 UI 树并绘制到 uiCtx |

---

### UIInputSystem

**文件**: `game/js/core/systems/UIInputSystem.js`

继承自 System，UI 输入系统。监听微信小游戏 `wx.onTouchEnd` 事件，对 UI Entity 树做命中检测。采用深度优先收集后反向遍历（后绘制 = 在上层 = 优先响应），找到第一个命中的 UIClickComponent 即触发回调并停止。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Dispose()` | 无 | `void` | 释放系统并取消 `wx.onTouchEnd` 监听 |

---

## 使用示例

```javascript
const Game = require('./framework/Game');
const UITransformComponent = require('./core/components/UITransformComponent');
const UITextComponent = require('./core/components/UITextComponent');
const UIClickComponent = require('./core/components/UIClickComponent');
const UIRenderSystem = require('./core/systems/UIRenderSystem');
const UIInputSystem = require('./core/systems/UIInputSystem');
const ScreenData = require('./core/data/ScreenData');

class MyGame extends Game {
  OnInit() {
    const screenData = this.dataManager.GetData(ScreenData.ID);

    // 创建 UI 根节点（覆盖全屏）
    const uiRoot = this.CreateEntity();
    uiRoot.AddComponent(new UITransformComponent({
      x: 0, y: 0, width: screenData.width, height: screenData.height
    }));
    screenData.uiRootId = uiRoot.id;

    // 创建分数标签（左上角）
    const scoreLabel = this.CreateEntity();
    scoreLabel.AddComponent(new UITransformComponent({
      x: 20, y: 20, width: 200, height: 40
    }));
    scoreLabel.AddComponent(new UITextComponent({
      text: 'Score: 0', fontSize: 24, color: '#ffffff'
    }));
    uiRoot.AddChild(scoreLabel);

    // 创建暂停按钮（右上角）
    const pauseBtn = this.CreateEntity();
    pauseBtn.AddComponent(new UITransformComponent({
      x: -80, y: 20, width: 60, height: 40, anchorX: 1
    }));
    pauseBtn.AddComponent(new UITextComponent({
      text: '暂停', fontSize: 20, color: '#ffffff', textAlign: 'center'
    }));
    pauseBtn.AddComponent(new UIClickComponent(() => {
      console.log('暂停!');
    }));
    uiRoot.AddChild(pauseBtn);

    // 添加 UI 系统（应在所有逻辑系统之后添加）
    this.AddSystem(UIInputSystem);
    this.AddSystem(UIRenderSystem);
  }
}
```
