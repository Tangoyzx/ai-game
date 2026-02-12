---
name: ecs-game-framework
description: 微信小游戏 ECS 框架开发指南。Entity-Component-System 架构，双层 Canvas 渲染（Game/UI 分层），事件驱动系统。用于创建或修改基于此框架的游戏，处理 Entity、Component、System、DataManager、UI 交互、渲染等任务。
---

# ECS 游戏框架开发指南

## 核心原则

### 📚 文档优先策略

**必须遵守**：任何开发前，先阅读项目文档：

1. `docs/framework-api.md` - 框架核心 API
2. `docs/ui-api.md` - UI 与交互模块
3. `docs/breakout-api.md` - 打砖块游戏示例

**非必要不阅读代码**，文档已包含完整架构和 API 说明。

### 🔄 文档同步要求

**任何代码修改后必须更新 `docs/` 对应文档**，包括：
- 新增/修改/删除类和方法
- 架构调整
- API 变更

---

## 架构速览

### ECS 模式

```
GameManager（管理主 Canvas + Game/UI 双层离屏 Canvas）
  │
  └─ Game（单个游戏主体）
       ├─ EventDispatcher（事件派发器）
       ├─ DataManager（数据管理器）
       │    └─ ScreenData、自定义 Data
       ├─ Entity（实体容器，组件载体）
       │    ├─ TransformComponent（父子层级，默认持有）
       │    └─ 其他 Component（功能组件）
       └─ System（逻辑系统，每帧 Update）
```

### 双层渲染

| Canvas | 类型 | 用途 |
|--------|------|------|
| Main Canvas | 主画布 | 最终合成输出 |
| Game Canvas | 离屏 | 游戏内容渲染 |
| UI Canvas | 离屏 | UI 渲染（叠在游戏层之上） |

---

## 开发工作流

### 创建新游戏

1. **继承 Game 类**
   ```javascript
   const Game = require('./framework/Game');
   
   class MyGame extends Game {
     OnInit() {
       // 1. 注册数据
       const myData = this.dataManager.RegisterData(MyGameData);
       
       // 2. 创建 Entity 并添加 Component
       const player = this.CreateEntity();
       player.AddComponent(new MyComponent());
       
       // 3. 添加 System（顺序重要）
       this.AddSystem(MyPhysicsSystem);
       this.AddSystem(MyRenderSystem);
     }
   }
   ```

2. **在 GameManager 中切换**
   ```javascript
   gameManager.SwitchGame(MyGame);
   ```

### 创建自定义 Component

```javascript
const Component = require('./framework/Component');

class HealthComponent extends Component {
  static ID = 'HealthComponent';  // 必须唯一
  
  OnInit() {
    this._hp = 100;
  }
  
  TakeDamage(amount) {
    this._hp = Math.max(0, this._hp - amount);
    if (this._hp <= 0) {
      this.Emit('entity_dead', { entityId: this.entity.id });
    }
  }
  
  OnDispose() {
    this._hp = 0;
  }
}
```

### 创建自定义 System

```javascript
const System = require('./framework/System');

class DamageSystem extends System {
  Update(dt) {
    // 遍历所有 Entity 处理逻辑
    for (const [id, entity] of this._entities) {
      const health = entity.GetComponent('HealthComponent');
      if (health) {
        // 处理逻辑
      }
    }
  }
}
```

### 创建自定义 Data

```javascript
const DataBase = require('./framework/DataBase');

class GameConfigData extends DataBase {
  static ID = 'GameConfigData';  // 必须唯一
  
  constructor() {
    super();
    this.difficulty = 'normal';
    this.maxEnemies = 10;
  }
}

// 在 Game 中注册
const config = this.dataManager.RegisterData(GameConfigData);
```

---

## UI 开发

### UI Entity 树结构

```
UIRoot (必须创建)
├── UITransformComponent（屏幕大小）
├── ScoreLabel
│     ├── UITransformComponent（定位）
│     └── UITextComponent（文本）
└── Button
      ├── UITransformComponent
      ├── UITextComponent
      └── UIClickComponent（点击回调）
```

### 创建 UI

```javascript
OnInit() {
  const screenData = this.dataManager.GetData('ScreenData');
  
  // 1. 创建 UIRoot（必须）
  const uiRoot = this.CreateEntity();
  uiRoot.AddComponent(new UITransformComponent({
    x: 0, y: 0, 
    width: screenData.width, 
    height: screenData.height
  }));
  screenData.uiRootId = uiRoot.id;  // 必须设置
  
  // 2. 创建 UI 元素
  const button = this.CreateEntity();
  button.AddComponent(new UITransformComponent({
    x: 20, y: 20, width: 100, height: 40
  }));
  button.AddComponent(new UITextComponent({
    text: '按钮', fontSize: 20, color: '#fff'
  }));
  button.AddComponent(new UIClickComponent(() => {
    console.log('点击!');
  }));
  uiRoot.AddChild(button);  // 添加到 UIRoot
  
  // 3. 添加系统（顺序重要）
  this.AddSystem(UIInputSystem);
  this.AddSystem(UIRenderSystem);  // 最后添加
}
```

### UI 定位

**坐标计算**：`absoluteX = parent.absoluteX + anchorX * parent.width + x`

| anchorX | anchorY | 说明 |
|---------|---------|------|
| 0 | 0 | 左上角（默认） |
| 0.5 | 0.5 | 居中 |
| 1 | 0 | 右上角 |
| 1 | 1 | 右下角 |

**示例**：右上角按钮
```javascript
new UITransformComponent({
  x: -20,      // 向左偏移 20px
  y: 20,       // 向下偏移 20px
  width: 80, 
  height: 40,
  anchorX: 1,  // 从父级右边缘开始
  anchorY: 0   // 从父级上边缘开始
})
```

---

## 交互系统

### 输入事件流

```
wx.onTouchStart/Move/End
  ↓
UIInputSystem（统一接收，UI 优先）
  ├─ UI 拥有触摸 → 处理 UI 拖动/点击
  └─ UI 未消费 → 广播 "input_touch_*"
                    ↓
              GameInputSystem
                    ↓
              游戏层拖动/点击
```

### 关键规则

1. **UI 优先**：UI 层拦截的触摸事件不会传递到游戏层
2. **拖动优先于点击**：touchStart 检测拖动，touchEnd 检测点击
3. **系统添加顺序**：
   ```javascript
   this.AddSystem(UIInputSystem);      // 1. 必须最先
   this.AddSystem(GameInputSystem);    // 2. 游戏层输入
   this.AddSystem(OtherSystems);       // 3. 其他逻辑
   this.AddSystem(UIRenderSystem);     // 4. 必须最后
   ```

### UI 层交互

```javascript
// 点击
button.AddComponent(new UIClickComponent(() => {
  console.log('点击');
}));

// 拖动（自动更新 UITransformComponent.x/y）
panel.AddComponent(new UIDragComponent({
  onDragStart: (x, y) => console.log('开始'),
  onDrag: (x, y) => console.log('拖动中'),
  onDragEnd: (x, y) => console.log('结束')
}));
```

### 游戏层交互

```javascript
// 点击（需要 getPosition 回调）
const enemyPos = { x: 100, y: 100 };
enemy.AddComponent(new GameClickComponent({
  onClick: () => console.log('点击敌人'),
  getPosition: () => enemyPos,
  width: 64, height: 64
}));

// 拖动（需要 getPosition 和 setPosition 回调）
const boxPos = { x: 50, y: 50 };
box.AddComponent(new GameDragComponent({
  getPosition: () => boxPos,
  setPosition: (x, y) => { boxPos.x = x; boxPos.y = y; },
  width: 64, height: 64,
  onDragEnd: () => console.log('拖动结束')
}));
```

---

## 数据驱动设计

### 何时使用 Data vs Component

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 网格状态（砖块） | Data | 纯数据驱动，无需交互组件 |
| 物理数据（小球） | Data | 高性能批量处理 |
| 可交互对象 | Entity+Component | 需要点击/拖动等组件 |
| 全局配置 | Data | 跨 System 共享 |

**示例（打砖块游戏）**：
```javascript
// BreakoutData.js - 集中存储砖块和小球数据
class BreakoutData extends DataBase {
  static ID = 'BreakoutData';
  
  constructor() {
    super();
    this.bricks = [];       // 网格数据
    this.ballX = 0;
    this.ballY = 0;
    this.ballVX = 0;
    this.ballVY = 0;
  }
}

// BreakoutPhysicsSystem.js - System 直接读写 Data
class BreakoutPhysicsSystem extends System {
  Update(dt) {
    const data = this._dataManager.GetData('BreakoutData');
    data.ballX += data.ballVX * dt;
    data.ballY += data.ballVY * dt;
    // 碰撞检测...
  }
}
```

---

## 事件系统

### 使用场景

```javascript
// 1. Component 发送事件
class HealthComponent extends Component {
  TakeDamage(amount) {
    this._hp -= amount;
    if (this._hp <= 0) {
      this.Emit('entity_dead', { entityId: this.entity.id });
    }
  }
}

// 2. System 监听事件
class SpawnSystem extends System {
  constructor(eventDispatcher, dataManager, entities) {
    super(eventDispatcher, dataManager, entities);
    this._eventDispatcher.On('entity_dead', this._onEntityDead, this);
  }
  
  _onEntityDead(eventId, dispatcher, params) {
    console.log('Entity died:', params.entityId);
  }
  
  Dispose() {
    this._eventDispatcher.Off('entity_dead', this._onEntityDead, this);
  }
}
```

---

## 常见模式

### 模式 1：纯数据驱动（无 Entity）

适用于：网格游戏、粒子系统

```javascript
// Data 存储状态
class GridData extends DataBase {
  static ID = 'GridData';
  constructor() {
    super();
    this.grid = Array(10).fill(0).map(() => Array(10).fill(0));
  }
}

// System 处理逻辑
class GridPhysicsSystem extends System {
  Update(dt) {
    const data = this._dataManager.GetData('GridData');
    // 直接操作 grid 数组
  }
}

// System 渲染
class GridRenderSystem extends System {
  Update(dt) {
    const data = this._dataManager.GetData('GridData');
    const screenData = this._dataManager.GetData('ScreenData');
    const ctx = screenData.gameCtx;
    // 遍历 grid 绘制
  }
}
```

### 模式 2：Entity + Component（可交互）

适用于：RPG 角色、塔防单位

```javascript
// 创建可交互 Entity
const player = this.CreateEntity();
player.AddComponent(new HealthComponent());
player.AddComponent(new SpriteComponent());
player.AddComponent(new GameClickComponent({
  onClick: () => console.log('选中角色'),
  getPosition: () => ({ x: player.x, y: player.y }),
  width: 64, height: 64
}));

// System 处理 Component
class CombatSystem extends System {
  Update(dt) {
    for (const [id, entity] of this._entities) {
      const health = entity.GetComponent('HealthComponent');
      if (health && health.isDead()) {
        this._entities.delete(id);
        entity.Dispose();
      }
    }
  }
}
```

### 模式 3：混合模式

游戏层数据驱动 + UI 层 Entity 交互

```javascript
OnInit() {
  // 游戏层：数据驱动
  const gameData = this.dataManager.RegisterData(GameData);
  this.AddSystem(GamePhysicsSystem);
  this.AddSystem(GameRenderSystem);
  
  // UI 层：Entity + Component
  const uiRoot = this.CreateEntity();
  // ... 创建 UI 按钮、文本等
  this.AddSystem(UIInputSystem);
  this.AddSystem(UIRenderSystem);
}
```

---

## 关键注意事项

### ✅ 必须做

1. **文档优先**：修改代码前先查阅 `docs/`
2. **同步文档**：代码修改后立即更新对应文档
3. **System 顺序**：
   - UIInputSystem → GameInputSystem → 逻辑 System → UIRenderSystem
4. **UIRoot 必设**：`screenData.uiRootId = uiRoot.id`
5. **静态 ID**：Component/Data 的 `static ID` 必须唯一
6. **事件清理**：System/Component 的 Dispose 中必须 Off 事件

### ❌ 避免

1. **不要跳过文档直接看代码**
2. **不要在代码修改后遗忘更新文档**
3. **不要在 UIInputSystem 前添加 GameInputSystem**
4. **不要在逻辑 System 后添加 UIRenderSystem**
5. **不要混淆 UI 坐标系统和游戏层坐标系统**

---

## 快速参考

详细 API 和示例见 [quick-reference.md](quick-reference.md)

### 核心类速查

| 类 | 路径 | 用途 |
|----|------|------|
| GameManager | `framework/GameManager.js` | 顶层管理器，切换游戏 |
| Game | `framework/Game.js` | 游戏主体基类 |
| Entity | `framework/Entity.js` | 实体容器 |
| Component | `framework/Component.js` | 组件基类 |
| System | `framework/System.js` | 系统基类 |
| DataBase | `framework/DataBase.js` | 数据基类 |
| DataManager | `framework/DataManager.js` | 数据管理器 |
| EventDispatcher | `framework/EventDispatcher.js` | 事件派发器 |

### UI 组件速查

| 组件 | 用途 |
|------|------|
| UITransformComponent | UI 定位布局 |
| UITextComponent | 文本渲染 |
| UIClickComponent | UI 点击 |
| UIDragComponent | UI 拖动 |
| GameClickComponent | 游戏层点击 |
| GameDragComponent | 游戏层拖动 |

### 系统速查

| 系统 | 用途 | 添加顺序 |
|------|------|----------|
| UIInputSystem | UI 输入处理 | 1（最先） |
| GameInputSystem | 游戏层输入 | 2 |
| UIRenderSystem | UI 渲染 | 最后 |

---

## 示例游戏

完整示例见项目文件：

| 游戏 | 路径 | 特点 |
|------|------|------|
| 打砖块 | `games/breakout/` | 数据驱动，分轴碰撞算法 |
| 交互演示 | `games/demogame/` | UI + 游戏层双层交互 |

阅读 `docs/breakout-api.md` 了解实际应用。
