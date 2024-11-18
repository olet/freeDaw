开发一个全新的高度自由的音乐创作软件

高度模块化

首先，核心的概念是clip，它是一个基本单位。

一个clip并不是Ableton Live里的clip，而是一种最小的音乐模式，换言之，它可以被表现成不同的形态。

举个例子，我有一个clip，它的核心模式就是一个简单的节奏，我可以基于它做各种修改器，比如让它的节奏变得密集，但是保持了基本的结构，或者把它加上音高约束，变成一个旋律。

借用blender的概念，clip是mesh，mesh可以加上各种modifier，这里的modifier就是对mesh的运行时修改，同理，clip也可以加上modifier，modifier就是对clip的运行时修改。


增加一个scence概念，scene不是clip的集合，scene只是控制流，由节点node组成，可以理解为一个高度抽象的音序器，
默认的scenece，存储了N行*M列个node，每个node是对clip的运行控制容器，可以设置1个或者多个clip，以及clip的运行逻辑。

