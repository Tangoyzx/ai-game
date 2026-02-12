# ECS 游戏框架 - 快速参考

## 核心类 API

### GameManager

```javascript
const GameManager = require('./framework/GameManager');
const gameManager = new GameManager();

// 初始化（传入主 Canvas）
gameManager.Init(canvas);

// 切换游戏（自动显示 Loading，初始化新游戏）
gameManager.SwitchGame(MyGame);

// 释放
gameManager.Dispose();
```

### Game

```javascript
const Game = require('./framework/Game');

class MyGame extends Game {
  OnInit() {
    // 获取数据
    const screenData = this.dataManager.GetData('ScreenData');
    
    // 注册自定义数据
    const myData = this.dataManager.RegisterData(MyData);
    
    // 创建 Entity
    const entity = this.CreateEntity();
    entity.AddComponent(new MyComponent());
    
    // 添加 System
    this.AddSystem(MySystem);
  }
  
  OnDispose() {
    // 自定义清理逻辑
  }
}

// API
game.CreateEntity()              // 创建 Entity
game.RemoveEntity(entityId)      // 移除 Entity
game.GetEntity(entityId)         // 获取 Entity
game.AddSystem(SystemClass)      // 添加 System
game.RemoveSystem(system)        // 移除 System
```

### Entity

```javascript
const Entity = require('./framework/Entity');

const entity = game.CreateEntity();

// 组件管理
entity.AddComponent(new MyComponent());         // 添加组件
entity.RemoveComponent('MyComponent');          // 移除组件
entity.GetComponent('MyComponent');             // 获取组件
entity.GetTransform();                          // 快捷获取 TransformComponent

// 父子层级
entity.SetParent(parentEntity);                 // 设置父级
entity.GetParent();                             // 获取父级
entity.AddChild(childEntity);                   // 添加子级
entity.RemoveChild(childEntity);                // 移除子级
entity.GetChildren();                           // 获取所有子级

// 释放
entity.Dispose();
```

### Component

```javascript
const Component = require('./framework/Component');

class MyComponent extends Component {
  static ID = 'MyComponent';  // 必须唯一
  
  OnInit() {
    // 初始化逻辑
    this._value = 0;
    
    // 访问 Entity
    console.log(this.entity.id);
    
    // 访问 DataManager
    const data = this.dataManager.GetData('MyData');
    
    // 监听事件
    this.On('my_event', this._onEvent, this);
  }
  
  _onEvent(eventId, dispatcher, params) {
    console.log('收到事件', params);
  }
  
  OnDispose() {
    // 清理逻辑
    this.Off('my_event', this._onEvent, this);
  }
}

// 事件方法
component.On(eventId, callback, context)      // 监听事件
component.Off(eventId, callback, context)     // 取消监听
component.Emit(eventId, params)               // 发送事件
```

### System

```javascript
const System = require('./framework/System');

class MySystem extends System {
  constructor(eventDispatcher, dataManager, entities) {
    super(eventDispatcher, dataManager, entities);
    
    // 监听事件
    this._eventDispatcher.On('my_event', this._onEvent, this);
  }
  
  Update(dt) {
    // 每帧逻辑
    for (const [id, entity] of this._entities) {
      const comp = entity.GetComponent('MyComponent');
      if (comp) {
        // 处理逻辑
      }
    }
    
    // 访问数据
    const data = this._dataManager.GetData('MyData');
  }
  
  _onEvent(eventId, dispatcher, params) {
    console.log('System 收到事件', params);
  }
  
  Dispose() {
    this._eventDispatcher.Off('my_event', this._onEvent, this);
  }
}
```

### DataManager

```javascript
// 注册数据（在 Game.OnInit 中）
const myData = this.dataManager.RegisterData(MyDataClass);

// 获取数据
const data = this.dataManager.GetData('MyData');

// 检查数据
if (this.dataManager.HasData('MyData')) {
  // ...
}

// 移除数据
this.dataManager.RemoveData('MyData');
```

### DataBase

```javascript
const DataBase = require('./framework/DataBase');

class MyData extends DataBase {
  static ID = 'MyData';  // 必须唯一
  
  constructor() {
    super();
    this.score = 0;
    this.level = 1;
  }
}
```

### EventDispatcher

```javascript
// 监听事件
eventDispatcher.On('event_name', callback, context);

// 发送事件
eventDispatcher.Emit('event_name', { key: 'value' });

// 取消监听
eventDispatcher.Off('event_name', callback, context);

// 清空所有监听
eventDispatcher.Clear();
```

---

## UI 组件 API

### UITransformComponent

```javascript
const UITransformComponent = require('./core/components/UITransformComponent');

const uiTransform = new UITransformComponent({
  x: 0,           // 相对父锚点的 X 偏移
  y: 0,           // 相对父锚点的 Y 偏移
  width: 100,     // 宽度
  height: 50,     // 高度
  anchorX: 0,     // 父级参考点 X（0~1）
  anchorY: 0,     // 父级参考点 Y（0~1）
  visible: true   // 是否可见
});

// Getter/Setter
uiTransform.x = 10;
uiTransform.y = 20;
uiTransform.width = 120;
uiTransform.height = 60;
uiTransform.anchorX = 0.5;
uiTransform.anchorY = 0.5;
uiTransform.visible = false;

// 方法
const pos = uiTransform.GetAbsolutePosition();  // { x, y }
const hit = uiTransform.ContainsPoint(100, 50); // boolean
```

**定位示例**：

```javascript
// 左上角
new UITransformComponent({ x: 20, y: 20, anchorX: 0, anchorY: 0 })

// 居中
new UITransformComponent({ x: 0, y: 0, anchorX: 0.5, anchorY: 0.5 })

// 右上角
new UITransformComponent({ x: -20, y: 20, anchorX: 1, anchorY: 0 })

// 右下角
new UITransformComponent({ x: -20, y: -20, anchorX: 1, anchorY: 1 })
```

### UITextComponent

```javascript
const UITextComponent = require('./core/components/UITextComponent');

const uiText = new UITextComponent({
  text: 'Hello',           // 文本内容
  fontSize: 16,            // 字号
  color: '#ffffff',        // 颜色
  fontFamily: 'Arial',     // 字体
  textAlign: 'left',       // 水平对齐: left | center | right
  textBaseline: 'top'      // 垂直对齐: top | middle | bottom
});

// Getter/Setter
uiText.text = 'Score: 100';
uiText.fontSize = 20;
uiText.color = '#ff0000';
```

### UIClickComponent

```javascript
const UIClickComponent = require('./core/components/UIClickComponent');

const uiClick = new UIClickComponent(() => {
  console.log('点击了!');
});

// API
uiClick.SetOnClick(callback);     // 设置回调
uiClick.GetOnClick();             // 获取回调
uiClick.SetEnabled(true);         // 启用/禁用
uiClick.IsEnabled();              // 是否可点击
uiClick.TriggerClick();           // 手动触发
```

### UIDragComponent

```javascript
const UIDragComponent = require('./core/components/UIDragComponent');

const uiDrag = new UIDragComponent({
  onDragStart: (x, y) => console.log('开始', x, y),
  onDrag: (x, y) => console.log('拖动中', x, y),
  onDragEnd: (x, y) => console.log('结束', x, y)
});

// API
uiDrag.SetEnabled(true);                    // 启用/禁用
uiDrag.IsEnabled();                         // 是否启用
uiDrag.TriggerDragStart(x, y);              // 系统调用
uiDrag.TriggerDrag(x, y);                   // 系统调用（自动更新 UITransform）
uiDrag.TriggerDragEnd(x, y);                // 系统调用
```

### GameClickComponent

```javascript
const GameClickComponent = require('./core/components/GameClickComponent');

const pos = { x: 100, y: 100 };

const gameClick = new GameClickComponent({
  onClick: () => console.log('点击游戏对象'),
  getPosition: () => pos,      // 必须：获取世界坐标
  width: 64,                   // 命中区域宽
  height: 64,                  // 命中区域高
  offsetX: 0,                  // 命中区域 X 偏移
  offsetY: 0                   // 命中区域 Y 偏移
});

// API
gameClick.SetOnClick(callback);
gameClick.SetGetPosition(callback);
gameClick.SetEnabled(true);
gameClick.IsEnabled();
gameClick.GetPosition();              // { x, y }
gameClick.ContainsPoint(px, py);      // boolean
gameClick.TriggerClick();
```

### GameDragComponent

```javascript
const GameDragComponent = require('./core/components/GameDragComponent');

const pos = { x: 100, y: 100 };

const gameDrag = new GameDragComponent({
  getPosition: () => pos,                      // 必须：获取位置
  setPosition: (x, y) => { pos.x = x; pos.y = y; },  // 必须：设置位置
  width: 64,
  height: 64,
  offsetX: 0,
  offsetY: 0,
  onDragStart: (x, y) => console.log('开始'),
  onDrag: (x, y) => console.log('拖动'),
  onDragEnd: (x, y) => console.log('结束')
});

// API
gameDrag.SetEnabled(true);
gameDrag.IsEnabled();
gameDrag.SetGetPosition(callback);
gameDrag.SetSetPosition(callback);
gameDrag.GetPosition();                // { x, y }
gameDrag.ContainsPoint(px, py);        // boolean
gameDrag.TriggerDragStart(x, y);
gameDrag.TriggerDrag(x, y);            // 自动调用 setPosition
gameDrag.TriggerDragEnd(x, y);
```

---

## 系统 API

### UIRenderSystem

```javascript
const UIRenderSystem = require('./core/systems/UIRenderSystem');

// 在 Game.OnInit 中添加（必须最后添加）
this.AddSystem(UIRenderSystem);
```

**自动处理**：
- 从 UIRoot 开始深度优先遍历
- 绘制 UITextComponent 到 UI Canvas
- 尊重 UITransformComponent.visible

### UIInputSystem

```javascript
const UIInputSystem = require('./core/systems/UIInputSystem');

// 在 Game.OnInit 中添加（必须最先添加）
this.AddSystem(UIInputSystem);
```

**自动处理**：
- 监听 `wx.onTouchStart/Move/End`
- UI 拖动优先（UIDragComponent）
- UI 点击次之（UIClickComponent）
- 未消费则广播 `input_touch_start/move/end`

**广播事件**：

```javascript
// UI 未消费时广播给游戏层
'input_touch_start' → { x, y }
'input_touch_move'  → { x, y }
'input_touch_end'   → { x, y }
```

### GameInputSystem

```javascript
const GameInputSystem = require('./core/systems/GameInputSystem');

// 在 Game.OnInit 中添加（在 UIInputSystem 之后）
this.AddSystem(GameInputSystem);
```

**自动处理**：
- 监听 UIInputSystem 广播的 `input_touch_*` 事件
- 游戏层拖动（GameDragComponent）
- 游戏层点击（GameClickComponent）

---

## 完整示例

### 基础游戏

```javascript
const Game = require('./framework/Game');

class MyGame extends Game {
  OnInit() {
    const screenData = this.dataManager.GetData('ScreenData');
    
    // 添加系统
    this.AddSystem(MyPhysicsSystem);
    this.AddSystem(MyRenderSystem);
  }
}

// 启动
gameManager.SwitchGame(MyGame);
```

### 带 UI 的游戏

```javascript
const Game = require('./framework/Game');
const UITransformComponent = require('./core/components/UITransformComponent');
const UITextComponent = require('./core/components/UITextComponent');
const UIClickComponent = require('./core/components/UIClickComponent');
const UIInputSystem = require('./core/systems/UIInputSystem');
const UIRenderSystem = require('./core/systems/UIRenderSystem');

class MyGame extends Game {
  OnInit() {
    const screenData = this.dataManager.GetData('ScreenData');
    
    // 创建 UIRoot
    const uiRoot = this.CreateEntity();
    uiRoot.AddComponent(new UITransformComponent({
      x: 0, y: 0, 
      width: screenData.width, 
      height: screenData.height
    }));
    screenData.uiRootId = uiRoot.id;
    
    // 创建按钮
    const button = this.CreateEntity();
    button.AddComponent(new UITransformComponent({
      x: 20, y: 20, width: 100, height: 40
    }));
    button.AddComponent(new UITextComponent({
      text: '开始游戏', fontSize: 20, color: '#fff', textAlign: 'center'
    }));
    button.AddComponent(new UIClickComponent(() => {
      console.log('游戏开始!');
    }));
    uiRoot.AddChild(button);
    
    // 添加系统（顺序重要）
    this.AddSystem(UIInputSystem);     // 1. UI 输入
    this.AddSystem(MyPhysicsSystem);   // 2. 游戏逻辑
    this.AddSystem(MyRenderSystem);    // 3. 游戏渲染
    this.AddSystem(UIRenderSystem);    // 4. UI 渲染（最后）
  }
}
```

### 数据驱动游戏

```javascript
// 1. 定义数据
class MyGameData extends DataBase {
  static ID = 'MyGameData';
  constructor() {
    super();
    this.grid = Array(10).fill(0).map(() => Array(10).fill(0));
    this.score = 0;
  }
}

// 2. 创建 System
class MyPhysicsSystem extends System {
  Update(dt) {
    const data = this._dataManager.GetData('MyGameData');
    // 直接操作 data.grid
    data.score += 10;
  }
}

class MyRenderSystem extends System {
  Update(dt) {
    const data = this._dataManager.GetData('MyGameData');
    const screenData = this._dataManager.GetData('ScreenData');
    const ctx = screenData.gameCtx;
    
    // 绘制网格
    for (let row = 0; row < data.grid.length; row++) {
      for (let col = 0; col < data.grid[row].length; col++) {
        const value = data.grid[row][col];
        // 绘制逻辑
      }
    }
  }
}

// 3. 创建 Game
class MyGame extends Game {
  OnInit() {
    // 注册数据
    const data = this.dataManager.RegisterData(MyGameData);
    
    // 添加系统
    this.AddSystem(MyPhysicsSystem);
    this.AddSystem(MyRenderSystem);
  }
}
```

### 事件驱动示例

```javascript
// Component 发送事件
class BulletComponent extends Component {
  static ID = 'BulletComponent';
  
  OnInit() {
    this._life = 3.0;
  }
  
  Update(dt) {
    this._life -= dt;
    if (this._life <= 0) {
      this.Emit('bullet_expired', { entityId: this.entity.id });
    }
  }
}

// System 监听事件
class BulletSystem extends System {
  constructor(eventDispatcher, dataManager, entities) {
    super(eventDispatcher, dataManager, entities);
    this._eventDispatcher.On('bullet_expired', this._onBulletExpired, this);
  }
  
  _onBulletExpired(eventId, dispatcher, params) {
    const entity = this._entities.get(params.entityId);
    if (entity) {
      this._entities.delete(params.entityId);
      entity.Dispose();
    }
  }
  
  Dispose() {
    this._eventDispatcher.Off('bullet_expired', this._onBulletExpired, this);
  }
}
```

---

## 常见问题

### Q: UI 不显示？

**检查清单**：
1. ✅ 是否创建了 UIRoot 并设置 `screenData.uiRootId`？
2. ✅ UI Entity 是否通过 `uiRoot.AddChild()` 添加到树中？
3. ✅ UIRenderSystem 是否添加且在最后？
4. ✅ UITransformComponent.visible 是否为 true？

### Q: 点击/拖动不响应？

**检查清单**：
1. ✅ UIInputSystem 是否在 GameInputSystem 之前添加？
2. ✅ UIClickComponent/UIDragComponent 是否启用（IsEnabled）？
3. ✅ UITransformComponent 是否设置了正确的 width/height？
4. ✅ 游戏层组件是否设置了 getPosition 回调？

### Q: 游戏层交互被 UI 遮挡？

这是正常行为，UI 层优先。如果需要点击穿透，需自定义 UIInputSystem。

### Q: 如何调试坐标？

```javascript
// 在 UIRenderSystem 或自定义渲染 System 中
Update(dt) {
  const screenData = this._dataManager.GetData('ScreenData');
  const ctx = screenData.uiCtx;
  
  for (const [id, entity] of this._entities) {
    const uiTransform = entity.GetComponent('UITransformComponent');
    if (uiTransform) {
      const pos = uiTransform.GetAbsolutePosition();
      // 绘制调试矩形
      ctx.strokeStyle = '#ff0000';
      ctx.strokeRect(pos.x, pos.y, uiTransform.width, uiTransform.height);
    }
  }
}
```

---

## 性能优化建议

1. **数据驱动优于 Entity**：对于大量简单对象（网格、粒子），用 Data + System 而非 Entity + Component
2. **减少遍历**：在 System.Update 中缓存需要的 Entity，避免每帧全量遍历
3. **事件清理**：确保 Dispose 中取消所有事件监听，防止内存泄漏
4. **Canvas 分层**：游戏内容和 UI 分别绘制，仅在变化时重绘

---

详细架构和设计模式见主文档 `docs/framework-api.md` 和 `docs/ui-api.md`。
