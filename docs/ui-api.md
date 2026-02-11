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

### 输入事件流程

触摸事件采用「UI 优先，游戏层兜底」的分层调度机制，支持拖动和点击两种交互：

```
wx.onTouchStart / onTouchMove / onTouchEnd
  │
  ▼
UIInputSystem（统一接收，UI 优先）
  │
  ├─ touchStart:
  │    ├─ 命中 UI 可拖动元素(UIDragComponent) → UI 拥有本次触摸会话
  │    └─ 未命中 → 广播 "input_touch_start"
  │
  ├─ touchMove:
  │    ├─ UI 拥有触摸 → 更新 UI 拖动
  │    └─ 否则 → 广播 "input_touch_move"
  │
  └─ touchEnd:
       ├─ UI 正在拖动 → 结束拖动
       ├─ 未拖动 → 检测 UI 点击(UIClickComponent)，命中则触发
       └─ 无消费 → 广播 "input_touch_end"
                       │
                       ▼
                 GameInputSystem（监听 input_touch_* 事件）
                       │
                       ├─ input_touch_start → 查找游戏层拖动目标(GameDragComponent)
                       ├─ input_touch_move  → 更新游戏层拖动
                       └─ input_touch_end   → 结束拖动 或 检测点击(GameClickComponent)
```

**关键点：**
- `UIInputSystem` 通过 `wx.onTouchStart/Move/End` 统一接收触摸事件
- 每次触摸会话（start→move→end）由一个层独占：UI 拥有则游戏层收不到事件
- 拖动优先于点击：touchStart 先检测拖动目标，touchEnd 才检测点击
- `GameInputSystem` 仅通过 EventDispatcher 监听事件，不直接监听 wx 触摸事件

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

### UIDragComponent

**文件**: `game/js/core/components/UIDragComponent.js`

继承自 Component，UI 层拖动组件。拖动时自动更新同 Entity 上 UITransformComponent 的 x/y 坐标。命中检测复用 UITransformComponent.ContainsPoint，由 UIInputSystem 调度。

| 静态属性 | 值 |
|----------|----|
| `ID` | `"UIDragComponent"` |

| 构造参数 (options) | 类型 | 默认值 | 说明 |
|--------------------|------|--------|------|
| `onDragStart` | `Function\|null` | `null` | 拖动开始回调 `(x, y)` |
| `onDrag` | `Function\|null` | `null` | 拖动中回调 `(x, y)` |
| `onDragEnd` | `Function\|null` | `null` | 拖动结束回调 `(x, y)` |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `SetEnabled(enabled)` | `enabled: boolean` | `void` | 设置是否启用 |
| `IsEnabled()` | 无 | `boolean` | 是否启用 |
| `TriggerDragStart(x, y)` | `x, y: number` | `void` | 触发拖动开始（记录起始状态，由 UIInputSystem 调用） |
| `TriggerDrag(x, y)` | `x, y: number` | `void` | 触发拖动中（自动更新 UITransformComponent.x/y） |
| `TriggerDragEnd(x, y)` | `x, y: number` | `void` | 触发拖动结束 |

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

继承自 System，UI 输入系统。监听微信小游戏 `wx.onTouchStart`、`wx.onTouchMove`、`wx.onTouchEnd` 事件，对 UI Entity 树做拖动和点击的命中检测。

- **拖动**：touchStart 时在 UI 树中查找 UIDragComponent 目标（深度优先收集后反向遍历，上层优先）。命中后 UI 拥有本次触摸会话，后续 touchMove/touchEnd 均由 UI 处理。
- **点击**：touchEnd 时若无活跃拖动，检测 UIClickComponent（同样反向遍历优先上层）。
- **事件传递**：每个阶段若 UI 未消费，则通过 EventDispatcher 广播给游戏层。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Dispose()` | 无 | `void` | 释放系统并取消 `wx.onTouchStart/Move/End` 监听 |

**广播事件：**

| 事件 ID | 参数 | 触发时机 |
|---------|------|----------|
| `input_touch_start` | `{ x: number, y: number }` | UI 层 touchStart 无拖动目标时广播 |
| `input_touch_move` | `{ x: number, y: number }` | UI 层无活跃拖动时广播 |
| `input_touch_end` | `{ x: number, y: number }` | UI 层既无拖动也无点击时广播 |

---

### GameClickComponent

**文件**: `game/js/core/components/GameClickComponent.js`

继承自 Component，游戏层点击回调组件。自带命中区域（bounds）定义，通过 `getPosition` 回调获取 Entity 的世界坐标来计算实际命中区域。命中检测由 GameInputSystem 负责。

实际命中区域 = `(position.x + offsetX, position.y + offsetY, width, height)`

| 静态属性 | 值 |
|----------|----|
| `ID` | `"GameClickComponent"` |

| 构造参数 (options) | 类型 | 默认值 | 说明 |
|--------------------|------|--------|------|
| `onClick` | `Function\|null` | `null` | 点击回调函数 |
| `offsetX` | `number` | `0` | 命中区域相对 Entity 位置的 X 偏移 |
| `offsetY` | `number` | `0` | 命中区域相对 Entity 位置的 Y 偏移 |
| `width` | `number` | `0` | 命中区域宽度 |
| `height` | `number` | `0` | 命中区域高度 |
| `getPosition` | `Function\|null` | `null` | 获取 Entity 世界坐标的回调 `() => {x, y}`，为 null 时默认返回 `(0,0)` |

| 属性（getter/setter） | 类型 | 说明 |
|------------------------|------|------|
| `offsetX` | `number` | 命中区域 X 偏移 |
| `offsetY` | `number` | 命中区域 Y 偏移 |
| `width` | `number` | 命中区域宽度 |
| `height` | `number` | 命中区域高度 |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `SetOnClick(callback)` | `callback: Function` | `void` | 设置点击回调 |
| `GetOnClick()` | 无 | `Function\|null` | 获取点击回调 |
| `SetGetPosition(callback)` | `callback: Function` | `void` | 设置获取位置的回调 `() => {x, y}` |
| `SetEnabled(enabled)` | `enabled: boolean` | `void` | 设置是否启用 |
| `IsEnabled()` | 无 | `boolean` | 是否可点击（启用且有回调） |
| `GetPosition()` | 无 | `{x, y}` | 获取 Entity 世界位置（通过 getPosition 回调） |
| `ContainsPoint(px, py)` | `px: number`, `py: number` | `boolean` | 判断点是否在命中区域内 |
| `TriggerClick()` | 无 | `void` | 触发点击回调 |

---

### GameDragComponent

**文件**: `game/js/core/components/GameDragComponent.js`

继承自 Component，游戏层拖动组件。自带命中区域（bounds）和位置读写回调。拖动时通过 `setPosition` 回调更新 Entity 位置。命中检测由 GameInputSystem 调度。

实际命中区域 = `(position.x + offsetX, position.y + offsetY, width, height)`

| 静态属性 | 值 |
|----------|----|
| `ID` | `"GameDragComponent"` |

| 构造参数 (options) | 类型 | 默认值 | 说明 |
|--------------------|------|--------|------|
| `onDragStart` | `Function\|null` | `null` | 拖动开始回调 `(x, y)` |
| `onDrag` | `Function\|null` | `null` | 拖动中回调 `(x, y)` |
| `onDragEnd` | `Function\|null` | `null` | 拖动结束回调 `(x, y)` |
| `getPosition` | `Function\|null` | `null` | 获取 Entity 世界坐标 `() => {x, y}`，为 null 时默认返回 `(0,0)` |
| `setPosition` | `Function\|null` | `null` | 设置 Entity 世界坐标 `(x, y) => void` |
| `offsetX` | `number` | `0` | 命中区域 X 偏移 |
| `offsetY` | `number` | `0` | 命中区域 Y 偏移 |
| `width` | `number` | `0` | 命中区域宽度 |
| `height` | `number` | `0` | 命中区域高度 |

| 属性（getter/setter） | 类型 | 说明 |
|------------------------|------|------|
| `offsetX` | `number` | 命中区域 X 偏移 |
| `offsetY` | `number` | 命中区域 Y 偏移 |
| `width` | `number` | 命中区域宽度 |
| `height` | `number` | 命中区域高度 |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `SetEnabled(enabled)` | `enabled: boolean` | `void` | 设置是否启用 |
| `IsEnabled()` | 无 | `boolean` | 是否启用 |
| `SetGetPosition(callback)` | `callback: Function` | `void` | 设置获取位置回调 |
| `SetSetPosition(callback)` | `callback: Function` | `void` | 设置设置位置回调 |
| `GetPosition()` | 无 | `{x, y}` | 获取 Entity 世界位置 |
| `ContainsPoint(px, py)` | `px, py: number` | `boolean` | 判断点是否在命中区域内 |
| `TriggerDragStart(x, y)` | `x, y: number` | `void` | 触发拖动开始（记录起始状态） |
| `TriggerDrag(x, y)` | `x, y: number` | `void` | 触发拖动中（通过 setPosition 更新位置） |
| `TriggerDragEnd(x, y)` | `x, y: number` | `void` | 触发拖动结束 |

---

### GameInputSystem

**文件**: `game/js/core/systems/GameInputSystem.js`

继承自 System，游戏层输入系统。通过 EventDispatcher 监听 UIInputSystem 广播的 `input_touch_start/move/end` 事件，对游戏层 Entity 做拖动和点击的命中检测。

- **拖动**：收到 `input_touch_start` 时查找 GameDragComponent 目标，命中后开始拖动。
- **点击**：收到 `input_touch_end` 时若无活跃拖动，检测 GameClickComponent。
- 采用收集后反向遍历（后添加 = 上层 = 优先响应），命中第一个即停止。

**注意**：应在 `UIInputSystem` 之后通过 `Game.AddSystem(GameInputSystem)` 添加。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Dispose()` | 无 | `void` | 释放系统并取消 EventDispatcher 事件监听 |

**监听事件：**

| 事件 ID | 来源 | 说明 |
|---------|------|------|
| `input_touch_start` | UIInputSystem | UI 无拖动目标时，接收 touchStart |
| `input_touch_move` | UIInputSystem | UI 无活跃拖动时，接收 touchMove |
| `input_touch_end` | UIInputSystem | UI 未消费时，接收 touchEnd |

---

## 使用示例

### UI 点击示例

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

    const uiRoot = this.CreateEntity();
    uiRoot.AddComponent(new UITransformComponent({
      x: 0, y: 0, width: screenData.width, height: screenData.height
    }));
    screenData.uiRootId = uiRoot.id;

    // 暂停按钮
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

    this.AddSystem(UIInputSystem);
    this.AddSystem(UIRenderSystem);
  }
}
```

### UI 拖动示例

```javascript
const UIDragComponent = require('./core/components/UIDragComponent');

// 可拖动的面板（在 UIRoot 下创建）
const panel = this.CreateEntity();
panel.AddComponent(new UITransformComponent({
  x: 50, y: 100, width: 120, height: 80
}));
panel.AddComponent(new UITextComponent({
  text: '拖动我', fontSize: 16, color: '#fff', textAlign: 'center'
}));
panel.AddComponent(new UIDragComponent({
  onDragStart: (x, y) => console.log('开始拖动'),
  onDragEnd: (x, y) => console.log('结束拖动'),
}));
uiRoot.AddChild(panel);
```

### 游戏层点击与拖动示例

```javascript
const GameClickComponent = require('./core/components/GameClickComponent');
const GameDragComponent = require('./core/components/GameDragComponent');
const GameInputSystem = require('./core/systems/GameInputSystem');

// ---- 游戏层：可拖动元素 ----
const box = this.CreateEntity();
const boxPos = { x: 100, y: 200 };
box.AddComponent(new GameDragComponent({
  getPosition: () => boxPos,
  setPosition: (x, y) => { boxPos.x = x; boxPos.y = y; },
  width: 64, height: 64,
  onDragEnd: () => console.log('拖动结束'),
}));

// ---- 游戏层：可点击元素 ----
const enemy = this.CreateEntity();
const enemyPos = { x: 200, y: 200 };
enemy.AddComponent(new GameClickComponent({
  onClick: () => console.log('点击了敌人!'),
  getPosition: () => enemyPos,
  width: 64, height: 64,
}));

// ---- 添加系统（顺序重要）----
this.AddSystem(UIInputSystem);     // 1. UI 输入（统一接收触摸）
this.AddSystem(GameInputSystem);   // 2. 游戏层输入（接收 UI 未消费的事件）
this.AddSystem(UIRenderSystem);    // 3. UI 渲染（最后）
```

### 系统添加顺序说明

1. `UIInputSystem` — 必须最先添加，统一接收 `wx.onTouchStart/Move/End` 并优先处理 UI 层
2. `GameInputSystem` — 在 UIInputSystem 之后，监听 UI 未消费的触摸事件
3. 其他逻辑 System — 按需添加
4. `UIRenderSystem` — 最后添加，确保所有逻辑更新完成后再渲染 UI

### 交互演示

完整的双层交互演示见 `game/js/games/demogame/DemoGame.js`，包含：
- 游戏层蓝色方块（可拖动）+ 绿色方块（可点击变色）
- UI 层红色面板（可拖动）+ 紫色按钮（点击计数）
- UI 元素覆盖在游戏元素上方时，UI 拦截触摸，游戏层不响应
