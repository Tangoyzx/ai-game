# 面向组件游戏开发框架 - API 与架构文档

## 概述

本框架是一个面向组件（Component-Based）的游戏开发框架，运行于微信小游戏环境，使用 JavaScript 实现。核心思想是通过 Entity-Component-System 模式组织游戏逻辑，Entity 作为组件容器，Component 实现具体功能，System 处理全局逻辑。

## 模块文档索引

| 文档 | 说明 |
|------|------|
| [framework-api.md](framework-api.md)（本文档） | 框架核心 API |
| [ui-api.md](ui-api.md) | UI 与交互模块 API（UITransformComponent、UITextComponent、UIClickComponent、UIDragComponent、GameClickComponent、GameDragComponent、UIRenderSystem、UIInputSystem、GameInputSystem） |

## 项目结构

```
game/
├── game.js                          # 微信小游戏入口
├── game.json                        # 小游戏全局配置
├── project.config.json              # 开发者工具项目配置
└── js/
    ├── core/                        # 通用底层模块
    │   ├── components/
    │   │   ├── TransformComponent.js    # 默认 Transform 组件
    │   │   ├── UITransformComponent.js  # UI 定位组件（→ ui-api.md）
    │   │   ├── UITextComponent.js       # UI 文本组件（→ ui-api.md）
    │   │   ├── UIClickComponent.js      # UI 点击组件（→ ui-api.md）
    │   │   ├── UIDragComponent.js       # UI 拖动组件（→ ui-api.md）
    │   │   ├── GameClickComponent.js    # 游戏层点击组件（→ ui-api.md）
    │   │   └── GameDragComponent.js     # 游戏层拖动组件（→ ui-api.md）
    │   ├── data/
    │   │   └── ScreenData.js            # 屏幕/画布数据
    │   └── systems/
    │       ├── UIRenderSystem.js         # UI 渲染系统（→ ui-api.md）
    │       ├── UIInputSystem.js          # UI 输入系统（→ ui-api.md）
    │       └── GameInputSystem.js        # 游戏层输入系统（→ ui-api.md）
    ├── games/                       # 游戏实现
    │   └── demogame/                    # 交互演示游戏
    │       ├── DemoGame.js              # 演示游戏主体
    │       └── DemoRenderSystem.js      # 演示用渲染系统
    ├── framework/                   # 框架基类
    │   ├── EventDispatcher.js       # 事件派发器
    │   ├── Component.js             # 组件基类
    │   ├── Entity.js                # 实体（组件容器）
    │   ├── System.js                # 系统基类
    │   ├── DataBase.js              # 数据基类
    │   ├── DataManager.js           # 数据管理器
    │   ├── Game.js                  # 单个游戏主体
    │   └── GameManager.js           # 游戏管理器（切换/Loading）
    └── main.js                      # 启动入口逻辑
```

## 架构层级

```
GameManager（顶层管理器，管理主 Canvas + 双层离屏 Canvas）
  ├── Game Canvas（离屏，游戏内容层）
  ├── UI Canvas（离屏，UI 层）
  └── Game（单个游戏主体）
        ├── EventDispatcher（事件派发器，Game 内共享）
        ├── DataManager（数据管理器）
        │     └── ScreenData（屏幕/画布数据，含双层 Canvas context）
        ├── Entity（实体容器）
        │     └── Component（功能组件）
        │           └── TransformComponent（默认组件，管理父子层级）
        └── System（系统，每帧 Update）
```

> UI 模块架构（双层渲染流程、UI Entity 树结构等）见 [ui-api.md](ui-api.md)

---

## 类 API 文档

### EventDispatcher

**文件**: `game/js/framework/EventDispatcher.js`

事件派发器，监听并广播事件。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `On(eventId, callback, context?)` | `eventId: string`, `callback: Function`, `context?: any` | `void` | 注册事件监听。callback 签名为 `(eventId, dispatcher, params)` |
| `Off(eventId, callback, context?)` | `eventId: string`, `callback: Function`, `context?: any` | `void` | 移除事件监听 |
| `Emit(eventId, params?)` | `eventId: string`, `params?: Object` | `void` | 广播事件，params 为 hashmap 弱类型参数 |
| `Clear()` | 无 | `void` | 移除所有事件监听 |

---

### Component

**文件**: `game/js/framework/Component.js`

组件基类，所有功能组件必须继承此类。

| 静态属性 | 类型 | 说明 |
|----------|------|------|
| `ID` | `string` | 子类必须重写，提供不重复的类型 ID |

| 只读属性 | 类型 | 说明 |
|----------|------|------|
| `entity` | `Entity` | 挂载的实体引用（Init 后只读） |
| `eventDispatcher` | `EventDispatcher` | 事件派发器引用（Init 后只读） |
| `dataManager` | `DataManager` | 数据管理器引用（Init 后只读） |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `GetID()` | 无 | `string` | 获取该组件子类的类型 ID |
| `Init(entity, eventDispatcher, dataManager)` | 见参数 | `void` | 初始化（由 Entity.AddComponent 调用），初始化完成后调用 OnInit |
| `Dispose()` | 无 | `void` | 释放，先调用 OnDispose 再清空引用 |
| `OnInit()` | 无 | `void` | 初始化回调，供子类重写 |
| `OnDispose()` | 无 | `void` | 释放回调，供子类重写 |
| `On(eventId, callback, context?)` | 同 EventDispatcher | `void` | 中转给 EventDispatcher |
| `Off(eventId, callback, context?)` | 同 EventDispatcher | `void` | 中转给 EventDispatcher |
| `Emit(eventId, params?)` | 同 EventDispatcher | `void` | 中转给 EventDispatcher |

---

### TransformComponent

**文件**: `game/js/core/components/TransformComponent.js`

继承自 Component，Entity 默认持有，管理父子层级关系。

| 静态属性 | 值 |
|----------|----|
| `ID` | `"TransformComponent"` |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `SetParent(parentEntity)` | `parentEntity: Entity\|null` | `void` | 设置父 Entity，自动处理旧父子关系解除 |
| `AddChild(childEntity)` | `childEntity: Entity` | `void` | 添加子 Entity |
| `RemoveChild(childEntity)` | `childEntity: Entity` | `void` | 移除子 Entity |
| `GetParent()` | 无 | `Entity\|null` | 获取父 Entity |
| `GetChildren()` | 无 | `Array<Entity>` | 获取所有子 Entity（返回拷贝） |

---

### Entity

**文件**: `game/js/framework/Entity.js`

实体，组件的容器。游戏中所有内容都是 Entity，功能由 Component 实现。

| 只读属性 | 类型 | 说明 |
|----------|------|------|
| `id` | `number` | 唯一实例 ID（静态自增） |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Init(eventDispatcher, dataManager)` | 见参数 | `void` | 初始化实体，自动添加 TransformComponent |
| `Dispose()` | 无 | `void` | 释放实体及所有组件 |
| `AddComponent(component)` | `component: Component` | `Component` | 添加组件实例，自动调用 Init。同 ID 已存在则警告并替换 |
| `RemoveComponent(componentId)` | `componentId: string` | `void` | 按 ID 移除组件 |
| `GetComponent(componentId)` | `componentId: string` | `Component\|undefined` | 按 ID 获取组件 |
| `GetTransform()` | 无 | `TransformComponent\|undefined` | 快捷获取 TransformComponent |
| `SetParent(parentEntity)` | `parentEntity: Entity\|null` | `void` | 委托 TransformComponent 设置父级 |
| `GetParent()` | 无 | `Entity\|null` | 委托 TransformComponent 获取父级 |
| `AddChild(childEntity)` | `childEntity: Entity` | `void` | 委托 TransformComponent 添加子级 |
| `RemoveChild(childEntity)` | `childEntity: Entity` | `void` | 委托 TransformComponent 移除子级 |
| `GetChildren()` | 无 | `Array<Entity>` | 委托 TransformComponent 获取所有子级 |

---

### System

**文件**: `game/js/framework/System.js`

系统基类，处理游戏中的全局逻辑。

| 构造函数参数 | 类型 | 说明 |
|-------------|------|------|
| `eventDispatcher` | `EventDispatcher` | 事件派发器 |
| `dataManager` | `DataManager` | 数据管理器 |
| `entities` | `Map<number, Entity>` | 当前 Game 的所有 Entity |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Update(dt)` | `dt: number`（秒） | `void` | 每帧更新，子类重写 |
| `Dispose()` | 无 | `void` | 释放系统 |

---

### DataBase

**文件**: `game/js/framework/DataBase.js`

数据基类，所有数据类型必须继承此类。子类通过构造函数定义自身的数据字段，DataManager 注册时会自动实例化。

| 静态属性 | 类型 | 说明 |
|----------|------|------|
| `ID` | `string` | 子类必须重写，提供不重复的数据类型 ID |

---

### DataManager

**文件**: `game/js/framework/DataManager.js`

数据管理器，持有各种数据的管理器。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `RegisterData(dataClass)` | `dataClass: typeof DataBase` | `DataBase` | 以 DataBase 子类的静态 ID 为 key 创建并存储其实例 |
| `GetData(dataId)` | `dataId: string` | `DataBase\|undefined` | 获取对应 ID 的数据实例 |
| `RemoveData(dataId)` | `dataId: string` | `void` | 移除对应 ID 的数据 |
| `HasData(dataId)` | `dataId: string` | `boolean` | 检查是否已注册某种数据 |
| `Clear()` | 无 | `void` | 清空所有数据 |

---

### Game

**文件**: `game/js/framework/Game.js`

单个游戏的主体实现，管理 Entity、System、EventDispatcher 和 DataManager。

| 只读属性 | 类型 | 说明 |
|----------|------|------|
| `eventDispatcher` | `EventDispatcher` | 事件派发器 |
| `dataManager` | `DataManager` | 数据管理器 |
| `entities` | `Map<number, Entity>` | 所有 Entity |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Init(context?)` | `context?: Object` | `void` | 初始化 Game，创建 EventDispatcher 和 DataManager。若传入 context 则注册 ScreenData 到 DataManager，然后调用 OnInit |
| `Dispose()` | 无 | `void` | 释放 Game，清理所有资源，调用 OnDispose |
| `OnInit()` | 无 | `void` | 子类重写的初始化回调 |
| `OnDispose()` | 无 | `void` | 子类重写的释放回调 |
| `CreateEntity(EntityClass?)` | `EntityClass?: typeof Entity` | `Entity` | 创建并初始化 Entity，默认使用 Entity 基类 |
| `RemoveEntity(entityId)` | `entityId: number` | `void` | 移除并释放 Entity |
| `GetEntity(entityId)` | `entityId: number` | `Entity\|undefined` | 按 ID 获取 Entity |
| `AddSystem(SystemClass)` | `SystemClass: typeof System` | `System` | 添加系统（传入子类，自动实例化） |
| `RemoveSystem(system)` | `system: System` | `void` | 移除并释放 System |
| `Update(dt)` | `dt: number`（秒） | `void` | 每帧更新所有 System |

---

### GameManager

**文件**: `game/js/framework/GameManager.js`

游戏管理器，Game 的上层管理，负责游戏初始化、切换、释放。管理主 Canvas 和双层离屏 Canvas。

| 只读属性 | 类型 | 说明 |
|----------|------|------|
| `currentGame` | `Game\|null` | 当前运行的 Game |
| `canvas` | `HTMLCanvasElement\|null` | 主画布 |

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Init(canvas)` | `canvas: HTMLCanvasElement` | `void` | 初始化，持有 canvas，创建 Game Canvas 和 UI Canvas（离屏），启动主循环 |
| `SwitchGame(GameClass)` | `GameClass: typeof Game` | `void` | 切换 Game，显示 Loading -> 释放旧 Game -> 初始化新 Game（传入画布 context）-> 隐藏 Loading |
| `Dispose()` | 无 | `void` | 释放 GameManager 及当前 Game，清理离屏 Canvas，停止主循环 |

---

### ScreenData

**文件**: `game/js/core/data/ScreenData.js`

继承自 DataBase，存储屏幕和画布信息。由 GameManager 在 `SwitchGame` 时通过 `Game.Init(context)` 自动注册到 DataManager。

| 静态属性 | 值 |
|----------|----|
| `ID` | `"ScreenData"` |

| 实例属性 | 类型 | 默认值 | 说明 |
|----------|------|--------|------|
| `gameCtx` | `CanvasRenderingContext2D\|null` | `null` | 游戏层离屏 Canvas context |
| `uiCtx` | `CanvasRenderingContext2D\|null` | `null` | UI 层离屏 Canvas context |
| `width` | `number` | `0` | 画布宽度 |
| `height` | `number` | `0` | 画布高度 |
| `uiRootId` | `number\|null` | `null` | UI 根 Entity 的 id（由使用者在 OnInit 中设置） |

---

## 使用示例

### 创建自定义 Component

```javascript
const Component = require('./framework/Component');

class HealthComponent extends Component {
  static ID = 'HealthComponent';

  OnInit() {
    this._hp = 100;
    this._maxHp = 100;
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

### 创建自定义 Entity 预设

```javascript
const Entity = require('./framework/Entity');
const HealthComponent = require('./HealthComponent');

class PlayerEntity extends Entity {
  // Entity 子类只负责添加 Component 作为预设
}

// 使用时在 Game 中：
const player = game.CreateEntity(PlayerEntity);
player.AddComponent(new HealthComponent());
```

### 创建自定义 System

```javascript
const System = require('./framework/System');

class DamageSystem extends System {
  Update(dt) {
    // 遍历 entities 处理伤害逻辑
    for (const [id, entity] of this._entities) {
      const health = entity.GetComponent('HealthComponent');
      if (health) {
        // 处理逻辑...
      }
    }
  }
}
```

### 创建自定义 Game

```javascript
const Game = require('./framework/Game');
const DamageSystem = require('./DamageSystem');

class BattleGame extends Game {
  OnInit() {
    // 添加系统
    this.AddSystem(DamageSystem);

    // 创建实体
    const player = this.CreateEntity();
    player.AddComponent(new HealthComponent());
  }

  OnDispose() {
    // 自定义清理逻辑
  }
}

// 在 GameManager 中切换到这个 Game
gameManager.SwitchGame(BattleGame);
```

### 使用 DataManager

```javascript
const DataBase = require('./framework/DataBase');

class GameConfigData extends DataBase {
  static ID = 'GameConfigData';

  constructor() {
    super();
    this.difficulty = 'normal';
    this.maxEnemies = 10;
  }
}

// 在 Game 的 OnInit 中注册
const configData = this.dataManager.RegisterData(GameConfigData);
configData.difficulty = 'hard';
configData.maxEnemies = 20;

// 在 System 或 Component 中获取
const config = this.dataManager.GetData('GameConfigData');
console.log(config.difficulty); // 'hard'
```
