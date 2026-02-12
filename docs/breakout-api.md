# 打砖块游戏 - API 与架构文档

## 概述

打砖块游戏基于框架的 ECS 架构实现，通过数据驱动方式管理网格砖块和小球状态。游戏区域以 32x32 像素网格构成，宽 10 格 x 高 15 格，屏幕居中显示。

> 框架核心 API 见 [framework-api.md](framework-api.md)

## 游戏规则

- 小球从游戏区域正中心出发，以随机方向匀速运动
- 碰到砖块后以相同速度向反射方向移动
- 最外圈砖块不可破坏
- 内侧两圈砖块可破坏，初始耐久度 20，每次碰撞减 1，降至 0 后消失
- 砖块颜色随耐久度变化：绿（高）→ 黄（中）→ 红（低）

## 游戏区域布局

```
10 列 x 15 行，每格 32x32 像素 = 320x480 像素

┌──────────────────────────────┐
│ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■        │  第 0 圈: 不可破坏（灰色）
│ ■ □ □ □ □ □ □ □ □ ■        │  第 1 圈: 可破坏 20HP
│ ■ □ □ □ □ □ □ □ □ ■        │  第 2 圈: 可破坏 20HP
│ ■ □ □ · · · · □ □ ■        │  内部: 空白
│ ■ □ □ ·       · □ □ ■        │
│ ■ □ □ ·   ●   · □ □ ■        │  ● = 小球初始位置
│ ...                          │
│ ■ □ □ □ □ □ □ □ □ ■        │
│ ■ ■ ■ ■ ■ ■ ■ ■ ■ ■        │
└──────────────────────────────┘

■ = 不可破坏砖块  □ = 可破坏砖块  · = 空白  ● = 小球
```

## 文件结构

```
game/js/games/breakout/
├── BreakoutGame.js              # 游戏主体，继承 Game
├── BreakoutData.js              # 游戏数据（DataBase），存储网格/球状态
├── BreakoutPhysicsSystem.js     # 物理系统，球运动 + 碰撞
└── BreakoutRenderSystem.js      # 渲染系统，绘制砖块和球
```

## 架构

```
BreakoutGame (Game)
  ├── DataManager
  │     ├── ScreenData（画布信息，由框架注入）
  │     └── BreakoutData（游戏状态：网格、小球）
  └── Systems
        ├── BreakoutPhysicsSystem（物理：球运动 + 分轴碰撞）
        └── BreakoutRenderSystem（渲染：砖块 + 小球）
```

注意：本游戏未使用 Entity/Component 来表示砖块和小球，而是将所有状态集中在 `BreakoutData` 中，由 System 直接读写。这是因为砖块和小球不需要交互组件（点击/拖动），纯数据驱动更高效。

---

## 类 API 文档

### BreakoutData

**文件**: `game/js/games/breakout/BreakoutData.js`

继承自 DataBase，存储打砖块游戏的全部状态。

| 静态属性 | 值 |
|----------|----|
| `ID` | `"BreakoutData"` |

| 实例属性 | 类型 | 默认值 | 说明 |
|----------|------|--------|------|
| `cellSize` | `number` | `32` | 网格单元像素大小 |
| `cols` | `number` | `10` | 网格列数 |
| `rows` | `number` | `15` | 网格行数 |
| `brickMaxHP` | `number` | `20` | 可破坏砖块初始耐久度 |
| `gridOffsetX` | `number` | `0` | 游戏区域左上角 X（屏幕居中后计算） |
| `gridOffsetY` | `number` | `0` | 游戏区域左上角 Y（屏幕居中后计算） |
| `bricks` | `number[][]` | `[]` | 砖块网格，`bricks[row][col]`。值含义见下表 |
| `ballX` | `number` | `0` | 小球中心 X（屏幕绝对坐标） |
| `ballY` | `number` | `0` | 小球中心 Y（屏幕绝对坐标） |
| `ballVX` | `number` | `0` | 小球 X 方向速度（像素/秒） |
| `ballVY` | `number` | `0` | 小球 Y 方向速度（像素/秒） |
| `ballRadius` | `number` | `5` | 小球半径（像素） |
| `ballSpeed` | `number` | `200` | 小球速度标量（像素/秒） |

**bricks 值含义：**

| 值 | 含义 |
|----|------|
| `0` | 空（无砖块） |
| `-1` | 不可破坏砖块 |
| `1~20` | 可破坏砖块，数值为剩余耐久度 |

---

### BreakoutPhysicsSystem

**文件**: `game/js/games/breakout/BreakoutPhysicsSystem.js`

继承自 System，物理碰撞系统。每帧更新小球位置并处理碰撞。

**碰撞算法 — 分轴碰撞检测：**

采用先 X 轴后 Y 轴的分轴策略，解决传统碰撞检测中常见的以下问题：
- 球命中两砖块缝隙时反弹方向异常
- 球嵌入砖块内部

算法流程（每个轴的处理）：
1. 沿当前轴移动球
2. 在球运动方向上查找第一个碰到的砖块（速度方向过滤 + 最小穿透深度）
3. 若碰撞：将球推出，翻转该轴速度，砖块扣血
4. 速度已反转，回到步骤 2 重新检测（此时球朝反方向运动，之前同侧的相邻砖块自然被跳过）
5. 无碰撞则结束

速度方向过滤：每次只考虑球正在朝向的砖块（推出方向与速度方向相反的砖块）。球远离的砖块即使 AABB 重叠也不算碰撞。这样碰到第一个砖块弹开后，速度反转，相邻砖块自然不会被命中，无需任何硬编码判断。

碰撞检测利用网格特性，仅检查球覆盖范围内的少量格子（通常 2x2），性能极高。`dt` 被限制在 0.05 秒以内以防止高帧间隔穿越。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Update(dt)` | `dt: number` | `void` | 每帧更新球位置并处理碰撞 |

---

### BreakoutRenderSystem

**文件**: `game/js/games/breakout/BreakoutRenderSystem.js`

继承自 System，渲染系统。在 Game Canvas 上绘制游戏画面。

**绘制内容：**

1. **背景**：深色底 + 游戏区域底色 + 网格线
2. **砖块**：带间距的矩形方块，颜色按类型/耐久度区分
3. **小球**：白色实心圆 + 阴影 + 高光

**砖块颜色规则：**

| 类型 | 颜色 | 条件 |
|------|------|------|
| 不可破坏 | 灰色 `#555555` | `hp === -1` |
| 高耐久 | 绿色 `#27ae60` | `hp/maxHP > 0.65`（14-20） |
| 中耐久 | 黄色 `#f1c40f` | `hp/maxHP > 0.3`（7-13） |
| 低耐久 | 红色 `#e74c3c` | `hp/maxHP <= 0.3`（1-6） |

可破坏砖块上会显示当前耐久度数字。

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `Update(dt)` | `dt: number` | `void` | 每帧绘制背景、砖块和小球 |

---

### BreakoutGame

**文件**: `game/js/games/breakout/BreakoutGame.js`

继承自 Game，打砖块游戏主体。

**`OnInit()` 流程：**

1. 获取 `ScreenData`，计算游戏区域居中偏移
2. 注册 `BreakoutData` 到 DataManager
3. 初始化砖块网格（3 圈）
4. 初始化小球（中心位置 + 随机方向，角度避免过于水平/垂直）
5. 添加 `BreakoutPhysicsSystem` 和 `BreakoutRenderSystem`

**启动方式：**

```javascript
// 在 main.js 中
const GameManager = require('./framework/GameManager');
const BreakoutGame = require('./games/breakout/BreakoutGame');

const canvas = wx.createCanvas();
const gameManager = new GameManager();
gameManager.Init(canvas);
gameManager.SwitchGame(BreakoutGame);
```
