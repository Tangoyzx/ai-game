# 面向功能的游戏开发框架

开发一个面向功能的游戏开发框架，方便后续使用。使用微信小游戏的API以及javascript，主要的类有以下几个。
## EventDispatcher
    常见的事件派发器，监听并广播事件，传递事件类型id、事件派发器本身以及一个hashmap的弱类型参数供不同事件类型使用。

## Entity
    组件的容器，一般来说游戏里面所有内容都是Entity，包括需要渲染的和不需要渲染的，功能由Component实现。
    主要功能为
    1、持有、获取、添加、删除Component。
    2、基类构造函数为空，提供Init方法初始化时传入的EventDispatcher与DataManager并持有其引用。提供Dispose方法供释放使用，主要功能是调用持有的所有Component的Dispose方法。
    4、Entity默认都有TransformComponent，需要添加相关的控制父子层级的方法。
    5、提供AddComponent方法，传入Component的子类实例，将其加入到持有的key为Component子类ID，而value为实例的hashmap中，并且调用其Init方法并传入Entity自己、EventDispatcher与DataManager。假如Component子类ID已有值，则警告、移除原有Component并执行新Component的添加。
    6、提供RemoveComponent方法，传入Component的子类ID，假如hashmap中存在值则调用其Dispose方法并从hashmap移除。
    7、每个Entity实例需要有一个独立的id。
    8、Entity的子类一般只负责添加不同的Component以方便作为预设，Entity本身不应该实现任何功能。
    
## Component
    各种功能实现类，必须挂载到Entity上以生效。
    主要功能为
    1、基类默认构造方法为空
    2、提供Init方法，参数为Entity、EventDispatcher、DataManager，传入后以私有变量持有。持有私有变量后调用供子类重写的OnInit方法。OnInit方法不需要参数传入。
    3、提供Dispose方法，先调用子类的OnDispose方法，再把Entity、EventDispatcher、DataManager的引用置空。
    4、Entity、EventDispatcher、DataManager在Init传入并持有后在Component中使用均为只读不可修改。
    5、提供EventDispatcher同样的函数，实际功能为中转给Entity的EventDispatcher使用
    6、为了给Entity快速查询Component，每个Component子类必须提供一个不重复的类型ID。

## System
    游戏中的各种系统。
    主要功能为
    1、构造时需要获取当前Game的EventDispatcher、DataManager以及所有Entity。
    2、提供Update方法供Game统一调用

## DataManager
    持有各种数据的管理器，本身不实现任何功能。只负责提供相关的数据结构供其他功能增删改。
    数据类型必须都继承DataBase，每个子类有自己的静态ID，通过静态ID来获取对应的弱类型数据（hashmap）。

## Game
    单个游戏的主要实现。
    主要功能为
    1、负责Entity的创建、删除、查询和持有。
    2、负责System的创建、删除、查询和持有。
    3、负责EventDispatcher的创建、删除和持有，一般一个Game下面共用同一个EventDispatcher。
    4、负责DataManager的创建与持有。

## GameManager
    Game的上一层功能，负责游戏的初始化、切换、释放等。需要提供一个非Game形式的Loading界面供切换Game时候使用。
