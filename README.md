# Holy Grail Beast Text Adventure

轻量文字版圣杯战争游戏。

## 当前版本

- 版本：1.0.0
- 核心流程：三选一召唤 -> 选择战争方针 -> 自动推进六骑战 -> 终局 Beast 投择 -> 单次结算
- 支持重复游玩时的从者宝具等级成长
- 支持敌骑之间的场外交战与击杀关系统计

## 主要文件

- `engine.js`：核心引擎
- `engine-data.js`：世界与文案数据
- `heroic-spirits.js`：从者池与基础资料
- `index.html` / `script.js` / `styles.css`：本地试玩页面
- `HOLY_GRAIL_WAR_HANDOFF.md`：项目说明与交接文档

## 本地试玩

直接打开 `index.html` 即可。

## 玩法概要

1. 开局进行三选一召唤，可重抽一次。
2. 选定总体战争方针后，系统自动推进大部分剧情与战斗。
3. 六骑退场后进入终局异变，随机遭遇一只 Beast。
4. 在终局做出最后一次投择，并进入最终结局。
