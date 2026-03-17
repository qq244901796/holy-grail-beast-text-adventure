(function (globalFactory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = globalFactory();
    } else {
        window.TextAdventureData = globalFactory();
    }
})(function () {
    const WORLD = {
        title: "冬木圣杯战争",
        opening: [
            "冬木市的灵脉已经苏醒，圣杯战争悄然开幕。",
            "你以御主之身被卷入其中，白天搜集情报，夜晚则随时可能直面从者。",
            "从现在开始，每一步都可能把你带向圣杯，也可能把你推向死亡。"
        ],
        locations: [
            { name: "新都商业区", region: "city" },
            { name: "深山町住宅街", region: "residential" },
            { name: "教会地下礼拜堂", region: "church" },
            { name: "冬木大桥桥面", region: "bridge" },
            { name: "未远川码头", region: "waterfront" },
            { name: "柳洞寺山门", region: "temple" },
            { name: "深山灵脉外围林地", region: "forest" },
            { name: "废弃炼钢工厂", region: "industrial" },
            { name: "临时魔术工房", region: "workshop" },
            { name: "灵脉交汇点", region: "leyline" },
            { name: "最终降灵祭坛", region: "grail" }
        ],
        moods: [
            "空气里混着铁锈味与淡淡魔力残香。",
            "整座城市像在屏住呼吸，等待哪一方率先出手。",
            "夜色并不安静，灵脉下方的躁动像心跳一样一阵阵传来。",
            "风从未远川吹来，把尚未干涸的杀意推向街巷。"
        ],
        allies: ["教会监督役", "旧识魔术师", "黑市情报贩", "本地灵术师"],
        relics: ["残缺令咒拓片", "旧式触媒碎片", "灵脉观测图", "强制补魔符纸"]
    };

    const REGIONS = {
        city: "新都城区",
        residential: "深山町住宅区",
        church: "教会辖区",
        bridge: "冬木大桥",
        waterfront: "未远川沿岸",
        temple: "柳洞寺地界",
        forest: "深山林地",
        industrial: "旧工厂带",
        workshop: "魔术工房",
        leyline: "灵脉节点",
        grail: "圣杯核心区域"
    };

    const STAGES = {
        early: { min: 0, max: 2, label: "开战初期" },
        mid: { min: 3, max: 5, label: "阵营浮出" },
        late: { min: 6, max: 99, label: "终局逼近" }
    };

    const ACTIONS = [
        { id: "explore", label: "搜索灵脉", risk: 0.24 },
        { id: "talk", label: "试探御主", risk: 0.31 },
        { id: "cast", label: "术式布防", risk: 0.29 },
        { id: "sneak", label: "夜间追猎", risk: 0.37 },
        { id: "rest", label: "补充魔力", risk: 0.12 },
        { id: "bond", label: "与从者对话", risk: 0.18 },
        { id: "gamble", label: "主动强袭", risk: 0.48 },
        { id: "observe", label: "搜集情报", risk: 0.20 },
        { id: "craft", label: "强化据点", risk: 0.23 }
    ];

    const PREVIEWS = {
        explore: ["沿灵脉反应最强的方向试探推进。", "在危险区域内寻找能改变局势的线索。"],
        talk: ["接触可疑人物，看他们是否与圣杯战争有关。", "先不交手，试着确认对方到底站在哪边。"],
        cast: ["布置警戒术式，封锁敌方的潜入路径。", "用结界和术式为下一战做铺垫。"],
        sneak: ["趁夜沿异常魔力留下的痕迹追过去。", "夜里跟踪一股可疑从者气息，看看会通向谁。"],
        rest: ["短暂退出前线，稳定契约与精神状态。", "优先补魔与疗伤，避免下一战直接崩盘。"],
        bond: ["正面与从者谈谈理念、愿望与底线。", "借一次坦白或争执，重新定义主从关系。"],
        gamble: ["放弃保守推进，直接挑最危险的目标下手。", "不再试探，直接用高风险行动换突破。"],
        observe: ["重新梳理目前掌握的敌情和目击记录。", "不急着行动，先把局势看得更清楚。"],
        craft: ["加固据点，准备迎接迟早会来的夜袭。", "让据点真正变成能撑住一轮冲突的堡垒。"]
    };

    const ACTION_FLAVORS = {
        explore: { success: ["你顺着灵脉的细微脉动一路摸到了正确方向。"], fail: ["你踩进了被人刻意清理过的假线索里。"] },
        talk: { success: ["你把话题稳稳地引向了自己想要的方向。"], fail: ["你本想试探，结果反而先暴露了自己的意图。"] },
        cast: { success: ["术式顺利闭合，周边灵脉被你重新整理出秩序。"], fail: ["灵脉反馈比预想更乱，你的布防出现了空窗。"] },
        sneak: { success: ["你像影子一样切进夜色，没有让多余的气息散出去。"], fail: ["你以为自己在跟踪别人，结果另一双眼睛先盯上了你。"] },
        rest: { success: ["短暂的安静终于让你的魔力与呼吸重新稳定。"], fail: ["这次停下来没换回恢复，反而让焦躁感更明显了。"] },
        bond: { success: ["你终于和从者说到了真正该说的话。"], fail: ["这场谈话没能弥合隔阂，反而让问题更清晰了。"] },
        gamble: { success: ["你把最危险的筹码压了下去，而且这一手真的奏效了。"], fail: ["你压得太狠了，局势几乎当场反咬回来。"] },
        observe: { success: ["零碎信息在你眼前慢慢拼成了可用的轮廓。"], fail: ["你盯住了许多细节，却没抓到最关键的那一根线。"] },
        craft: { success: ["据点被你整理得更像一处真正的战争据点。"], fail: ["你想加固据点，却先暴露了它真正脆弱的位置。"] }
    };

    const EVENT_DECKS = {
        success: [
            { id: "s1", weight: 1, text: "你确认了另一组御主最近的活动范围。", delta: { truth: 1, enemyIntel: 1 }, tags: ["observe", "talk"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "s2", weight: 1, text: "你找到了一处能被提前利用的灵脉节点。", delta: { progress: 1, insight: 1 }, tags: ["explore", "cast"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "s3", weight: 1, text: "你的据点终于具备了抵挡夜袭的基本条件。", delta: { hp: 1, favor: 1 }, tags: ["craft", "rest"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "s4", weight: 1, text: "你们主从之间的节奏第一次真正对上了。", delta: { trust: 1, favor: 1 }, tags: ["bond"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "s5", weight: 1, text: "你逼得敌方提前改写了原本的计划。", delta: { progress: 2, threat: 1 }, tags: ["sneak", "gamble"], regions: ["any"], stages: ["mid", "late"] }
        ],
        failure: [
            { id: "f1", weight: 1, text: "你最后只得到一堆无用噪音与更多疑点。", delta: { threat: 1, sanity: -1 }, tags: ["observe", "talk"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "f2", weight: 1, text: "你反而把自己暴露在了错误的位置。", delta: { sanity: -1, progress: -1 }, tags: ["explore", "cast", "craft"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "f3", weight: 1, text: "夜色之中，别人比你更早一步完成了布置。", delta: { hp: -1, threat: 1 }, tags: ["sneak", "gamble"], regions: ["any"], stages: ["mid", "late"] },
            { id: "f4", weight: 1, text: "你们的对话没有换来信任，只留下更多未说出口的不满。", delta: { favor: -1, trust: -1 }, tags: ["bond"], regions: ["any"], stages: ["early", "mid", "late"] }
        ],
        rare: [
            { id: "r1", weight: 1, text: "圣杯系统像短暂掀开了一层幕布，让你看见了一小段不该看见的真相。", delta: { progress: 1, insight: 2 }, tags: ["*"], regions: ["any"], stages: ["early", "mid", "late"] },
            { id: "r2", weight: 1, text: "某段并不属于你的记忆突然与契约共振，替你补上了一块关键拼图。", delta: { truth: 2, sanity: -1 }, tags: ["*"], regions: ["any"], stages: ["mid", "late"] }
        ],
        boss: [
            { id: "b1", name: "监督者的最后警告", text: "教会终于不再保持模糊立场。你意识到，这场战争的表层规则可能会被彻底撕开。", tags: ["observe", "talk", "bond"], regions: ["church", "grail"], stages: ["late"], delta: { progress: 2, truth: 1, sanity: -1, rift: 1 } },
            { id: "b2", name: "圣杯污染外溢", text: "灵脉核心出现了不该存在的黑色反流。你终于亲眼见到圣杯系统正在吞掉原本维系它的秩序。", tags: ["cast", "craft", "observe", "gamble"], regions: ["leyline", "grail", "workshop"], stages: ["late"], delta: { progress: 2, hp: -1, rift: 1 } }
        ]
    };

    return { WORLD, REGIONS, STAGES, ACTIONS, PREVIEWS, ACTION_FLAVORS, EVENT_DECKS };
});
