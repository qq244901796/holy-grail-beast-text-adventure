(function (globalFactory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = globalFactory();
    } else {
        window.TextAdventureHeroicSpirits = globalFactory();
    }
})(function () {
    const SERVANT_CLASSES = ["Saber", "Archer", "Lancer", "Rider", "Caster", "Assassin", "Berserker"];

    const CLASS_PROFILES = {
        Saber: { label: "剑士", baseHp: 9, baseLoyalty: 7, manaCost: 2, coreTraits: ["对魔力", "近战压制"] },
        Archer: { label: "弓兵", baseHp: 8, baseLoyalty: 6, manaCost: 2, coreTraits: ["单独行动", "远程压制"] },
        Lancer: { label: "枪兵", baseHp: 8, baseLoyalty: 6, manaCost: 2, coreTraits: ["高速突击", "白刃战"] },
        Rider: { label: "骑兵", baseHp: 8, baseLoyalty: 6, manaCost: 2, coreTraits: ["高机动", "骑乘"] },
        Caster: { label: "术士", baseHp: 7, baseLoyalty: 6, manaCost: 3, coreTraits: ["阵地构筑", "道具作成"] },
        Assassin: { label: "暗匿者", baseHp: 7, baseLoyalty: 5, manaCost: 2, coreTraits: ["气息遮断", "暗杀"] },
        Berserker: { label: "狂战士", baseHp: 10, baseLoyalty: 5, manaCost: 4, coreTraits: ["狂化", "压制火力"] }
    };

    const SERVANT_POOLS = {
        Saber: [
            { id: "saber_altria", name: "阿尔托莉雅·潘德拉贡", title: "骑士王", noblePhantasm: "誓约胜利之剑", alignment: "秩序·善", origin: "圆桌传说", personality: "克制而正直", combatStyle: "正面决战", masterAffinity: "欣赏守序与担当", traits: ["王者", "龙因子"], introLine: "问你，你就是我的御主吗？那么，这场战争便由我来开路。" },
            { id: "saber_mordred", name: "莫德雷德", title: "叛逆骑士", noblePhantasm: "灿然辉耀的王剑", alignment: "混沌·中立", origin: "圆桌传说", personality: "急躁而骄傲", combatStyle: "爆发突进", masterAffinity: "偏好果断指挥", traits: ["反骨", "高爆发"], introLine: "哈，抽到我算你走运。别拖后腿，御主。" },
            { id: "saber_nero", name: "尼禄·克劳狄乌斯", title: "蔷薇皇帝", noblePhantasm: "童女讴歌的荣华帝政", alignment: "混沌·善", origin: "罗马帝国", personality: "华丽自信", combatStyle: "舞台压制", masterAffinity: "喜欢会赞美她的御主", traits: ["皇帝特权", "高存在感"], introLine: "余现界于此。来吧，与余一同赢下这出最华美的剧目。" },
            { id: "saber_siegfried", name: "齐格飞", title: "恶龙血铠", noblePhantasm: "幻想大剑·天魔失坠", alignment: "秩序·善", origin: "尼伯龙根之歌", personality: "沉稳寡言", combatStyle: "高耐久迎击", masterAffinity: "适合谨慎型御主", traits: ["龙杀", "高防御"], introLine: "我是齐格飞。若你有战斗的理由，我便为你挥剑。" },
            { id: "saber_musashi", name: "宫本武藏", title: "二天一流", noblePhantasm: "六道五轮·俱利伽罗天象", alignment: "混沌·善", origin: "东瀛剑豪", personality: "洒脱敏锐", combatStyle: "单点突破", masterAffinity: "适合随机应变的御主", traits: ["剑豪", "直感"], introLine: "哎呀，召唤得真漂亮。那就用我的刀，替你斩开前路吧。" },
            { id: "saber_lancelot", name: "兰斯洛特", title: "湖上骑士", noblePhantasm: "无毁的湖光", alignment: "秩序·中立", origin: "圆桌传说", personality: "严肃克己", combatStyle: "技巧压制", masterAffinity: "尊重荣誉与纪律", traits: ["骑士", "武练"], introLine: "从者，Saber。只要你的命令不辱骑士之道，我便遵从。" },
            { id: "saber_gawain", name: "高文", title: "太阳骑士", noblePhantasm: "转轮胜利之剑", alignment: "秩序·善", origin: "圆桌传说", personality: "堂堂正正", combatStyle: "日间强攻", masterAffinity: "偏好正面对抗", traits: ["太阳加护", "高续航"], introLine: "高文在此。愿圣杯战争也能遵循堂皇的秩序。" },
            { id: "saber_bedivere", name: "贝狄威尔", title: "银腕骑士", noblePhantasm: "转轮啊，卷起愤怒之光", alignment: "秩序·善", origin: "圆桌传说", personality: "忠诚温和", combatStyle: "稳健守成", masterAffinity: "适合保守御主", traits: ["忠义", "单臂战斗"], introLine: "愿我的残缺之身，仍能为你带来一份胜机。" },
            { id: "saber_rama", name: "罗摩", title: "神王子", noblePhantasm: "罗摩之弓", alignment: "秩序·善", origin: "罗摩衍那", personality: "热诚坚毅", combatStyle: "均衡压制", masterAffinity: "认可坚定信念", traits: ["英雄王子", "神性"], introLine: "我是罗摩。无论敌人是谁，我都会证明英雄应有的姿态。" },
            { id: "saber_lanling", name: "兰陵王", title: "假面名将", noblePhantasm: "兰陵王入阵曲", alignment: "秩序·善", origin: "北齐名将", personality: "温雅谦逊", combatStyle: "支援突击", masterAffinity: "适合善于统筹的御主", traits: ["美貌", "军略"], introLine: "若我的面具与剑能助你一臂之力，我将欣然从命。" },
            { id: "saber_okita", name: "冲田总司", title: "诚之旗", noblePhantasm: "无明三段突", alignment: "中立·善", origin: "新选组", personality: "爽朗却危险", combatStyle: "高速斩击", masterAffinity: "喜欢简单直接的命令", traits: ["缩地", "病弱"], introLine: "新选组一番队队长，冲田总司。来，开始肃清吧。" },
            { id: "saber_sigurd", name: "齐格鲁德", title: "北欧大英雄", noblePhantasm: "坏劫的天轮", alignment: "中立·善", origin: "北欧传说", personality: "冷静理智", combatStyle: "解析斩杀", masterAffinity: "适合高智御主", traits: ["睿智", "魔剑"], introLine: "若要胜利，就先理解战争本身。这是我的做法。" },
            { id: "saber_beni", name: "红阎魔", title: "阎雀裁定者", noblePhantasm: "十王判决·葛笼中的飨宴", alignment: "秩序·善", origin: "地狱传说", personality: "严格认真", combatStyle: "技巧封杀", masterAffinity: "偏好守规矩的御主", traits: ["裁定", "料理"], introLine: "违背规矩的家伙，阎雀会全部记下来啾。" },
            { id: "saber_hokusai", name: "葛饰北斋", title: "浮世绘剑豪", noblePhantasm: "富岳三十六景", alignment: "混沌·中立", origin: "江户奇才", personality: "古怪灵动", combatStyle: "诡变斩击", masterAffinity: "接受跳脱思路", traits: ["艺术家", "异想"], introLine: "哎，召唤也算一种构图。那就画一场大的吧。" },
            { id: "saber_charlemagne", name: "查理曼", title: "圣王", noblePhantasm: "耀于终焉之枪", alignment: "秩序·善", origin: "法兰克传说", personality: "爽朗正义", combatStyle: "高速连战", masterAffinity: "喜欢积极型御主", traits: ["领袖", "冒险心"], introLine: "很好，圣杯战争听起来就超有冒险味。一起狠狠干吧。" }
        ],
        Archer: [
            { id: "archer_gilgamesh", name: "吉尔伽美什", title: "英雄王", noblePhantasm: "王之财宝", alignment: "混沌·善", origin: "美索不达米亚", personality: "高傲绝对", combatStyle: "火力覆盖", masterAffinity: "只认可强者御主", traits: ["王者", "全武装"], introLine: "杂修，庆幸吧。能使役本王，是你最大的荣耀。" },
            { id: "archer_emiya", name: "EMIYA", title: "无名守护者", noblePhantasm: "无限剑制", alignment: "中立·中庸", origin: "未来英灵", personality: "现实理性", combatStyle: "万用对策", masterAffinity: "适合冷静判断的御主", traits: ["投影", "经验丰富"], introLine: "Archer，从召唤应答。若你还没准备好，就先学会活下去。" },
            { id: "archer_ishtar", name: "伊什塔尔", title: "天之女主人", noblePhantasm: "山脉震撼明星之薪", alignment: "混沌·善", origin: "苏美尔神话", personality: "任性高贵", combatStyle: "神性炮击", masterAffinity: "不喜欢软弱态度", traits: ["神性", "高机动"], introLine: "既然被我选中了，就别摆出那副没出息的样子。" },
            { id: "archer_arjuna", name: "阿周那", title: "授予英雄", noblePhantasm: "破坏神之手影", alignment: "秩序·善", origin: "摩诃婆罗多", personality: "端正克制", combatStyle: "高精度歼灭", masterAffinity: "偏好理想主义御主", traits: ["神授", "精准射击"], introLine: "只要你所求并非邪恶，我便会为你开弓。" },
            { id: "archer_orion", name: "超人俄里翁", title: "猎神者", noblePhantasm: "月女神之爱的嘲弄", alignment: "混沌·善", origin: "希腊神话", personality: "大而化之", combatStyle: "压制狙杀", masterAffinity: "喜欢直来直去的御主", traits: ["超人", "对神特攻"], introLine: "哈哈，交给我吧！不管是英灵还是神，我都射下来给你看。" },
            { id: "archer_napoleon", name: "拿破仑", title: "可能性之男", noblePhantasm: "光辉之路", alignment: "混沌·善", origin: "近代英雄", personality: "豪爽乐观", combatStyle: "中距离爆破", masterAffinity: "适合愿意赌一把的御主", traits: ["魅力", "破局"], introLine: "不可能？那正是本大帝开枪的理由。" },
            { id: "archer_tesla", name: "尼古拉·特斯拉", title: "电之先驱", noblePhantasm: "系统·开拓电力", alignment: "中立·善", origin: "科学史", personality: "自信偏执", combatStyle: "雷击炮台", masterAffinity: "偏好聪明御主", traits: ["科学", "文明特攻"], introLine: "好极了，让我们用智慧和雷霆改写这场战争。" },
            { id: "archer_atalanta", name: "阿塔兰忒", title: "纯洁猎人", noblePhantasm: "诉状箭书", alignment: "中立·善", origin: "希腊神话", personality: "冷静守护", combatStyle: "游击猎杀", masterAffinity: "重视善意和底线", traits: ["猎人", "守护幼子"], introLine: "我是阿塔兰忒。只要你的愿望不污浊，我的箭便会为你而鸣。" },
            { id: "archer_robin", name: "罗宾汉", title: "绿林义贼", noblePhantasm: "祈祷之弓", alignment: "中立·善", origin: "英国传说", personality: "圆滑务实", combatStyle: "毒与伏击", masterAffinity: "适合玩计策的御主", traits: ["隐匿", "毒杀"], introLine: "喂喂，别指望我像骑士那样正面冲。能赢就行，不是吗？" },
            { id: "archer_tawara", name: "俵藤太", title: "大百足讨伐者", noblePhantasm: "无尽俵", alignment: "中立·善", origin: "日本传说", personality: "豪迈可靠", combatStyle: "持久支援", masterAffinity: "适合稳重御主", traits: ["补给", "大弓"], introLine: "哈哈，既然结缘了，那我就连你的饭也一并管了。" },
            { id: "archer_nobunaga", name: "织田信长", title: "第六天魔王", noblePhantasm: "三千世界", alignment: "混沌·中立", origin: "战国史", personality: "戏谑霸道", combatStyle: "火器齐射", masterAffinity: "偏好有野心的御主", traits: ["反神秘", "支配欲"], introLine: "喔，圣杯战争啊。很好，就让天下布武从这里重新开始吧。" },
            { id: "archer_chiron", name: "喀戎", title: "贤者导师", noblePhantasm: "天蝎一射", alignment: "中立·善", origin: "希腊神话", personality: "温和理智", combatStyle: "教学式压制", masterAffinity: "适合愿意学习的御主", traits: ["导师", "百技通晓"], introLine: "我是喀戎。若你愿意成长，这场战争便不仅仅是厮杀。" },
            { id: "archer_calamity_jane", name: "灾星简", title: "银河赏金猎手", noblePhantasm: "空间流离之星", alignment: "混沌·善", origin: "宇宙开拓传说", personality: "活泼机敏", combatStyle: "高机动火力", masterAffinity: "适合灵活型御主", traits: ["好运", "快枪手"], introLine: "哟，搭档。看来我们会有一场相当刺激的旅程。" },
            { id: "archer_asvatthaman", name: "阿周那之敌", title: "不灭怒焰", noblePhantasm: "愤天业火", alignment: "混沌·中立", origin: "印度史诗", personality: "暴烈执着", combatStyle: "怒涛强压", masterAffinity: "偏好果断御主", traits: ["怒火", "不屈"], introLine: "告诉我敌人在哪。剩下的，交给我的怒火就够了。" },
            { id: "archer_moriarty", name: "詹姆斯·莫里亚蒂", title: "犯罪界的拿破仑", noblePhantasm: "终局的犯罪计划", alignment: "混沌·恶", origin: "推理小说", personality: "优雅危险", combatStyle: "陷阱狙击", masterAffinity: "适合阴谋家御主", traits: ["策谋", "反转"], introLine: "与其说你召唤了我，不如说你被我选中了，御主。" }
        ],
        Lancer: [
            { id: "lancer_cuchulainn", name: "库·丘林", title: "光之子", noblePhantasm: "刺穿死棘之枪", alignment: "中立·善", origin: "凯尔特神话", personality: "豪爽老练", combatStyle: "近身必杀", masterAffinity: "喜欢有骨气的御主", traits: ["卢恩", "不死性"], introLine: "Lancer，应召而来。先说好，别让我干无聊的活。" },
            { id: "lancer_karna", name: "迦尔纳", title: "施舍的大英雄", noblePhantasm: "日轮啊，顺从死亡", alignment: "秩序·善", origin: "印度史诗", personality: "高洁寡言", combatStyle: "神枪决杀", masterAffinity: "认可正面理想", traits: ["神性", "黄金甲"], introLine: "我是迦尔纳。若你心怀信念，我的枪便不会动摇。" },
            { id: "lancer_scathach", name: "斯卡哈", title: "影之国女王", noblePhantasm: "贯穿死翔之枪", alignment: "中立·善", origin: "凯尔特神话", personality: "冷艳沉着", combatStyle: "高速处刑", masterAffinity: "喜欢坚强御主", traits: ["魔境", "武艺极致"], introLine: "你将与我并肩走过死线。做好觉悟。" },
            { id: "lancer_enkidu", name: "恩奇都", title: "天之锁", noblePhantasm: "人子啊，紧系神明", alignment: "中立·中庸", origin: "苏美尔神话", personality: "安静纯净", combatStyle: "拘束压制", masterAffinity: "重视心性", traits: ["变容", "对神拘束"], introLine: "我是恩奇都。若这场争夺需要锁链，我便成为那锁链。" },
            { id: "lancer_brynhildr", name: "布伦希尔德", title: "战乙女", noblePhantasm: "直到死告天使", alignment: "中立·善", origin: "北欧传说", personality: "沉静偏执", combatStyle: "爱与死的刺杀", masterAffinity: "对心灵敏感", traits: ["爱之判定", "神性"], introLine: "请别离我太近，御主。我怕自己会把你也视作命运的一部分。" },
            { id: "lancer_romulus", name: "罗穆路斯", title: "开国之祖", noblePhantasm: "吾即罗马", alignment: "混沌·中立", origin: "罗马建国传说", personality: "宏大包容", combatStyle: "领域侵蚀", masterAffinity: "偏好有野心的御主", traits: ["罗马", "支配"], introLine: "我乃罗马。既然你召唤了我，你也将成为罗马的一部分。" },
            { id: "lancer_li", name: "李书文", title: "神枪无二打", noblePhantasm: "无二打", alignment: "中立·恶", origin: "近代武人", personality: "寡言冷硬", combatStyle: "一击必杀", masterAffinity: "适合干脆的御主", traits: ["武术", "贴身爆发"], introLine: "枪兵，李书文。多余的话不必说，敌人给我。" },
            { id: "lancer_parvati", name: "帕尔瓦蒂", title: "喜悦天女", noblePhantasm: "爱神之矢", alignment: "秩序·善", origin: "印度神话", personality: "温柔坚定", combatStyle: "祝福支援", masterAffinity: "喜欢善良御主", traits: ["神性", "庇护"], introLine: "愿你不被欲望吞没，御主。那样的话，我会帮助你。" },
            { id: "lancer_melusine", name: "梅柳齐娜", title: "最强妖精骑士", noblePhantasm: "无穷光年之羽", alignment: "秩序·中立", origin: "妖精圆桌", personality: "寡淡高傲", combatStyle: "超高速歼灭", masterAffinity: "适合强势御主", traits: ["龙机动", "空战"], introLine: "既然由我出战，这场战争的天际线就由我来统治。" },
            { id: "lancer_vritra", name: "弗栗多", title: "覆海魔龙", noblePhantasm: "覆世之蛇", alignment: "混沌·恶", origin: "印度神话", personality: "慵懒戏弄", combatStyle: "压迫缠斗", masterAffinity: "接受危险御主", traits: ["龙种", "灾厄"], introLine: "嗯？是你把我叫出来的吗。那就来玩点有趣的吧。" },
            { id: "lancer_eris", name: "埃列什基伽勒", title: "冥府女主人", noblePhantasm: "灵峰踏抱冥府之鞴", alignment: "混沌·善", origin: "苏美尔神话", personality: "害羞认真", combatStyle: "领域防卫", masterAffinity: "适合温和御主", traits: ["冥界", "守护"], introLine: "虽然有点紧张……但我会好好守住你的性命。" },
            { id: "lancer_valkyrie", name: "瓦尔基里", title: "量产战乙女", noblePhantasm: "终末旅者", alignment: "秩序·善", origin: "北欧神话", personality: "整齐克制", combatStyle: "集团连击", masterAffinity: "适合守序御主", traits: ["群体战", "神代兵装"], introLine: "战乙女部队已应答。请下达有效指令。" },
            { id: "lancer_nezha", name: "哪吒", title: "莲花化身", noblePhantasm: "风火轮", alignment: "混沌·善", origin: "封神演义", personality: "直率轻快", combatStyle: "高速穿刺", masterAffinity: "适合行动派御主", traits: ["机械身", "法宝"], introLine: "好耶，终于轮到我出场了。我们直接冲过去吧。" },
            { id: "lancer_fionn", name: "芬恩·麦克库尔", title: "凯尔特领袖", noblePhantasm: "无败紫靫草", alignment: "中立·善", origin: "凯尔特神话", personality: "圆熟自信", combatStyle: "统率突击", masterAffinity: "适合善用情报的御主", traits: ["军略", "预知"], introLine: "我已经看见了几条可能的胜路。你想走哪一条？" },
            { id: "lancer_percival", name: "珀西瓦尔", title: "圣枪守护者", noblePhantasm: "闪耀于终末的枪尖", alignment: "秩序·善", origin: "圆桌传说", personality: "诚恳厚重", combatStyle: "守势反击", masterAffinity: "适合责任心强的御主", traits: ["守护", "圣枪因子"], introLine: "若你愿背负愿望，我便愿替你承担最危险的前线。" }
        ],
        Rider: [
            { id: "rider_medusa", name: "美杜莎", title: "魔眼骑兵", noblePhantasm: "骑英之缰绳", alignment: "混沌·善", origin: "希腊神话", personality: "寡言冷静", combatStyle: "突袭制空", masterAffinity: "适合沉稳御主", traits: ["魔眼", "高速机动"], introLine: "Rider。只要你不命令我做无意义的事，我就会保护你。" },
            { id: "rider_iskandar", name: "伊斯坎达尔", title: "征服王", noblePhantasm: "王之军势", alignment: "中立·善", origin: "马其顿史", personality: "豪迈霸气", combatStyle: "军势压杀", masterAffinity: "喜欢有胆量的御主", traits: ["王者", "统军"], introLine: "哈哈哈！既然是圣杯战争，那便理所当然要以霸道取之！" },
            { id: "rider_ozymandias", name: "奥兹曼迪亚斯", title: "太阳王", noblePhantasm: "光辉大复合神殿", alignment: "混沌·中立", origin: "古埃及", personality: "绝对自信", combatStyle: "神殿碾压", masterAffinity: "只服从强者", traits: ["神王", "太阳"], introLine: "向余叩首吧，御主。你已站在拉美西斯王的光辉之下。" },
            { id: "rider_achilles", name: "阿喀琉斯", title: "驰骋不败", noblePhantasm: "疾风怒涛的不死战车", alignment: "混沌·中立", origin: "希腊神话", personality: "爽朗好战", combatStyle: "机动决战", masterAffinity: "适合敢赌的御主", traits: ["神速", "不死之身"], introLine: "不错嘛，能把我叫出来。那就狠狠干一场吧。" },
            { id: "rider_drake", name: "弗朗西斯·德雷克", title: "黄金鹿号船长", noblePhantasm: "黄金鹿与暴风夜", alignment: "混沌·善", origin: "大航海时代", personality: "豪放自由", combatStyle: "炮击突入", masterAffinity: "喜欢开放型御主", traits: ["海盗", "幸运"], introLine: "哟，搭档。圣杯听起来像是值大钱的宝藏啊。" },
            { id: "rider_quetzalcoatl", name: "魁札尔·科亚特尔", title: "太阳翼蛇神", noblePhantasm: "炎，燃烧吧", alignment: "善·中立", origin: "中美洲神话", personality: "热情开朗", combatStyle: "摔角神击", masterAffinity: "适合热血御主", traits: ["神性", "空中打击"], introLine: "很好！既然相遇了，就让这场战争燃烧起来吧！" },
            { id: "rider_mandricardo", name: "曼迪卡尔多", title: "无铭友人", noblePhantasm: "不完全的荣耀剑", alignment: "中立·善", origin: "骑士文学", personality: "自卑却真诚", combatStyle: "拼命应战", masterAffinity: "适合愿意信任他的御主", traits: ["逆境", "友情"], introLine: "呃……总之，我会努力的。真的会。" },
            { id: "rider_ushiwakamaru", name: "牛若丸", title: "天狗兵法", noblePhantasm: "坛之浦·八艘跳", alignment: "混沌·善", origin: "源平合战", personality: "忠诚敏捷", combatStyle: "高速切入", masterAffinity: "喜欢明快命令", traits: ["轻装高速", "忠义"], introLine: "牛若丸前来报到！请尽管向我下令吧，主公。" },
            { id: "rider_ryoma", name: "坂本龙马", title: "维新奔走者", noblePhantasm: "天逆神", alignment: "中立·善", origin: "幕末史", personality: "温和务实", combatStyle: "搭档协同", masterAffinity: "适合会沟通的御主", traits: ["龙", "交涉"], introLine: "我是坂本龙马。这位是阿龙小姐。总之，先来谈谈怎么赢吧。" },
            { id: "rider_europa", name: "欧罗巴", title: "牛之女神", noblePhantasm: "天霆奔牛", alignment: "秩序·善", origin: "希腊神话", personality: "慈爱安定", combatStyle: "稳固推进", masterAffinity: "喜欢平和型御主", traits: ["神性", "守护"], introLine: "请不用担心。只要我们彼此信赖，前方就总会有道路。" },
            { id: "rider_columbus", name: "哥伦布", title: "新大陆开拓者", noblePhantasm: "圣诞夜启航", alignment: "中立·恶", origin: "航海史", personality: "野心勃勃", combatStyle: "投机推进", masterAffinity: "偏好贪婪御主", traits: ["冒险", "投机"], introLine: "哈哈，圣杯战争？这不就是最大的未开发市场吗！" },
            { id: "rider_ivan", name: "伊凡雷帝", title: "俄之雷帝", noblePhantasm: "穿刺冲城之槌", alignment: "秩序·恶", origin: "俄国史", personality: "威严沉重", combatStyle: "重压碾碎", masterAffinity: "适合强权御主", traits: ["巨体", "皇帝"], introLine: "若你有统治世界的意志，我便为你踏碎一切。" },
            { id: "rider_martha", name: "玛尔达", title: "龙之圣女", noblePhantasm: "塔拉斯克", alignment: "秩序·善", origin: "圣人传说", personality: "温和但强硬", combatStyle: "神圣制裁", masterAffinity: "适合正派御主", traits: ["圣女", "龙镇压"], introLine: "别担心，必要的时候我会用最直接的办法解决问题。" },
            { id: "rider_taigongwang", name: "太公望", title: "封神谋主", noblePhantasm: "打神鞭", alignment: "中立·善", origin: "封神演义", personality: "悠然老练", combatStyle: "统筹决胜", masterAffinity: "适合策略御主", traits: ["仙术", "军略"], introLine: "既然是争夺圣杯，那便先争夺局势吧。" },
            { id: "rider_reines", name: "司马懿", title: "少女军师", noblePhantasm: "指挥续航战线", alignment: "中立·中庸", origin: "三国志", personality: "机灵毒舌", combatStyle: "强化支援", masterAffinity: "适合会思考的御主", traits: ["军师", "增益"], introLine: "嗯，还算能用的御主。别让我失望。" }
        ],
        Caster: [
            { id: "caster_merlin", name: "梅林", title: "花之魔术师", noblePhantasm: "永久绽放的理想乡", alignment: "中立·善", origin: "亚瑟王传说", personality: "轻浮通透", combatStyle: "持续支援", masterAffinity: "适合会做梦的御主", traits: ["幻术", "预知"], introLine: "你好呀，御主。要不要和我一起，做一个足够漂亮的梦？" },
            { id: "caster_waver", name: "诸葛孔明", title: "军师从者", noblePhantasm: "石兵八阵", alignment: "中立·善", origin: "三国志", personality: "劳碌命理智派", combatStyle: "控场支援", masterAffinity: "适合讲道理的御主", traits: ["军略", "分析"], introLine: "先声明，我可不想被奇怪的命令拖累。先把计划说清楚。" },
            { id: "caster_tamamo", name: "玉藻前", title: "良妻狐", noblePhantasm: "水天日光天照八野镇石", alignment: "中立·恶", origin: "日本传说", personality: "温柔妖艳", combatStyle: "续航术式", masterAffinity: "偏好依赖型御主", traits: ["咒术", "恢复"], introLine: "御主大人，请把一切都交给妾身吧。包括胜利也是。" },
            { id: "caster_medea", name: "美狄亚", title: "背叛魔女", noblePhantasm: "破戒应作之戒", alignment: "中立·恶", origin: "希腊神话", personality: "冷淡谨慎", combatStyle: "术式反制", masterAffinity: "适合警觉御主", traits: ["高速神言", "夺取契约"], introLine: "Caster，美狄亚。不要轻信任何人，尤其是圣杯。" },
            { id: "caster_gilles", name: "吉尔·德·雷", title: "蓝胡子", noblePhantasm: "螺湮城教本", alignment: "混沌·恶", origin: "法兰西传说", personality: "疯狂扭曲", combatStyle: "污染召唤", masterAffinity: "危险御主才可驾驭", traits: ["邪术", "狂信"], introLine: "噢，新的舞台！新的深渊！御主，让我们共同见证奇迹！" },
            { id: "caster_andersen", name: "安徒生", title: "童话作家", noblePhantasm: "人为的生命簿", alignment: "中立·中庸", origin: "文学史", personality: "毒舌认真", combatStyle: "叙事强化", masterAffinity: "适合能承受毒舌的御主", traits: ["写作", "增益"], introLine: "别高兴得太早，我只是想看看你能写出怎样的结局。" },
            { id: "caster_shakespeare", name: "莎士比亚", title: "剧作家", noblePhantasm: "开演之时已至", alignment: "中立·中庸", origin: "文学史", personality: "夸张戏剧化", combatStyle: "情绪操控", masterAffinity: "适合戏剧型御主", traits: ["演说", "舞台构筑"], introLine: "啊，多么完美的舞台！御主，请不要辜负这场剧。" },
            { id: "caster_avisbron", name: "阿维斯布隆", title: "造形者", noblePhantasm: "王冠·睿智之光", alignment: "中立·善", origin: "中世纪炼金术", personality: "寡言研究者", combatStyle: "构筑防线", masterAffinity: "适合技术流御主", traits: ["人造生命", "工房"], introLine: "素材、场地、魔力。条件尚可，足以构筑胜利。" },
            { id: "caster_circe", name: "喀耳刻", title: "变转魔女", noblePhantasm: "禁果·万猪", alignment: "混沌·中立", origin: "希腊神话", personality: "轻快任性", combatStyle: "诅咒干扰", masterAffinity: "适合不死板的御主", traits: ["变身", "诅咒"], introLine: "哼哼，既然叫到我了，就准备见识最精彩的魔女手段吧。" },
            { id: "caster_murasaki", name: "紫式部", title: "源氏物语之笔", noblePhantasm: "源氏物语·葵·物之怪", alignment: "中立·善", origin: "平安文学", personality: "温婉细腻", combatStyle: "文学咒术", masterAffinity: "适合细腻御主", traits: ["文化系", "精神干涉"], introLine: "愿这场战争，不要失去作为故事应有的余韵。" },
            { id: "caster_nitocris", name: "尼托克丽丝", title: "冥界神官王", noblePhantasm: "冥镜宝典", alignment: "中立·善", origin: "埃及传说", personality: "认真自卑", combatStyle: "即死术式", masterAffinity: "适合能给予尊重的御主", traits: ["神官", "冥界"], introLine: "余、余会努力回应你的召唤，所以请不要小看我。" },
            { id: "caster_anastasia", name: "阿纳斯塔西娅", title: "凛冬皇女", noblePhantasm: "疾走·精灵眼球", alignment: "中立·恶", origin: "近代史", personality: "冰冷高雅", combatStyle: "寒冰支配", masterAffinity: "偏好冷静御主", traits: ["寒冰", "皇女"], introLine: "既然我已经到来，那么这场战争就会被冰雪重新定义。" },
            { id: "caster_da_vinci", name: "莱昂纳多·达·芬奇", title: "万能天才", noblePhantasm: "万能之人", alignment: "中立·善", origin: "文艺复兴", personality: "洒脱天才", combatStyle: "全能支援", masterAffinity: "适合愿意尝试新思路的御主", traits: ["发明", "多面手"], introLine: "灵感很好，召唤也很好。那么，接下来让天才出手吧。" },
            { id: "caster_scheherazade", name: "山鲁佐德", title: "千夜一夜物语", noblePhantasm: "故事镇压", alignment: "中立·中庸", origin: "一千零一夜", personality: "畏死多思", combatStyle: "拖延消耗", masterAffinity: "适合谨慎御主", traits: ["讲述", "生存优先"], introLine: "只要还没迎来结局，就总会有下一夜吧……对吧？" },
            { id: "caster_misaki", name: "阿尔托莉雅·Caster", title: "预言之星", noblePhantasm: "希望之杖", alignment: "秩序·善", origin: "妖精国", personality: "明亮倔强", combatStyle: "星之加护", masterAffinity: "适合温柔御主", traits: ["星之圣剑", "成长性"], introLine: "我会成为你的力量。直到你能直面命运为止。" }
        ],
        Assassin: [
            { id: "assassin_kinghassan", name: "山中老人", title: "初代哈桑", noblePhantasm: "死告天使", alignment: "秩序·恶", origin: "暗杀教团", personality: "沉重肃穆", combatStyle: "裁决处刑", masterAffinity: "只尊敬有觉悟的御主", traits: ["即死", "威压"], introLine: "首级在前，命运在后。说吧，御主，你要谁的死。" },
            { id: "assassin_cursed_arm", name: "咒腕哈桑", title: "魔腕暗匿者", noblePhantasm: "妄想心音", alignment: "秩序·恶", origin: "暗杀教团", personality: "谦卑阴沉", combatStyle: "潜入心脏破坏", masterAffinity: "适合谨慎御主", traits: ["暗杀", "忠诚"], introLine: "我将遵命隐于黑暗之中，将敌人的心脏献上。" },
            { id: "assassin_hundredface", name: "百貌哈桑", title: "群体之影", noblePhantasm: "妄想幻像", alignment: "秩序·恶", origin: "暗杀教团", personality: "多面而不定", combatStyle: "分身侦察", masterAffinity: "适合善情报战的御主", traits: ["分身", "侦查"], introLine: "我们已经在这里了，御主。每一个角落都能成为眼睛。" },
            { id: "assassin_serenity", name: "静谧哈桑", title: "毒之少女", noblePhantasm: "妄想毒身", alignment: "中立·恶", origin: "暗杀教团", personality: "柔弱危险", combatStyle: "贴身剧毒", masterAffinity: "对温柔御主反应强烈", traits: ["毒", "悲剧"], introLine: "请、请不要害怕我……如果你能接受我，我会为你而活。" },
            { id: "assassin_jack", name: "开膛手杰克", title: "雾都之影", noblePhantasm: "解体圣母", alignment: "混沌·恶", origin: "都市怪谈", personality: "孩童般残酷", combatStyle: "夜雾猎杀", masterAffinity: "适合能控制局势的御主", traits: ["雾化", "女性特攻"], introLine: "妈妈，你能带我们回家吗？在那之前，先把敌人切开吧。" },
            { id: "assassin_semiramis", name: "塞弥拉弥斯", title: "毒之女帝", noblePhantasm: "虚荣的空中花园", alignment: "混沌·恶", origin: "亚述传说", personality: "高贵毒辣", combatStyle: "毒与城塞", masterAffinity: "适合野心御主", traits: ["毒杀", "空中要塞"], introLine: "取悦我，御主。那样我才会让你看见女帝真正的獠牙。" },
            { id: "assassin_shuten", name: "酒吞童子", title: "大江山鬼王", noblePhantasm: "千紫万红·神便鬼毒", alignment: "混沌·恶", origin: "日本鬼怪", personality: "妖艳残忍", combatStyle: "魅惑侵蚀", masterAffinity: "适合危险边缘御主", traits: ["鬼种", "魅惑"], introLine: "啊啦，召出妾身的人原来是你呀。那今晚会很热闹呢。" },
            { id: "assassin_yanqing", name: "燕青", title: "浪子豪侠", noblePhantasm: "十面埋伏·无形无影", alignment: "中立·善", origin: "水浒传", personality: "洒脱机变", combatStyle: "伪装渗透", masterAffinity: "适合灵活御主", traits: ["变装", "社交"], introLine: "哟，既然有架打，也有戏演，那我可就来劲了。" },
            { id: "assassin_li", name: "李书文·Assassin", title: "暗拳老宗师", noblePhantasm: "无二打", alignment: "中立·恶", origin: "近代武人", personality: "极简冷硬", combatStyle: "贴身秒杀", masterAffinity: "适合不废话御主", traits: ["武术", "必中一击"], introLine: "暗匿者李书文。看见我，就代表敌人已经迟了。" },
            { id: "assassin_kama", name: "迦摩", title: "爱神之魔", noblePhantasm: "爱也无边", alignment: "混沌·恶", origin: "印度神话", personality: "慵懒诱惑", combatStyle: "情欲侵蚀", masterAffinity: "容易试探御主心性", traits: ["爱神", "精神攻击"], introLine: "御主，你能抵抗我到什么程度呢？我很期待。" },
            { id: "assassin_carmilla", name: "卡米拉", title: "鲜血伯爵夫人", noblePhantasm: "铁处女", alignment: "混沌·恶", origin: "吸血传说", personality: "优雅残酷", combatStyle: "拷问处决", masterAffinity: "偏好支配型御主", traits: ["吸血", "处刑"], introLine: "请别让我太无聊，御主。无聊的结局总是最乏味。" },
            { id: "assassin_charlotte", name: "夏洛特·科黛", title: "革命匕首", noblePhantasm: "天使的尖叫", alignment: "中立·善", origin: "法国革命", personality: "温柔怯弱", combatStyle: "致命一刺", masterAffinity: "适合愿意保护她的御主", traits: ["瞬时爆发", "牺牲性"], introLine: "如果我的这把刀能替你斩开命运，我会毫不犹豫。" },
            { id: "assassin_kojiro", name: "佐佐木小次郎", title: "山门守门人", noblePhantasm: "燕返", alignment: "中立·善", origin: "剑豪传说", personality: "淡然从容", combatStyle: "极致技巧", masterAffinity: "适合享受决斗的御主", traits: ["剑术", "非正统"], introLine: "呵，没想到以这种形式再度拔刀。倒也风雅。" },
            { id: "assassin_koyanskaya", name: "光之高扬斯卡娅", title: "白面兽的秘书", noblePhantasm: "商业灭绝兵装", alignment: "混沌·恶", origin: "异闻眷属", personality: "冷酷精明", combatStyle: "现代火器狩猎", masterAffinity: "适合利益型御主", traits: ["资本", "现代兵器"], introLine: "合作愉快，御主。希望你有足够的价值让我继续投资。" },
            { id: "assassin_oldman", name: "武则天", title: "女帝暗匿者", noblePhantasm: "告密罗织经", alignment: "秩序·恶", origin: "历史皇帝", personality: "威严苛刻", combatStyle: "审讯压制", masterAffinity: "喜欢服从型御主", traits: ["帝王", "威压"], introLine: "朕既已降临，这场战争便要按朕的规矩来。" }
        ],
        Berserker: [
            { id: "berserker_heracles", name: "赫拉克勒斯", title: "大英雄", noblePhantasm: "十二试炼", alignment: "混沌·狂", origin: "希腊神话", personality: "狂化沉默", combatStyle: "不死猛攻", masterAffinity: "适合保命型御主", traits: ["十二试炼", "怪力"], introLine: "■■■■■■――！" },
            { id: "berserker_lubu", name: "吕布奉先", title: "飞将", noblePhantasm: "军神五兵", alignment: "混沌·恶", origin: "三国志", personality: "狂暴难驭", combatStyle: "骑兵突击", masterAffinity: "需要强控御主", traits: ["赤兔", "背叛风险"], introLine: "吼啊啊啊啊啊！" },
            { id: "berserker_raikou", name: "源赖光", title: "神秘退治者", noblePhantasm: "牛王招雷·天网恢恢", alignment: "混沌·善", origin: "源氏传说", personality: "母性与狂气并存", combatStyle: "雷霆歼灭", masterAffinity: "对御主保护欲极强", traits: ["源氏", "神秘杀手"], introLine: "母亲会将所有妨碍你的人，全部清除。" },
            { id: "berserker_kintoki", name: "坂田金时", title: "黄金的狂战士", noblePhantasm: "黄金冲击", alignment: "混沌·善", origin: "日本传说", personality: "豪爽直率", combatStyle: "爆发殴打", masterAffinity: "适合热血御主", traits: ["怪力", "雷电"], introLine: "来吧御主，狠狠干一票大的！" },
            { id: "berserker_cu_alter", name: "库·丘林·Alter", title: "狂王", noblePhantasm: "噬碎死牙之兽", alignment: "混沌·恶", origin: "凯尔特神话", personality: "冷酷掠食", combatStyle: "压迫猎杀", masterAffinity: "偏好能忍受恐惧的御主", traits: ["改造英雄", "恐惧支配"], introLine: "我是来杀戮的。至于你，最好证明自己值得活着。" },
            { id: "berserker_lancelot", name: "兰斯洛特·Berserker", title: "黑骑士", noblePhantasm: "骑士不徒手而亡", alignment: "混沌·狂", origin: "圆桌传说", personality: "狂化残响", combatStyle: "武器夺取", masterAffinity: "需要高魔力御主", traits: ["狂化", "武装适应"], introLine: "AAAAAAAAA——！" },
            { id: "berserker_nightingale", name: "南丁格尔", title: "白衣天使", noblePhantasm: "诉状箭书", alignment: "秩序·善", origin: "近代史", personality: "过度认真", combatStyle: "医疗强压", masterAffinity: "适合守序御主", traits: ["治疗", "矫正暴力"], introLine: "如果战争无法避免，那就先从纠正不健康的作战方式开始。" },
            { id: "berserker_hijikata", name: "土方岁三", title: "鬼之副长", noblePhantasm: "诚之旗", alignment: "中立·恶", origin: "幕末史", personality: "强硬固执", combatStyle: "濒死反扑", masterAffinity: "适合敢拼命的御主", traits: ["最后的冲锋", "士道"], introLine: "想赢，就得把命也压上。你有那个觉悟吗？" },
            { id: "berserker_morgan", name: "摩根", title: "妖妃女王", noblePhantasm: "无瑕湖光", alignment: "秩序·恶", origin: "妖精国", personality: "冷酷高位", combatStyle: "王权碾压", masterAffinity: "适合臣服型御主", traits: ["妖精", "统治"], introLine: "既呼唤了女王，就准备承担臣子的义务吧。" },
            { id: "berserker_xiangyu", name: "项羽", title: "霸王机神", noblePhantasm: "会稽零式", alignment: "中立·中庸", origin: "楚汉史诗", personality: "沉重预测", combatStyle: "演算突击", masterAffinity: "适合执行力强的御主", traits: ["未来演算", "巨躯"], introLine: "经推演，与你联手存在胜率。故应答召唤。" },
            { id: "berserker_vlad", name: "弗拉德三世", title: "穿刺公", noblePhantasm: "鲜血的传承", alignment: "秩序·恶", origin: "东欧传说", personality: "阴沉尊严", combatStyle: "阵地穿刺", masterAffinity: "适合威权御主", traits: ["穿刺", "领土战"], introLine: "若你愿给予我战场，我便会将敌人尽数钉死。" },
            { id: "berserker_atalanta", name: "阿塔兰忒·Alter", title: "兽化猎人", noblePhantasm: "野兽逻辑", alignment: "混沌·恶", origin: "希腊神话", personality: "凶猛偏执", combatStyle: "连续扑杀", masterAffinity: "不适合犹豫御主", traits: ["兽化", "高速连击"], introLine: "别试图束缚我太多，否则第一个被撕开的就是你。" },
            { id: "berserker_galatea", name: "伽拉忒亚", title: "爱之雕像", noblePhantasm: "纯白之手", alignment: "混沌·善", origin: "希腊神话", personality: "温和空灵", combatStyle: "钝重粉碎", masterAffinity: "适合包容御主", traits: ["人偶", "怪力"], introLine: "请安心，我会用这双手为你清扫敌人。" },
            { id: "berserker_beowulf", name: "贝奥武夫", title: "怪物杀手", noblePhantasm: "格伦德尔之手", alignment: "中立·善", origin: "古英语史诗", personality: "豪迈直率", combatStyle: "徒手殴杀", masterAffinity: "适合战斗派御主", traits: ["徒手格斗", "屠怪"], introLine: "不错，闻起来就是场像样的战斗。来吧！" },
            { id: "berserker_tamamo_cat", name: "玉藻猫", title: "良妻狐·猫", noblePhantasm: "炊饭气息", alignment: "混沌·善", origin: "玉藻分灵", personality: "可爱危险", combatStyle: "乱战撕咬", masterAffinity: "喜欢宠爱她的御主", traits: ["野性", "料理"], introLine: "猫咪来了喵！御主今天想吃敌人还是晚饭喵？" }
        ]
    };

    return {
        SERVANT_CLASSES,
        CLASS_PROFILES,
        SERVANT_POOLS
    };
});
