(function (globalFactory) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = globalFactory(require("./engine-data"), require("./heroic-spirits"));
    } else {
        window.TextAdventureEngine = globalFactory(window.TextAdventureData, window.TextAdventureHeroicSpirits);
    }
})(function (DATA, HEROIC_SPIRITS) {
    const { WORLD } = DATA;
    const { SERVANT_CLASSES = [], CLASS_PROFILES = {}, SERVANT_POOLS = {} } = HEROIC_SPIRITS || {};
    const BOSS_POOL = [
        { id: "beast_i", name: "Beast I", title: "\u4eba\u7406\u70e7\u5374\u4e4b\u517d", intro: "\u516d\u9a91\u9000\u573a\u540e\uff0c\u5723\u676f\u53cd\u800c\u88ab\u66f4\u6d53\u70c8\u7684\u707e\u5384\u70e7\u5f00\u3002", pressure: 8, power: 9, corruption: 7, preferredCounter: "assault" },
        { id: "beast_ii", name: "Beast II", title: "\u539f\u59cb\u751f\u547d\u4e4b\u517d", intro: "\u7075\u8109\u6df1\u5904\u6d8c\u51fa\u4e86\u53ef\u6015\u7684\u518d\u751f\u6d6a\u6f6e\uff0c\u4eff\u4f5b\u6574\u5ea7\u57ce\u5e02\u90fd\u8981\u88ab\u5176\u541e\u6ca1\u3002", pressure: 7, power: 8, corruption: 8, preferredCounter: "assault" },
        { id: "beast_iii", name: "Beast III", title: "\u6b32\u6d77\u5815\u843d\u4e4b\u517d", intro: "\u6218\u4e89\u7ed3\u675f\u7684\u7a7a\u9699\u91cc\uff0c\u66f4\u7c98\u7a20\u7684\u6076\u610f\u5f00\u59cb\u6cbf\u7740\u5951\u7ea6\u5012\u6d41\u3002", pressure: 7, power: 7, corruption: 9, preferredCounter: "seal" },
        { id: "beast_iv", name: "Beast IV", title: "\u707e\u5384\u730e\u6740\u4e4b\u517d", intro: "\u90a3\u4e1c\u897f\u6ca1\u6709\u73b0\u5f62\u524d\u7684\u5f81\u5146\uff0c\u53ea\u5728\u4f60\u610f\u8bc6\u5230\u81ea\u5df1\u88ab\u76ef\u4e0a\u65f6\u624d\u7a81\u7136\u964d\u4e34\u3002", pressure: 9, power: 8, corruption: 6, preferredCounter: "assault" },
        { id: "beast_vii", name: "Beast VII", title: "\u7ec8\u5c40\u89c2\u6d4b\u4e4b\u517d", intro: "\u5723\u676f\u6ca1\u6709\u9009\u62e9\u964d\u4e34\uff0c\u800c\u662f\u5148\u88ab\u4e00\u9053\u66f4\u9ad8\u4f4d\u7684\u76ee\u5149\u89c2\u6d4b\u4e86\u3002", pressure: 8, power: 8, corruption: 9, preferredCounter: "seal" }
    ];

    function createSession(sessionId, meta = {}) {
        const start = WORLD.locations[0] || { name: "\u51ac\u6728\u5e02", region: "city" };
        const session = {
            sessionId,
            turn: 1,
            phase: "day",
            hp: 8,
            sanity: 8,
            mana: 8,
            truth: 0,
            progress: 0,
            rift: 0,
            exposure: 0,
            enemyIntel: 0,
            defeatedServants: 0,
            playerKills: 0,
            rivalKills: 0,
            rivalBattleLog: [],
            location: start.name,
            gamePhase: "draft",
            summonCandidates: [],
            rerollCount: 0,
            maxReroll: 1,
            enemyRoster: [],
            currentScene: null,
            focusEnemyId: "",
            servant: null,
            openingProfile: null,
            warPlan: "",
            pendingChoices: [],
            boss: null,
            bossChoice: "",
            bossResult: "",
            bossDefeated: false,
            finalEscaped: false,
            log: Array.isArray(WORLD.opening) ? WORLD.opening.slice() : [],
            ended: false,
            ending: "",
            progression: { servantMastery: { ...(meta.servantMastery || {}) } },
            rng: createRng()
        };
        buildDraft(session, true);
        return session;
    }

    function getView(session) {
        hydrateSession(session);
        const nl = String.fromCharCode(10);
        if (session.ended) {
            const tail = session.log.slice(-1);
            return [
                `\u300a${WORLD.title}\u300b`,
                "",
                `\u7ed3\u5c40\uff1a${session.ending}`,
                ...tail,
                "",
                "\u672c\u5c40\u5df2\u7ecf\u7ed3\u675f\u3002\u518d\u6b21\u53d1\u9001\u201c\u5f00\u59cb\u5723\u676f\u6218\u4e89\u201d\u5373\u53ef\u5f00\u59cb\u65b0\u4e00\u5c40\u3002"
            ].filter(Boolean).join(nl);
        }
        if (session.gamePhase === "draft") {
            return [
                `\u300a${WORLD.title}\u300b \u53ec\u5524\u9636\u6bb5`,
                "",
                "\u9009\u62e9\u672c\u5c40\u4ece\u8005\u3002\u91cd\u590d\u62bd\u5230\u540c\u4e00\u540d\u4ece\u8005\u65f6\uff0c\u5b9d\u5177\u7b49\u7ea7\u4f1a\u7ee7\u627f\u6210\u957f\u3002",
                session.pendingChoices.map((c, i) => `${i + 1}. ${c.preview}`).join(nl),
                "",
                session.rerollCount < session.maxReroll ? `\u53ef\u53d1\u9001\u201c\u91cd\u62bd\u201d\uff0c\u5269\u4f59 ${session.maxReroll - session.rerollCount} \u6b21\u3002` : "\u672c\u5c40\u91cd\u62bd\u6b21\u6570\u5df2\u7528\u5b8c\u3002",
                "\u8bf7\u8f93\u5165 1-3 \u8fdb\u884c\u9009\u62e9\u3002"
            ].join(nl);
        }
        if (session.gamePhase === "strategy") {
            return [
                `\u300a${WORLD.title}\u300b \u6218\u4e89\u65b9\u9488`,
                `\u4ece\u8005\uff1a${session.servant.className} ${session.servant.name} | \u5b9d\u5177Lv.${session.servant.nobleLevel || 1} | \u7279\u6027 ${session.servant.traits.join(" / ")}`,
                "",
                `\u9009\u5b8c\u65b9\u9488\u540e\uff0c\u672c\u5c40\u4f1a\u81ea\u52a8\u63a8\u8fdb\u5e76\u76f4\u63a5\u7ed3\u7b97\u3002`,
                session.pendingChoices.map((c, i) => `${i + 1}. ${c.label}\uff1a${c.preview}`).join(nl),
                "",
                "\u9009\u5b8c\u540e\u5c06\u76f4\u63a5\u8dd1\u5b8c\u6574\u5c40\u3002"
            ].join(nl);
        }
        if (session.gamePhase === "boss_choice" && session.boss) {
            return [
                `\u300a${WORLD.title}\u300b \u7ec8\u5c40\u5f02\u53d8`,
                "",
                `\u663e\u73b0\uff1a${session.boss.name}\u00b7${session.boss.title}`,
                session.boss.intro,
                "",
                buildWarSummary(session),
                "",
                session.pendingChoices.map((c, i) => `${i + 1}. ${c.label}\uff1a${c.preview}`).join(nl),
                "",
                "\u8bf7\u8f93\u5165 1-3 \u8fdb\u884c\u6700\u7ec8\u6295\u62e9\u3002"
            ].join(nl);
        }
        return [
            `\u300a${WORLD.title}\u300b \u81ea\u52a8\u63a8\u8fdb\u4e2d`,
            session.log[session.log.length - 1] || "\u7cfb\u7edf\u6b63\u5728\u63a8\u8fdb\u6218\u5c40\u3002"
        ].join(nl);
    }

    function choose(session, rawInput) {
        hydrateSession(session);
        if (session.ended) return { ok: false, message: "\u672c\u5c40\u5df2\u7ecf\u7ed3\u675f\u3002\u518d\u6b21\u53d1\u9001\u201c\u5f00\u59cb\u5723\u676f\u6218\u4e89\u201d\u5373\u53ef\u5f00\u59cb\u65b0\u4e00\u5c40\u3002" };
        const input = String(rawInput || "").trim();
        if (session.gamePhase === "draft") {
            if (/^(?:\u91cd\u62bd|reroll)$/i.test(input)) {
                if (session.rerollCount >= session.maxReroll) return { ok: false, message: "\u672c\u5c40\u91cd\u62bd\u6b21\u6570\u5df2\u7528\u5b8c\uff0c\u8bf7\u76f4\u63a5\u5728 3 \u540d\u5019\u9009\u4e2d\u9009\u62e9\u3002" };
                session.rerollCount += 1;
                buildDraft(session, false);
                session.log.push("\u4f60\u8981\u6c42\u5723\u676f\u91cd\u65b0\u6270\u52a8\u53ec\u5524\u8f68\u8ff9\uff0c\u65b0\u7684 3 \u540d\u5019\u9009\u4ece\u8005\u5df2\u7ecf\u6d6e\u73b0\u3002");
                return { ok: true, message: getView(session), ended: false };
            }
            const idx = Number(input) - 1;
            if (!Number.isInteger(idx) || idx < 0 || idx >= session.pendingChoices.length) return { ok: false, message: "\u8bf7\u8f93\u5165 1 \u5230 3 \u4e4b\u95f4\u7684\u7f16\u53f7\uff0c\u6216\u53d1\u9001\u201c\u91cd\u62bd\u201d\u3002" };
            lockServant(session, idx);
            setupStrategyChoice(session);
            return { ok: true, message: getView(session), ended: false };
        }
        if (session.gamePhase === "strategy") {
            const idx = Number(input) - 1;
            if (!Number.isInteger(idx) || idx < 0 || idx >= session.pendingChoices.length) return { ok: false, message: "\u8bf7\u8f93\u5165 1 \u5230 3 \u4e4b\u95f4\u7684\u7f16\u53f7\uff0c\u9009\u5b9a\u4f60\u7684\u603b\u4f53\u6218\u4e89\u65b9\u9488\u3002" };
            const choice = session.pendingChoices[idx];
            session.warPlan = choice.id;
            session.pendingChoices = [];
            session.gamePhase = "auto";
            session.log.push(`\u4f60\u5b9a\u4e0b\u4e86\u6218\u4e89\u65b9\u9488\u3010${choice.label}\u3011\u3002\u6218\u5c40\u5f00\u59cb\u5feb\u901f\u6536\u675f\u3002`);
            autoAdvance(session);
            return { ok: true, message: getView(session), ended: session.ended };
        }
        if (session.gamePhase === "boss_choice") {
            const idx = Number(input) - 1;
            if (!Number.isInteger(idx) || idx < 0 || idx >= session.pendingChoices.length) return { ok: false, message: "\u8bf7\u8f93\u5165 1 \u5230 3 \u4e4b\u95f4\u7684\u7f16\u53f7\uff0c\u51b3\u5b9a\u5982\u4f55\u9762\u5bf9\u7ec8\u5c40\u5f02\u53d8\u3002" };
            const choice = session.pendingChoices[idx];
            resolveBoss(session, choice.id);
            return { ok: true, message: getView(session), ended: session.ended };
        }
        return { ok: false, message: "\u5f53\u524d\u6ca1\u6709\u53ef\u64cd\u4f5c\u7684\u4e3b\u6295\u62e9\uff0c\u6218\u5c40\u6b63\u5728\u81ea\u52a8\u63a8\u8fdb\u3002" };
    }

    function hydrateSession(session) {
        if (!Array.isArray(session.summonCandidates)) session.summonCandidates = [];
        if (!Array.isArray(session.enemyRoster)) session.enemyRoster = [];
        if (!Array.isArray(session.pendingChoices)) session.pendingChoices = [];
        if (!Array.isArray(session.log)) session.log = [];
        if (!Array.isArray(session.rivalBattleLog)) session.rivalBattleLog = [];
        if (!session.progression || typeof session.progression !== "object") session.progression = { servantMastery: {} };
        if (!session.progression.servantMastery || typeof session.progression.servantMastery !== "object") session.progression.servantMastery = {};
        if (!session.gamePhase) session.gamePhase = session.servant ? "strategy" : "draft";
        if (typeof session.rerollCount !== "number") session.rerollCount = 0;
        if (typeof session.maxReroll !== "number") session.maxReroll = 1;
        if (typeof session.focusEnemyId !== "string") session.focusEnemyId = "";
        if (typeof session.warPlan !== "string") session.warPlan = "";
        if (typeof session.playerKills !== "number") session.playerKills = 0;
        if (typeof session.rivalKills !== "number") session.rivalKills = 0;
        if (!session.boss || typeof session.boss !== "object") session.boss = null;
        if (typeof session.bossChoice !== "string") session.bossChoice = "";
        if (typeof session.bossResult !== "string") session.bossResult = "";
        if (typeof session.bossDefeated !== "boolean") session.bossDefeated = false;
        if (typeof session.finalEscaped !== "boolean") session.finalEscaped = false;
        session.enemyRoster.forEach(ensureEnemyState);
        if (!session.pendingChoices.length && !session.ended) {
            if (session.gamePhase === "draft") buildDraft(session, false);
            else if (session.gamePhase === "strategy") setupStrategyChoice(session);
            else if (session.gamePhase === "boss_choice" && session.boss) setupBossChoice(session);
        }
    }

    function buildDraft(session, firstTime) {
        session.summonCandidates = uniqueCandidates(session.rng, 3);
        session.pendingChoices = session.summonCandidates.map((servant, index) => {
            const nobleLevel = masteryLevel(session, servant.id);
            return {
                id: `draft_${index}`,
                label: `${servant.className} / ${servant.name}`,
                preview: `${servant.title}｜宝具Lv.${nobleLevel}【${servant.noblePhantasm}】｜${servant.traits.join("/")}`,
                index
            };
        });
        if (firstTime) session.log.push("圣杯开始筛选本届战争的响应者。三道召唤光柱在你眼前展开。");
    }

    function lockServant(session, index) {
        session.servant = session.summonCandidates[index];
        session.servant.nobleLevel = masteryLevel(session, session.servant.id);
        session.openingProfile = openingProfile(session.servant);
        applyOpeningBonus(session);
        session.enemyRoster = SERVANT_CLASSES.filter((c) => c !== session.servant.className).map((className) => {
            const enemy = summonServantFromClass(className, session.rng, session.servant.id);
            enemy.defeated = false;
            enemy.encountered = false;
            enemy.hp = clamp(enemy.hp + 1, 4, 12);
            enemy.hunt = 0;
            enemy.revealed = false;
            enemy.battleCount = 0;
            enemy.storyStage = "unknown";
            enemy.killedBy = "";
            enemy.killedByType = "";
            enemy.rivalPressure = 0;
            return enemy;
        });
        session.focusEnemyId = "";
        session.gamePhase = "strategy";
        session.pendingChoices = [];
        session.log.push(`召唤完成。现界的是 ${session.servant.className} / ${session.servant.name}。当前宝具等级为 Lv.${session.servant.nobleLevel}。${session.servant.introLine}`);
        session.log.push(`其余六骑已经现界：${session.enemyRoster.map((e) => `${e.className} ${e.name}`).join("、")}。`);
    }

    function setupStrategyChoice(session) {
        session.gamePhase = "strategy";
        session.pendingChoices = [
            { id: "aggressive", label: "激进推进", preview: "优先逼战，以最快速度扫掉敌骑。" },
            { id: "balanced", label: "稳健推进", preview: "攻防平衡，尽量在生存与击破之间取中间值。" },
            { id: "cautious", label: "谨慎经营", preview: "先保住状态再收尾，尽量拿到更干净的通关。" }
        ];
    }

    function setupClimaxChoice(session) {
        session.gamePhase = "auto";
        session.pendingChoices = [];
    }

    function rollBoss(session) {
        const boss = { ...pick(BOSS_POOL, session.rng) };
        session.boss = boss;
        return boss;
    }

    function setupBossChoice(session) {
        if (!session.boss) rollBoss(session);
        session.gamePhase = "boss_choice";
        session.pendingChoices = [
            { id: "assault", label: "\u6b63\u9762\u8ba8\u4f10", preview: bossOptionPreview(session, "assault") },
            { id: "seal", label: "\u538b\u5236\u5723\u676f", preview: bossOptionPreview(session, "seal") },
            { id: "withdraw", label: "\u7acb\u523b\u64a4\u79bb", preview: bossOptionPreview(session, "withdraw") }
        ];
    }

    function offenseScore(session) {
        const servant = session.servant || { hp: 0, loyalty: 0, nobleLevel: 1 };
        return servant.hp * 1.2 + servant.loyalty * 0.8 + (servant.nobleLevel || 1) * 1.5 + session.mana * 0.9 + session.hp * 0.5;
    }

    function controlScore(session) {
        return session.truth * 1.3 + session.enemyIntel * 1.0 + session.sanity * 0.9 - session.rift * 0.8;
    }

    function survivalScore(session) {
        const servant = session.servant || { hp: 0, loyalty: 0 };
        return session.hp * 1.0 + servant.hp * 0.8 + session.sanity * 0.7 + servant.loyalty * 0.4;
    }

    function bossDifficulty(session, boss) {
        return boss.power * 1.4 + boss.pressure * 1.1 + boss.corruption * 1.2 + session.rng() * 2.6;
    }

    function bossClassBonus(session, boss, choiceId) {
        const servant = session.servant || {};
        let score = 0;
        if (choiceId === boss.preferredCounter) score += 2.0;
        if (choiceId === "assault" && ["Saber", "Lancer", "Archer"].includes(servant.className) && boss.id === "beast_i") score += 0.9;
        if (choiceId === "seal" && servant.className === "Caster" && ["beast_iii", "beast_vii"].includes(boss.id)) score += 1.1;
        if (choiceId === "withdraw" && servant.className === "Assassin" && boss.id === "beast_iv") score += 1.0;
        if (choiceId === "assault" && servant.className === "Berserker") score += 1.1;
        if (choiceId === "assault" && servant.className === "Berserker") score -= 0.5 * Math.max(0, 6 - session.sanity);
        if (hasServantTrait(servant, "\u9f99\u6740") && boss.id === "beast_ii") score += 0.7;
        if (hasServantTrait(servant, "\u5bf9\u9b54\u529b") && ["beast_iii", "beast_vii"].includes(boss.id)) score += 0.5;
        if (hasServantTrait(servant, "\u9ad8\u9632\u5fa1") && ["beast_ii", "beast_iv"].includes(boss.id)) score += 0.45;
        return score;
    }

    function bossTitleLine(session) {
        return session.boss ? `\u7ec8\u5c40\u5bf9\u8c61\uff1a${session.boss.name}\u00b7${session.boss.title}` : "";
    }

    function buildWarSummary(session) {
        const stats = `\u516d\u9a91\u7ed3\u7b97\uff1a\u4f60\u65b9\u51fb\u6740 ${session.playerKills} \u9a91\uff0c\u654c\u9a91\u4e92\u6597\u6dd8\u6c70 ${session.rivalKills} \u9a91\u3002`;
        const relations = killRelationSummary(session);
        return relations ? `${stats}\n\u51fb\u6740\u5173\u7cfb\uff1a\n${relations}` : stats;
    }

    function bossOptionPreview(session, choiceId) {
        const servant = session.servant || { name: "\u4f60\u7684\u4ece\u8005", className: "Saber" };
        const byClass = {
            Saber: {
                assault: `${servant.name} \u5df2\u7ecf\u9876\u4e0a\u524d\u7ebf\uff0c\u4f60\u51c6\u5907\u628a\u6700\u540e\u4e00\u51fb\u76f4\u63a5\u538b\u5230\u5f02\u53d8\u6838\u5fc3\u3002`,
                seal: `\u4f60\u8d81 ${servant.name} \u538b\u4f4f\u6b63\u9762\u7684\u77ac\u95f4\uff0c\u51c6\u5907\u5c06\u5723\u676f\u5f02\u53d8\u5f3a\u884c\u538b\u56de\u6b63\u5e38\u3002`,
                withdraw: `${servant.name} \u4f1a\u66ff\u4f60\u65ad\u540e\uff0c\u4f60\u51c6\u5907\u5c31\u6b64\u62bd\u8eab\uff0c\u4e0d\u518d\u7ee7\u7eed\u8ffd\u7d22\u8fd9\u573a\u7ec8\u5c40\u3002`
            },
            Archer: {
                assault: `${servant.name} \u5df2\u7ecf\u9501\u5b9a\u6700\u8584\u7684\u90a3\u4e00\u70b9\uff0c\u4f60\u51c6\u5907\u8ba9\u8fd9\u4e00\u51fb\u8d2f\u7a7f\u5f02\u53d8\u6838\u5fc3\u3002`,
                seal: `${servant.name} \u66ff\u4f60\u62c9\u5f00\u4e86\u5916\u4fa7\u538b\u529b\uff0c\u4f60\u51c6\u5907\u76f4\u63a5\u628a\u5723\u676f\u5f02\u53d8\u538b\u56de\u53bb\u3002`,
                withdraw: `${servant.name} \u80fd\u7ee7\u7eed\u62c9\u5f00\u8ddd\u79bb\uff0c\u4f60\u51c6\u5907\u501f\u8fd9\u4e2a\u7a97\u53e3\u76f4\u63a5\u8131\u79bb\u3002`
            },
            Lancer: {
                assault: `${servant.name} \u5df2\u7ecf\u62a2\u5230\u4e86\u6700\u540e\u51b2\u7ebf\u7684\u8ddd\u79bb\uff0c\u4f60\u51c6\u5907\u76f4\u63a5\u523a\u7a7f\u5f02\u53d8\u6838\u5fc3\u3002`,
                seal: `${servant.name} \u66ff\u4f60\u538b\u4f4f\u5f02\u53d8\u524d\u6cbf\uff0c\u4f60\u51c6\u5907\u5148\u628a\u5723\u676f\u5c01\u56de\u53bb\u3002`,
                withdraw: `${servant.name} \u5df2\u7ecf\u6495\u5f00\u4e86\u9000\u8def\uff0c\u4f60\u51c6\u5907\u5c31\u6b64\u8131\u79bb\u7ec8\u5c40\u533a\u57df\u3002`
            },
            Rider: {
                assault: `${servant.name} \u5df2\u628a\u6218\u573a\u901f\u5ea6\u62c9\u5230\u6781\u9650\uff0c\u4f60\u51c6\u5907\u8d81\u8fd9\u4e00\u6ce2\u76f4\u63a5\u649e\u788e\u7ec8\u5c40\u3002`,
                seal: `${servant.name} \u6b63\u5728\u6253\u4e71\u5f02\u53d8\u5916\u5c42\uff0c\u4f60\u51c6\u5907\u501f\u673a\u628a\u5723\u676f\u538b\u56de\u539f\u4f4d\u3002`,
                withdraw: `${servant.name} \u5df2\u7ecf\u7ed9\u4f60\u7a7a\u51fa\u4e86\u8def\uff0c\u4f60\u51c6\u5907\u4e0d\u518d\u505c\u7559\uff0c\u7acb\u523b\u9000\u51fa\u3002`
            },
            Caster: {
                assault: `${servant.name} \u5df2\u7ecf\u628a\u6240\u6709\u672f\u5f0f\u538b\u5411\u4e00\u70b9\uff0c\u4f60\u51c6\u5907\u8d4c\u8fd9\u4e00\u51fb\u76f4\u63a5\u51fb\u7a7f\u3002`,
                seal: `${servant.name} \u5df2\u7ecf\u627e\u5230\u4e86\u5f02\u53d8\u7ed3\u6784\u7684\u8282\u70b9\uff0c\u4f60\u51c6\u5907\u5c31\u6b64\u628a\u5723\u676f\u538b\u56de\u6b63\u8f68\u3002`,
                withdraw: `${servant.name} \u80fd\u7ed9\u4f60\u6253\u5f00\u77ed\u6682\u7a97\u53e3\uff0c\u4f60\u51c6\u5907\u5148\u5e26\u7740\u4ed6\u9000\u51fa\u8fd9\u91cc\u3002`
            },
            Assassin: {
                assault: `${servant.name} \u5df2\u7ecf\u627e\u5230\u4e86\u90a3\u9053\u6700\u8584\u7684\u7f3a\u53e3\uff0c\u4f60\u51c6\u5907\u76f4\u63a5\u5207\u65ad\u5f02\u53d8\u6838\u5fc3\u3002`,
                seal: `${servant.name} \u6b63\u4ece\u6697\u5904\u7275\u5236\u5f02\u53d8\uff0c\u4f60\u51c6\u5907\u8d81\u4e71\u628a\u5723\u676f\u91cd\u65b0\u538b\u56de\u5e95\u5c42\u3002`,
                withdraw: `${servant.name} \u6700\u9002\u5408\u65e0\u58f0\u8131\u8eab\uff0c\u4f60\u51c6\u5907\u5c31\u6b64\u6298\u8fd4\uff0c\u4e0d\u518d\u7ea0\u7f20\u3002`
            },
            Berserker: {
                assault: `${servant.name} \u5df2\u7ecf\u628a\u72c2\u6027\u538b\u5230\u6700\u540e\u4e00\u51fb\u91cc\uff0c\u4f60\u51c6\u5907\u5c31\u5728\u8fd9\u91cc\u5206\u51fa\u80dc\u8d1f\u3002`,
                seal: `${servant.name} \u8fd8\u5728\u524d\u9762\u786c\u625b\u538b\u529b\uff0c\u4f60\u51c6\u5907\u501f\u8fd9\u77ac\u95f4\u5148\u5c01\u4f4f\u5723\u676f\u3002`,
                withdraw: `${servant.name} \u8fd8\u80fd\u66ff\u4f60\u6740\u5f00\u4e00\u6761\u8def\uff0c\u4f60\u51c6\u5907\u5c31\u6b64\u6536\u624b\uff0c\u5148\u9000\u51fa\u53bb\u3002`
            }
        };
        const table = byClass[servant.className] || byClass.Saber;
        return table[choiceId];
    }

    function resolveBoss(session, choiceId) {
        const boss = session.boss || rollBoss(session);
        session.bossChoice = choiceId;
        session.pendingChoices = [];
        session.gamePhase = "boss_resolution";
        const servant = session.servant;
        const bossLine = bossTitleLine(session);
        if (choiceId === "withdraw") {
            const escapeScore = session.hp * 1.0 + servant.hp * 0.8 + session.enemyIntel * 0.7 + session.sanity * 0.6 - boss.pressure * 0.8 - session.rift * 0.5 + bossClassBonus(session, boss, choiceId);
            session.finalEscaped = escapeScore >= 4;
            session.ended = true;
            if (escapeScore >= 8) {
                session.bossResult = "withdraw_clean";
                session.ending = `\u4f60\u5728\u516d\u9a91\u5c3d\u706d\u540e\u9009\u62e9\u653e\u5f03\u8ffd\u9010\u66f4\u6df1\u5904\u7684\u707e\u5384\u3002\u80dc\u56e0\u662f\u4f60\u53ca\u65f6\u5224\u65ad\u51fa\u8fd9\u4e0d\u662f\u8be5\u786c\u78b0\u7684\u7ec8\u5c40\uff0c\u4e8e\u662f\u5e26\u7740 ${servant.name} \u6210\u529f\u64a4\u79bb\u4e86\u5f02\u53d8\u4e2d\u5fc3\u3002${bossLine ? `\n${bossLine}` : ""}`;
                session.log.push(`\u4f60\u62d2\u7edd\u4e0e ${boss.name} \u6b63\u9762\u63a5\u89e6\uff0c\u5e26\u7740 ${servant.name} \u679c\u65ad\u8131\u79bb\u4e86\u7ec8\u5c40\u5f02\u53d8\u3002`);
                return;
            }
            if (escapeScore >= 4) {
                session.bossResult = "withdraw_bloodied";
                session.ending = `\u4f60\u6ca1\u6709\u7ee7\u7eed\u6311\u6218 ${boss.name}\uff0c\u800c\u662f\u5e26\u7740 ${servant.name} \u5f3a\u884c\u64a4\u79bb\u3002\u7ed3\u679c\u662f\u4f60\u4eec\u867d\u7136\u6d3b\u4e86\u4e0b\u6765\uff0c\u5374\u518d\u4e5f\u65e0\u6cd5\u5047\u88c5\u8fd9\u573a\u6218\u4e89\u771f\u7684\u7ed3\u675f\u5f97\u5f88\u5e72\u51c0\u3002${bossLine ? `\n${bossLine}` : ""}`;
                session.log.push(`\u4f60\u4eec\u9876\u7740 ${boss.name} \u6ea2\u51fa\u7684\u538b\u529b\u64a4\u79bb\uff0c\u6700\u7ec8\u5e26\u4f24\u9003\u51fa\u4e86\u7ec8\u5c40\u533a\u57df\u3002`);
                return;
            }
            session.bossResult = "withdraw_fail";
            session.ending = `\u4f60\u8bd5\u56fe\u5728 ${boss.name} \u5b8c\u5168\u663e\u73b0\u524d\u62bd\u8eab\uff0c\u5374\u8fd8\u662f\u6162\u4e86\u4e00\u6b65\u3002\u8d25\u56e0\u662f\u4f60\u4eec\u5728\u64a4\u79bb\u9014\u4e2d\u88ab\u7ec8\u5c40\u5f02\u53d8\u53cd\u54ac\uff0c\u6700\u7ec8\u6ca1\u80fd\u771f\u6b63\u79bb\u5f00\u3002${bossLine ? `\n${bossLine}` : ""}`;
            session.log.push(`\u4f60\u8bd5\u56fe\u9000\u51fa\u7ec8\u5c40\u5f02\u53d8\uff0c\u5374\u88ab ${boss.name} \u7684\u4f59\u6ce2\u62d6\u4e86\u56de\u53bb\u3002`);
            return;
        }

        const offense = offenseScore(session);
        const control = controlScore(session);
        const survival = survivalScore(session);
        let playerScore = 0;
        if (choiceId === "assault") {
            playerScore = offense * 1.4 + survival * 0.5 + control * 0.3 + bossClassBonus(session, boss, choiceId);
            if (session.warPlan === "aggressive") playerScore += 1.2;
            if (session.rift >= 5) playerScore -= 1.5;
        } else {
            playerScore = control * 1.5 + survival * 0.6 + offense * 0.2 + bossClassBonus(session, boss, choiceId);
            if (session.warPlan === "cautious") playerScore += 1.2;
            if (session.truth >= 5) playerScore += 1.0;
        }
        const diff = playerScore - bossDifficulty(session, boss);
        session.ended = true;
        if (diff >= 4) {
            session.bossDefeated = true;
            session.bossResult = choiceId === "seal" ? "seal_clean" : "assault_clean";
            session.ending = `\u4f60\u4e0e ${servant.name} \u6700\u7ec8\u538b\u8fc7\u4e86 ${boss.name} \u7684\u663e\u73b0\u3002\u80dc\u56e0\u662f\u4f60\u4eec\u628a\u524d\u534a\u5c40\u79ef\u7d2f\u7684\u4f18\u52bf\u5168\u90e8\u5151\u73b0\uff0c\u5728\u7ec8\u5c40\u5f02\u53d8\u5f7b\u5e95\u6210\u578b\u524d\u5b8c\u6210\u4e86\u8ba8\u4f10\u3002${bossLine ? `\n${bossLine}` : ""}`;
            session.log.push(`${servant.name} \u5728\u7ec8\u5c40\u4e00\u51fb\u4e2d\u538b\u788e\u4e86 ${boss.name} \u7684\u6838\u5fc3\u3002`);
            return;
        }
        if (diff >= 1.5) {
            session.bossDefeated = true;
            session.bossResult = choiceId === "seal" ? "seal_costly" : "assault_costly";
            servant.hp = clamp(servant.hp - 3, 0, 12);
            session.hp = clamp(session.hp - 2, 0, 10);
            session.ending = `\u4f60\u4eec\u786e\u5b9e\u6321\u4f4f\u4e86 ${boss.name}\uff0c\u4f46\u4ee3\u4ef7\u6c89\u91cd\u3002\u80dc\u56e0\u662f ${servant.name} \u5728\u6781\u9650\u72b6\u6001\u4e0b\u4ecd\u628a\u7ec8\u5c40\u63a8\u5230\u4e86\u4f60\u8fd9\u8fb9\uff1b\u4ee3\u4ef7\u662f\u8fd9\u573a\u80dc\u5229\u51e0\u4e4e\u628a\u4e3b\u4ece\u90fd\u70e7\u7a7a\u3002${bossLine ? `\n${bossLine}` : ""}`;
            session.log.push(`\u4f60\u4eec\u4ee5\u60e8\u91cd\u4ee3\u4ef7\u538b\u5236\u4e86 ${boss.name}\uff0c\u7ec8\u5c40\u6700\u7ec8\u8fd8\u662f\u88ab\u4f60\u4eec\u62ff\u4e0b\u3002`);
            return;
        }
        if (diff >= -1) {
            session.bossResult = choiceId === "seal" ? "seal_edge" : "assault_edge";
            session.ending = `\u4f60\u6ca1\u80fd\u5f7b\u5e95\u6d88\u706d ${boss.name}\uff0c\u4f46\u8fd8\u662f\u628a\u5b83\u91cd\u65b0\u538b\u56de\u4e86\u5723\u676f\u5f02\u53d8\u6df1\u5904\u3002\u7ed3\u679c\u4e0d\u7b97\u5b8c\u7f8e\uff0c\u53ef\u8fd9\u5df2\u7ecf\u8db3\u591f\u8ba9\u57ce\u5e02\u4ece\u7ec8\u5c40\u5d29\u574f\u91cc\u5e78\u5b58\u4e0b\u6765\u3002${bossLine ? `\n${bossLine}` : ""}`;
            session.log.push(`\u4f60\u4eec\u6ca1\u80fd\u5b8c\u5168\u51fb\u5760 ${boss.name}\uff0c\u4f46\u8fd8\u662f\u52c9\u5f3a\u5c01\u4f4f\u4e86\u7ec8\u5c40\u5f02\u53d8\u3002`);
            return;
        }
        if (diff > -4) {
            session.bossResult = "boss_fail";
            session.ending = `\u4f60\u6491\u5230\u4e86\u516d\u9a91\u5c3d\u706d\uff0c\u5374\u6ca1\u80fd\u8de8\u8fc7\u6700\u540e\u8fd9\u9053\u7ec8\u5c40\u5f02\u53d8\u3002\u8d25\u56e0\u662f ${boss.name} \u5f7b\u5e95\u538b\u8fc7\u4e86\u4f60\u4eec\u5728\u524d\u534a\u5c40\u7d2f\u79ef\u7684\u4e00\u5207\u4f18\u52bf\u3002${bossLine ? `\n${bossLine}` : ""}`;
            session.log.push(`${boss.name} \u5728\u7ec8\u5c40\u5bf9\u649e\u91cc\u53cd\u8fc7\u6765\u541e\u6389\u4e86\u4f60\u4eec\u7684\u8282\u594f\u3002`);
            return;
        }
        session.bossResult = "boss_crushed";
        session.ending = `\u4f60\u4ee5\u4e3a\u516d\u9a91\u9000\u573a\u540e\u6218\u4e89\u5c31\u8be5\u7ed3\u675f\uff0c\u771f\u6b63\u7b49\u5728\u6700\u540e\u7684\u5374\u662f ${boss.name}\u3002\u8d25\u56e0\u662f\u4f60\u4e0e ${servant.name} \u88ab\u8fd9\u573a\u7ec8\u5c40\u5f02\u53d8\u5f53\u573a\u541e\u6ca1\uff0c\u8fde\u64a4\u56de\u4e00\u6b65\u7684\u4f59\u5730\u90fd\u6ca1\u6709\u3002${bossLine ? `\n${bossLine}` : ""}`;
        session.log.push(`\u4f60\u4eec\u88ab ${boss.name} \u7684\u663e\u73b0\u6b63\u9762\u78be\u788e\uff0c\u7ec8\u5c40\u5c31\u6b64\u5c01\u6b7b\u3002`);
    }

    function autoAdvance(session) {
        let safety = 0;
        while (!session.ended && safety < 28 && session.gamePhase === "auto") {
            safety += 1;
            prepareScene(session);
            const option = pickAutoOption(session);
            const text = session.currentScene.type === "battle" ? resolveBattle(session, option) : resolveStory(session, option);
            session.log.push(`\u7b2c ${session.turn} \u56de\u5408\u3010${session.currentScene.label}\u3011\uff1a${text}`);
            if (checkEnding(session)) return;
            simulateRivalConflict(session);
            if (checkEnding(session)) return;
            if (session.phase === "day") session.phase = "night";
            else {
                session.phase = "day";
                session.turn += 1;
            }
        }
        if (!session.ended && session.gamePhase === "boss_choice") return;
        if (!session.ended) {
            session.ended = true;
            session.ending = buildFinalEnding(session);
        }
    }

    function pickAutoOption(session) {
        const scene = session.currentScene;
        const plan = session.warPlan || "balanced";
        if (scene.type === "battle") {
            if (plan === "aggressive") return scene.options.find((o) => o.id === "assault") || scene.options[0];
            if (plan === "cautious") return scene.options.find((o) => o.id === "probe") || scene.options[0];
            return session.hp <= 4 ? scene.options.find((o) => o.id === "probe") || scene.options[0] : scene.options[0];
        }
        if (scene.subType === "rest") return plan === "aggressive" ? scene.options.find((o) => o.id === "bond") || scene.options[0] : scene.options[0];
        if (scene.subType === "reward") return plan === "cautious" ? scene.options.find((o) => o.id === "talk") || scene.options[0] : scene.options[0];
        return plan === "aggressive" ? scene.options.find((o) => o.id === "gamble") || scene.options[0] : scene.options[0];
    }

    function prepareScene(session) {
        const pool = WORLD.locations && WORLD.locations.length ? WORLD.locations : [{ name: "冬木市" }];
        const loc = pick(pool, session.rng);
        session.location = loc.name;
        session.enemyRoster.forEach(ensureEnemyState);
        const live = session.enemyRoster.filter((e) => !e.defeated);
        const focus = pickFocusEnemy(session, live);
        const forceBattle = Boolean(focus && (focus.revealed || focus.hunt >= 1 || session.turn >= 4));
        if (forceBattle) {
            focus.encountered = true;
            focus.battleCount += 1;
            session.currentScene = buildBattleScene(session, focus);
        } else {
            session.currentScene = buildStoryScene(session, focus || pick(live, session.rng));
        }
    }

    function resolveStory(session, option) {
        const rate = storyRate(session, option.id);
        const success = session.rng() <= rate;
        const scene = session.currentScene.subType;
        const enemy = session.enemyRoster.find((item) => item.id === session.currentScene.enemyId) || null;
        let text = "";

        if (scene === "rest") {
            if (success) {
                applyDelta(session, { hp: 1, sanity: 1, mana: 2 });
                if (session.servant) session.servant.hp = clamp(session.servant.hp + 1, 0, 12);
                text = option.id === "bond"
                    ? `你与 ${session.servant.name} 在短暂平静里重新对齐了目标。对接下来的目标、敌情与底线，你们第一次说得足够清楚，下一步要追的正是【${enemy ? enemy.name : "敌方从者"}】。`
                    : `你强行让自己退出持续高压，补足了魔力与体力，也为接下来追踪【${enemy ? enemy.name : "敌方从者"}】留出了余力。`;
            } else {
                applyDelta(session, { sanity: -1, mana: -1 });
                text = `你本想借空档稳住状态，却始终摆脱不了【${enemy ? enemy.name : "敌方从者"}】留下的压力。休整没有真正完成。`;
            }
        } else if (scene === "reward") {
            if (success) {
                applyDelta(session, { truth: 1, enemyIntel: 1, progress: 1 });
                if (enemy) {
                    enemy.hunt += 1;
                    enemy.storyStage = enemy.hunt >= 2 ? "locked" : "traced";
                    if (enemy.hunt >= 2) enemy.revealed = true;
                }
                text = option.id === "talk"
                    ? `你成功从相关者口中撬开了消息。对方没有完全倒向你，但已经留下了足以指向【${enemy ? enemy.name : "敌方从者"}】的情报。`
                    : `你顺着异常痕迹一路追下去，终于确认【${enemy ? enemy.name : "敌方从者"}】近期就在这一带活动。距离真正逼出对方，只差最后一步。`;
            } else {
                applyDelta(session, { exposure: 1 });
                if (enemy) enemy.hunt = Math.max(0, enemy.hunt - 1);
                text = `你意识到这是个机会时已经慢了一步，关于【${enemy ? enemy.name : "敌方从者"}】的线索先一步散掉了。`;
            }
        } else {
            if (success) {
                applyDelta(session, { enemyIntel: 1, progress: 1 });
                if (enemy) {
                    enemy.hunt += option.id === "gamble" ? 2 : 1;
                    enemy.storyStage = enemy.hunt >= 2 ? "locked" : "traced";
                    if (enemy.hunt >= 2) enemy.revealed = true;
                }
                text = option.id === "gamble"
                    ? `你没有等危险继续发酵，而是抢先一步拆掉了阻碍。代价不小，但你也因此逼近了【${enemy ? enemy.name : "敌方从者"}】的真实位置。`
                    : `你先处理掉眼前的恶意与陷阱，再把残留痕迹一点点对回去。最后浮出水面的，正是【${enemy ? enemy.name : "敌方从者"}】的行动轨迹。`;
            } else {
                applyDelta(session, { hp: -1, sanity: -1, exposure: 1, rift: 1 });
                if (enemy) enemy.hunt = Math.max(0, enemy.hunt - 1);
                text = `你终究还是慢了一拍。对方留下的后手先一步咬了上来，关于【${enemy ? enemy.name : "敌方从者"}】的追踪也被迫中断。`;
            }
        }

        if (enemy && enemy.hunt >= 2) {
            enemy.revealed = true;
            session.focusEnemyId = enemy.id;
            text += ` 你已经基本锁定了【${enemy.name}】的据点与行动习惯，下次再逼近，多半就是正式交战。`;
        }
        if (option.id === "bond" && session.servant) session.servant.loyalty = clamp(session.servant.loyalty + (success ? 1 : -1), 1, 10);
        return text;
    }

    function simulateRivalConflict(session) {
        const live = session.enemyRoster.filter((enemy) => !enemy.defeated);
        if (live.length < 2) return;
        const chance = session.turn <= 2 ? 0.45 : 0.62;
        if (session.rng() > chance) return;

        const sorted = live.slice().sort((a, b) => (b.hunt || 0) - (a.hunt || 0));
        const attacker = pick(sorted.slice(0, Math.min(sorted.length, 4)), session.rng);
        const defenders = live.filter((enemy) => enemy.id !== attacker.id);
        if (!defenders.length) return;
        const defender = pick(defenders, session.rng);

        attacker.rivalPressure = (attacker.rivalPressure || 0) + 1;
        defender.rivalPressure = (defender.rivalPressure || 0) + 1;

        const attackerPower = attacker.hp * 0.66 + attacker.loyalty * 0.36 + combatAffinity(attacker, defender) + session.rng() * 1.3;
        const defenderPower = defender.hp * 0.66 + defender.loyalty * 0.36 + combatAffinity(defender, attacker) + session.rng() * 1.3;
        const diff = attackerPower - defenderPower;

        let summary = "";
        if (diff >= 1.9) {
            defender.defeated = true;
            defender.hp = 0;
            defender.killedBy = attacker.name;
            defender.killedByType = "rival";
            session.rivalKills += 1;
            session.defeatedServants = clamp(session.defeatedServants + 1, 0, 6);
            summary = `场外战局突变，【${attacker.className} ${attacker.name}】击杀了【${defender.className} ${defender.name}】。`;
            if (session.focusEnemyId === defender.id) session.focusEnemyId = "";
        } else if (diff <= -1.9) {
            attacker.defeated = true;
            attacker.hp = 0;
            attacker.killedBy = defender.name;
            attacker.killedByType = "rival";
            session.rivalKills += 1;
            session.defeatedServants = clamp(session.defeatedServants + 1, 0, 6);
            summary = `场外战局突变，【${defender.className} ${defender.name}】击杀了【${attacker.className} ${attacker.name}】。`;
            if (session.focusEnemyId === attacker.id) session.focusEnemyId = "";
        } else if (diff >= 0.4) {
            defender.hp = clamp(defender.hp - 2, 0, 12);
            defender.revealed = true;
            defender.storyStage = "wounded";
            summary = `昨夜【${attacker.className} ${attacker.name}】与【${defender.className} ${defender.name}】交战，后者被重创后撤离。`;
        } else if (diff <= -0.4) {
            attacker.hp = clamp(attacker.hp - 2, 0, 12);
            attacker.revealed = true;
            attacker.storyStage = "wounded";
            summary = `昨夜【${attacker.className} ${attacker.name}】与【${defender.className} ${defender.name}】交战，前者被重创后撤离。`;
        } else {
            attacker.revealed = true;
            defender.revealed = true;
            summary = `昨夜【${attacker.className} ${attacker.name}】与【${defender.className} ${defender.name}】短暂交锋，暂时未分生死。`;
        }

        session.rivalBattleLog.push(summary);
        if (session.rivalBattleLog.length > 12) session.rivalBattleLog = session.rivalBattleLog.slice(-12);
        session.log.push(summary);
    }

    function killRelationSummary(session) {
        const defeated = session.enemyRoster.filter((enemy) => enemy.defeated);
        if (!defeated.length) return "";
        const relations = defeated
            .filter((enemy) => enemy.killedBy)
            .map((enemy) => `\u3010${enemy.className} ${enemy.name}\u3011\u8d25\u4e8e\u3010${enemy.killedBy}\u3011`);
        return relations.length ? relations.join("\n") : "";
    }

    function battleLossText(session, enemy, servant) {
        const lossByClass = {
            Assassin: `\u3010${enemy.name}\u3011\u501f\u7740\u89c6\u7ebf\u6b7b\u89d2\u76f4\u5207\u5fa1\u4e3b\u4f4d\u7f6e\uff0c${servant.name} \u53ea\u80fd\u786c\u751f\u751f\u66ff\u4f60\u6321\u4e0b\u8fd9\u4e00\u51fb\uff0c\u5f3a\u884c\u5e26\u4f60\u8131\u79bb\u73b0\u573a\u3002`,
            Archer: `\u3010${enemy.name}\u3011\u4ece\u8fdc\u5904\u8fde\u7eed\u538b\u5236\uff0c\u4f60\u8fd9\u8fb9\u7684\u8282\u594f\u88ab\u5f7b\u5e95\u6253\u4e71\uff0c${servant.name} \u53ea\u80fd\u8fb9\u6218\u8fb9\u9000\u3002`,
            Lancer: `\u3010${enemy.name}\u3011\u6293\u4f4f\u4e00\u77ac\u7834\u7efd\u76f4\u7ebf\u7a81\u8fdb\uff0c\u6218\u7ebf\u88ab\u4e00\u53e3\u6c14\u6495\u7a7f\uff0c${servant.name} \u53ea\u80fd\u62a4\u7740\u4f60\u540e\u64a4\u3002`,
            Rider: `\u3010${enemy.name}\u3011\u5f3a\u884c\u628a\u6218\u573a\u901f\u5ea6\u62c9\u9ad8\uff0c\u4f60\u6839\u672c\u6765\u4e0d\u53ca\u91cd\u65b0\u7ec4\u7ec7\u6307\u6325\uff0c${servant.name} \u88ab\u8feb\u5148\u5e26\u4f60\u8131\u79bb\u51b2\u649e\u8303\u56f4\u3002`,
            Caster: `\u3010${enemy.name}\u3011\u63d0\u524d\u5e03\u597d\u7684\u672f\u5f0f\u5728\u6b64\u523b\u6536\u675f\uff0c\u4f60\u548c ${servant.name} \u540c\u65f6\u88ab\u538b\u4f4f\uff0c\u53ea\u80fd\u5148\u65a9\u65ad\u6218\u573a\u8131\u8eab\u3002`,
            Berserker: `\u3010${enemy.name}\u3011\u5b8c\u5168\u4e0d\u8bb2\u7ae0\u6cd5\u5730\u538b\u4e86\u4e0a\u6765\uff0c${servant.name} \u625b\u4f4f\u6b63\u9762\u51b2\u51fb\u540e\uff0c\u53ea\u80fd\u7acb\u523b\u62a4\u9001\u4f60\u64a4\u51fa\u3002`,
            Saber: `\u3010${enemy.name}\u3011\u6b63\u9762\u786c\u751f\u751f\u62a2\u4e0b\u4e86\u4e3b\u5bfc\u6743\uff0c${servant.name} \u6ca1\u80fd\u518d\u628a\u5c40\u52bf\u62c9\u56de\u6765\uff0c\u53ea\u80fd\u5148\u4fdd\u4f60\u4e0d\u6b7b\u3002`
        };
        return lossByClass[enemy.className] || `\u3010${enemy.name}\u3011\u66f4\u65e9\u62a2\u5230\u4e86\u6218\u573a\u4e3b\u52a8\uff0c${servant.name} \u53ea\u80fd\u5148\u63a9\u62a4\u4f60\u8131\u79bb\u3002`;
    }

    function battleDeathCause(session, enemy) {
        if (!enemy) return "\u8d25\u56e0\u662f\u4f60\u5728\u6b63\u9762\u4ea4\u950b\u91cc\u88ab\u5f7b\u5e95\u538b\u57ae\u3002";
        const deathByClass = {
            Assassin: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7ed5\u5f00\u6b63\u9762\u6218\u7ebf\uff0c\u76f4\u63a5\u5b8c\u6210\u4e86\u5bf9\u5fa1\u4e3b\u7684\u523a\u6740\u3002`,
            Archer: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u6301\u7eed\u8fdc\u7a0b\u538b\u5236\uff0c\u4f60\u5728\u8e32\u907f\u4e0e\u6307\u6325\u95f4\u5931\u624b\uff0c\u4e2d\u9014\u88ab\u76f4\u63a5\u5c04\u6740\u3002`,
            Lancer: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u6293\u4f4f\u7a7a\u6863\u4e00\u51fb\u8d2f\u7a7f\uff0c\u4f60\u6ca1\u80fd\u4ece\u90a3\u6b21\u7a81\u523a\u91cc\u6d3b\u4e0b\u6765\u3002`,
            Rider: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u5f3a\u884c\u51b2\u57ae\u9635\u7ebf\uff0c\u4f60\u5728\u6df7\u4e71\u4e2d\u88ab\u5377\u8fdb\u6b63\u9762\u649e\u6740\u3002`,
            Caster: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u63d0\u524d\u57cb\u597d\u7684\u672f\u5f0f\u5728\u4f60\u811a\u4e0b\u95ed\u5408\uff0c\u4f60\u6ca1\u80fd\u6d3b\u7740\u8d70\u51fa\u9b54\u672f\u9635\u3002`,
            Berserker: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7684\u731b\u653b\u76f4\u63a5\u6495\u5f00\u4e86\u9632\u7ebf\uff0c\u4f60\u88ab\u5f53\u573a\u62d6\u8fdb\u4e86\u5fc5\u6b7b\u8ddd\u79bb\u3002`,
            Saber: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u5728\u6b63\u9762\u51b3\u80dc\u91cc\u5f7b\u5e95\u538b\u8fc7\u4e86\u4f60\u65b9\uff0c\u4f60\u672c\u4eba\u4e5f\u88ab\u8fd9\u4e00\u51fb\u6ce2\u53ca\u8eab\u4ea1\u3002`
        };
        return deathByClass[enemy.className] || `\u8d25\u56e0\u662f\u4f60\u5728\u4e0e\u3010${enemy.name}\u3011\u7684\u4ea4\u950b\u91cc\u88ab\u76f4\u63a5\u51fb\u6740\u3002`;
    }

    function servantBreakCause(session, enemy) {
        if (!enemy) return "\u8d25\u56e0\u662f\u4ece\u8005\u7075\u57fa\u5148\u4e00\u6b65\u5d29\u6bc1\u3002";
        const breakByClass = {
            Assassin: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u4e0d\u65ad\u903c\u51fa\u7834\u7efd\uff0c\u6700\u7ec8\u5148\u4e00\u6b65\u5207\u788e\u4e86\u4f60\u65b9\u4ece\u8005\u7684\u7075\u57fa\u3002`,
            Archer: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7528\u6301\u7eed\u706b\u529b\u628a\u4f60\u65b9\u4ece\u8005\u6d3b\u6d3b\u8017\u7a7f\u3002`,
            Lancer: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u5728\u8fd1\u8eab\u4ea4\u6362\u91cc\u62a2\u5230\u4e86\u81f4\u547d\u4e00\u51fb\uff0c\u4f60\u65b9\u4ece\u8005\u6ca1\u80fd\u6491\u4f4f\u3002`,
            Rider: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u53cd\u590d\u51b2\u57ae\u9635\u578b\uff0c\u6700\u7ec8\u628a\u4f60\u65b9\u4ece\u8005\u62d6\u8fdb\u4e86\u5d29\u6bc1\u7ebf\u3002`,
            Caster: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7528\u672f\u5f0f\u5c01\u6b7b\u4e86\u56de\u65cb\u4f59\u5730\uff0c\u4f60\u65b9\u4ece\u8005\u7684\u7075\u57fa\u88ab\u4e00\u70b9\u70b9\u78e8\u706d\u3002`,
            Berserker: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7684\u72c2\u653b\u592a\u91cd\uff0c\u4f60\u65b9\u4ece\u8005\u786c\u63a5\u5230\u7075\u57fa\u5d29\u6bc1\u3002`,
            Saber: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u5728\u767d\u5203\u51b3\u80dc\u4e2d\u8d62\u5230\u4e86\u6700\u540e\uff0c\u4f60\u65b9\u4ece\u8005\u7387\u5148\u9000\u573a\u3002`
        };
        return breakByClass[enemy.className] || `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u5148\u4e00\u6b65\u6253\u7a7f\u4e86\u4f60\u65b9\u4ece\u8005\u3002`;
    }

    function sanityBreakCause(session, enemy) {
        if (!enemy) return "\u8d25\u56e0\u662f\u957f\u671f\u9ad8\u538b\u4e0b\u7cbe\u795e\u5148\u4e00\u6b65\u5d29\u6e83\u3002";
        const sanityByClass = {
            Assassin: `\u8d25\u56e0\u662f\u4f60\u59cb\u7ec8\u9632\u4e0d\u4f4f\u3010${enemy.name}\u3011\u4ece\u6697\u5904\u903c\u8fd1\uff0c\u7cbe\u795e\u88ab\u6301\u7eed\u62c9\u5230\u4e86\u6781\u9650\u3002`,
            Archer: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u4e00\u76f4\u628a\u4f60\u9489\u5728\u9ad8\u538b\u5c04\u7a0b\u91cc\uff0c\u7cbe\u795e\u5148\u4e8e\u8eab\u4f53\u57ae\u6389\u4e86\u3002`,
            Lancer: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u8fde\u7eed\u4e0d\u65ad\u7684\u8fd1\u8eab\u538b\u8feb\u8ba9\u4f60\u5f7b\u5e95\u5931\u53bb\u4e86\u5224\u65ad\u3002`,
            Rider: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u4e0d\u65ad\u6539\u53d8\u6218\u573a\u8282\u594f\uff0c\u4f60\u6700\u7ec8\u88ab\u8fd9\u79cd\u9ad8\u901f\u8ffd\u9010\u62d6\u57ae\u4e86\u7cbe\u795e\u3002`,
            Caster: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7684\u672f\u5f0f\u548c\u5e7b\u8c61\u6301\u7eed\u4fb5\u8680\u5224\u65ad\uff0c\u4f60\u6700\u7ec8\u6ca1\u80fd\u4fdd\u6301\u6e05\u9192\u3002`,
            Berserker: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7684\u72c2\u4e71\u538b\u8feb\u611f\u8fc7\u5f3a\uff0c\u4f60\u5728\u6301\u7eed\u5bf9\u6297\u4e2d\u5148\u5931\u53bb\u4e86\u7406\u667a\u3002`,
            Saber: `\u8d25\u56e0\u662f\u3010${enemy.name}\u3011\u7684\u6b63\u9762\u538b\u5236\u4e00\u6b65\u6b65\u903c\u57ae\u4e86\u4f60\u7684\u5224\u65ad\uff0c\u4f60\u5148\u6491\u4e0d\u4f4f\u4e86\u3002`
        };
        return sanityByClass[enemy.className] || `\u8d25\u56e0\u662f\u4e0e\u3010${enemy.name}\u3011\u5468\u65cb\u8fc7\u4e45\u540e\uff0c\u4f60\u7684\u7cbe\u795e\u5148\u6491\u4e0d\u4f4f\u4e86\u3002`;
    }

    function resolveBattle(session, option) {
        const enemy = session.enemyRoster.find((item) => item.id === session.currentScene.enemyId && !item.defeated);
        const servant = session.servant;
        if (!enemy || !servant) return "\u6218\u6597\u76ee\u6807\u5df2\u7ecf\u6d88\u5931\uff0c\u5c40\u52bf\u6682\u65f6\u4e2d\u65ad\u3002";

        let player = servant.hp * 0.72 + servant.loyalty * 0.4 + session.mana * 0.2 + combatAffinity(servant, enemy) + (servant.nobleLevel || 1) * 0.75;
        let foe = enemy.hp * 0.72 + enemy.loyalty * 0.38 + (enemy.npCharge || 0) * 0.5 + combatAffinity(enemy, servant) * 0.92;
        const mods = { assault: [1.45, 0.2], probe: [0.72, -0.1] }[option.id] || [1, 0];
        player += mods[0] + session.rng() * 1.2;
        foe += mods[1] + session.rng() * 1.2;

        let text = battleLeadText(enemy, servant, option.id);
        if (servant.npCharge >= 2 && session.mana >= 2) {
            servant.npCharge = 0;
            session.mana = clamp(session.mana - 2, 0, 10);
            player += 1.8 + (servant.nobleLevel || 1) * 0.85;
            text += ` ${servant.name} \u63d0\u524d\u89e3\u653e\u4e86\u5b9d\u5177\u3010${servant.noblePhantasm}\u3011\u3002`;
        }

        const margin = player - foe;
        session.focusEnemyId = enemy.id;
        if (margin >= 2.3) {
            enemy.defeated = true;
            enemy.hp = 0;
            enemy.revealed = true;
            servant.hp = clamp(servant.hp - 1, 0, 12);
            servant.loyalty = clamp(servant.loyalty + 1, 1, 10);
            servant.npCharge = clamp(servant.npCharge + 1, 0, 3);
            applyDelta(session, { defeatedServants: 1, truth: 1, enemyIntel: 1, exposure: 1 });
            session.playerKills += 1;
            enemy.killedBy = servant.name;
            enemy.killedByType = "player";
            return text + ` \u4f60\u4eec\u8fd9\u6b21\u6ca1\u6709\u518d\u7ed9\u3010${enemy.name}\u3011\u7559\u4e0b\u64a4\u79bb\u4f59\u5730\u3002${servant.name} \u5f7b\u5e95\u51fb\u6e83\u4e86\u5bf9\u65b9\u7075\u57fa\uff0c\u7b2c ${session.defeatedServants} \u9a91\u5df2\u7ecf\u9000\u573a\u3002`;
        }
        if (margin >= 0.5) {
            enemy.hp = clamp(enemy.hp - (3 + Math.floor((servant.nobleLevel || 1) / 3)), 0, 12);
            enemy.revealed = true;
            servant.hp = clamp(servant.hp - 1, 0, 12);
            servant.npCharge = clamp(servant.npCharge + 1, 0, 3);
            applyDelta(session, { enemyIntel: 1, exposure: 1 });
            if (enemy.hp <= 0) {
                enemy.defeated = true;
                enemy.killedBy = servant.name;
                enemy.killedByType = "player";
                session.playerKills += 1;
                applyDelta(session, { defeatedServants: 1, truth: 1 });
                return text + ` ${servant.name} \u987a\u52bf\u5c06\u3010${enemy.name}\u3011\u538b\u8fdb\u4e86\u9000\u573a\u7ebf\uff0c\u8fd9\u4e00\u9a91\u5df2\u88ab\u6e05\u7406\u3002`;
            }
            enemy.storyStage = "wounded";
            return text + ` \u4f60\u4eec\u91cd\u521b\u4e86\u3010${enemy.name}\u3011\uff0c\u4e0b\u4e00\u6b21\u518d\u89c1\u9762\u5c31\u8f83\u5927\u6982\u7387\u662f\u6536\u5c3e\u5c40\u3002`;
        }
        if (margin >= -0.9) {
            enemy.hp = clamp(enemy.hp - 2, 0, 12);
            enemy.revealed = true;
            servant.hp = clamp(servant.hp - 1, 0, 12);
            servant.npCharge = clamp(servant.npCharge + 2, 0, 3);
            applyDelta(session, { hp: -1, mana: -1, exposure: 1 });
            enemy.storyStage = "contested";
            return text + ` \u8fd9\u8f6e\u4ea4\u950b\u8fd8\u4e0d\u8db3\u4ee5\u51fb\u5760\u3010${enemy.name}\u3011\uff0c\u4f46\u4f60\u5df2\u7ecf\u770b\u6e05\u4e86\u5bf9\u65b9\u7684\u8282\u594f\u3002`;
        }
        servant.hp = clamp(servant.hp - 2, 0, 12);
        servant.loyalty = clamp(servant.loyalty - 1, 1, 10);
        servant.npCharge = clamp(servant.npCharge + 2, 0, 3);
        applyDelta(session, { hp: -2, sanity: -1, mana: -1, exposure: 2 });
        enemy.storyStage = "dominant";
        return text + ` ${battleLossText(session, enemy, servant)}`;
    }

    function checkEnding(session) {
        const failText = failureCause(session);
        if (session.hp <= 0) {
            session.ended = true;
            session.ending = `\u4f60\u5728\u5723\u676f\u6218\u4e89\u4e2d\u5931\u53bb\u4e86\u751f\u547d\u3002${failText}${session.servant ? ` ${session.servant.name} \u4e5f\u56e0\u5931\u53bb\u5fa1\u4e3b\u800c\u88ab\u8feb\u9000\u573a\u3002` : ""}`;
            return true;
        }
        if (session.sanity <= 0) {
            session.ended = true;
            session.ending = `\u4f60\u5148\u4e00\u6b65\u88ab\u8fd9\u573a\u6218\u4e89\u62d6\u57ae\u4e86\u7cbe\u795e\u3002${failText}\u6700\u7ec8\u4f60\u5931\u53bb\u4e86\u7ee7\u7eed\u4e89\u593a\u5723\u676f\u7684\u8d44\u683c\u3002`;
            return true;
        }
        if (session.servant && session.servant.hp <= 0) {
            session.ended = true;
            session.ending = `${session.servant.name} \u7684\u7075\u57fa\u5df2\u7ecf\u5d29\u6bc1\u3002${failText}\u5931\u53bb\u4ece\u8005\u7684\u4f60\u88ab\u8feb\u9000\u51fa\u8fd9\u573a\u6218\u4e89\u3002`;
            return true;
        }
        if (session.defeatedServants >= 6 && !session.boss && session.gamePhase === "auto") {
            rollBoss(session);
            setupBossChoice(session);
            session.log.push(buildWarSummary(session));
            session.log.push(`\u516d\u9a91\u5168\u90e8\u9000\u573a\u540e\uff0c\u5723\u676f\u6ca1\u6709\u5982\u671f\u56de\u5e94\u53ec\u5524\u3002\u771f\u6b63\u6d6e\u51fa\u7075\u8109\u6df1\u5904\u7684\uff0c\u662f ${session.boss.name}\u00b7${session.boss.title}\u3002`);
            return true;
        }
        return false;
    }

    function failureCause(session) {
        const enemy = session.currentScene && session.currentScene.enemyId
            ? session.enemyRoster.find((item) => item.id === session.currentScene.enemyId)
            : null;
        if (session.currentScene && session.currentScene.type === "battle" && enemy) {
            if (session.servant && session.servant.hp <= 0) return servantBreakCause(session, enemy);
            if (session.hp <= 0) return battleDeathCause(session, enemy);
            if (session.sanity <= 0) return sanityBreakCause(session, enemy);
            return `\u8d25\u56e0\u662f\u4f60\u5728\u4e0e\u3010${enemy.name}\u3011\u7684\u4ea4\u950b\u4e2d\u6ca1\u80fd\u6491\u4f4f\u3002`;
        }
        if (enemy) {
            if (session.hp <= 0 && enemy.className === "Assassin") return `\u8d25\u56e0\u662f\u4f60\u5728\u8ffd\u67e5\u3010${enemy.name}\u3011\u65f6\u66b4\u9732\u4e86\u4f4d\u7f6e\uff0c\u6700\u540e\u88ab\u5bf9\u65b9\u76f4\u63a5\u523a\u6740\u3002`;
            if (session.hp <= 0) return `\u8d25\u56e0\u662f\u4f60\u5728\u8ffd\u67e5\u3010${enemy.name}\u3011\u65f6\u8fde\u7eed\u5931\u8bef\uff0c\u6700\u7ec8\u88ab\u5bf9\u65b9\u5f53\u573a\u6536\u6389\u3002`;
            if (session.sanity <= 0 && enemy.className === "Caster") return `\u8d25\u56e0\u662f\u4f60\u5728\u8ffd\u67e5\u3010${enemy.name}\u3011\u65f6\u88ab\u672f\u5f0f\u4e0e\u5e7b\u8c61\u53cd\u590d\u7275\u5236\uff0c\u7cbe\u795e\u7387\u5148\u5d29\u6e83\u3002`;
            if (session.sanity <= 0) return `\u8d25\u56e0\u662f\u8ffd\u67e5\u3010${enemy.name}\u3011\u671f\u95f4\u957f\u671f\u9ad8\u538b\u7d2f\u79ef\uff0c\u6700\u7ec8\u7cbe\u795e\u5931\u63a7\u3002`;
            return `\u8d25\u56e0\u662f\u4f60\u5728\u8ffd\u67e5\u3010${enemy.name}\u3011\u7684\u8fc7\u7a0b\u4e2d\u88ab\u5bf9\u65b9\u8282\u594f\u53cd\u5236\u3002`;
        }
        if (session.rift >= 5) return "\u8d25\u56e0\u662f\u4f60\u8fc7\u5ea6\u63a5\u89e6\u5723\u676f\u88c2\u9699\uff0c\u6700\u7ec8\u88ab\u6c61\u67d3\u53cd\u566c\u3002";
        if (session.exposure >= 8) return "\u8d25\u56e0\u662f\u4f60\u7684\u884c\u52a8\u66b4\u9732\u8fc7\u9ad8\uff0c\u6700\u540e\u88ab\u591a\u65b9\u56f4\u527f\u5230\u65e0\u8def\u53ef\u9000\u3002";
        return "\u8d25\u56e0\u662f\u4f60\u7684\u8d44\u6e90\u4e0e\u72b6\u6001\u5148\u4e00\u6b65\u8017\u5c3d\u3002";
    }

    function buildFinalEnding(session) {
        if (session.ending) return session.ending;
        const servant = session.servant || { name: "\u4f60\u7684\u4ece\u8005" };
        return `\u8fd9\u4e00\u5c40\u4f60\u6ca1\u80fd\u771f\u6b63\u8d70\u5230\u7ec8\u5c40\u5f02\u53d8\uff0c\u4f46 ${servant.name} \u7684\u5b9d\u5177\u7b49\u7ea7\u5df2\u88ab\u8bb0\u5f55\u3002\u4e0b\u6b21\u518d\u62bd\u5230\u65f6\uff0c\u4f60\u4f1a\u6709\u66f4\u9ad8\u7684\u901a\u5173\u673a\u4f1a\u3002`;
    }

    function ensureEnemyState(enemy) {
        if (!enemy || typeof enemy !== "object") return;
        if (typeof enemy.hunt !== "number") enemy.hunt = 0;
        if (typeof enemy.revealed !== "boolean") enemy.revealed = false;
        if (typeof enemy.battleCount !== "number") enemy.battleCount = 0;
        if (typeof enemy.storyStage !== "string") enemy.storyStage = enemy.encountered ? "traced" : "unknown";
    }

    function pickFocusEnemy(session, live) {
        if (!live.length) return null;
        const focused = session.focusEnemyId ? live.find((item) => item.id === session.focusEnemyId) : null;
        if (focused && !focused.defeated) return focused;
        const revealed = live.filter((item) => item.revealed);
        if (revealed.length) return pick(revealed, session.rng);
        return live.slice().sort((a, b) => (b.hunt || 0) - (a.hunt || 0))[0];
    }

    function buildStoryScene(session, enemy) {
        if (!enemy) {
            return {
                type: "story",
                subType: "rest",
                enemyId: "",
                label: "剧情场景 / 休息场景",
                desc: `${session.location} 暂时没有新的敌情浮出水面。你只能先调整状态，等待下一次波动。`,
                options: [
                    { id: "rest", label: "专注休整", preview: "优先恢复体力、魔力与节奏。" },
                    { id: "bond", label: "与从者交谈", preview: "利用难得空档稳固契约，并确认接下来的方向。" }
                ]
            };
        }

        const stage = enemy.hunt <= 0 ? "reward" : enemy.hunt === 1 ? "penalty" : "rest";
        const byStage = {
            reward: {
                label: "剧情场景 / 线索场景",
                desc: `你在 ${session.location} 捕捉到了与【${enemy.className} / ${enemy.name}】有关的异常痕迹。只要顺着这条线继续挖，可能很快就能摸到敌方御主。`,
                options: [
                    { id: "observe", label: "追查线索", preview: `沿着【${enemy.name}】留下的气息继续深挖。` },
                    { id: "talk", label: "接触相关者", preview: `从目击者和卷入者口中撬出【${enemy.name}】的去向。` }
                ]
            },
            penalty: {
                label: "剧情场景 / 逼近场景",
                desc: `你已经摸到【${enemy.name}】的一层外壳，但对方也开始反查你。再往前一步，要么彻底锁定敌人，要么被反手咬住。`,
                options: [
                    { id: "observe", label: "谨慎处理", preview: `稳住节奏，把【${enemy.name}】的活动范围再压小一圈。` },
                    { id: "gamble", label: "强行破局", preview: `不等对方继续布置，直接硬拆掉【${enemy.name}】的掩护。` }
                ]
            },
            rest: {
                label: "剧情场景 / 战前整备",
                desc: `你已经基本锁定【${enemy.name}】。现在只差最后一次靠近，但在真正开战前，你还来得及做最后整备。`,
                options: [
                    { id: "rest", label: "专注休整", preview: `先把状态拉回可战水平，为和【${enemy.name}】的交战做准备。` },
                    { id: "bond", label: "与从者交谈", preview: `让 ${session.servant.name} 明确下一战的目标与打法。` }
                ]
            }
        };
        return { type: "story", subType: stage, enemyId: enemy.id, ...byStage[stage] };
    }

    function buildBattleScene(session, enemy) {
        const battleStage = enemy.hp <= 4 ? "finish" : enemy.battleCount <= 1 ? "first" : "rematch";
        const byStage = {
            first: {
                label: "战斗场景 / 初次交锋",
                desc: `${session.location} 一带的魔力波动突然撕开了一道口子。你第一次真正把敌对从者【${enemy.className} / ${enemy.name}】逼到了明面。`,
                assault: "先手压杀",
                probe: "观察拆招"
            },
            rematch: {
                label: "战斗场景 / 再会战",
                desc: `你与【${enemy.className} / ${enemy.name}】已经不是第一次交手了。对方这次没有再隐藏，而是明显带着上一次的应对经验回来。`,
                assault: "乘胜追击",
                probe: "稳扎反打"
            },
            finish: {
                label: "战斗场景 / 收尾战",
                desc: `【${enemy.className} / ${enemy.name}】的灵基已经出现了明显裂痕。这一战不再只是试探，而是决定谁能真正活到下一回合。`,
                assault: "强压收尾",
                probe: "锁死退路"
            }
        };
        const current = byStage[battleStage];
        return {
            type: "battle",
            enemyId: enemy.id,
            label: current.label,
            desc: current.desc,
            options: [
                { id: "assault", label: current.assault, preview: `命令 ${session.servant.name} 直接压上，争取把【${enemy.name}】逼进退场线。` },
                { id: "probe", label: current.probe, preview: `先吃透【${enemy.name}】这一轮的节奏，再决定如何完成收尾。` }
            ]
        };
    }

    function battleLeadText(enemy, servant, optionId) {
        let opener = "";
        if (enemy.hp <= 4) {
            opener = `你能清楚感觉到【${enemy.name}】的灵基已经不稳，这次相遇更像是在做最后清算。`;
        } else if (enemy.battleCount <= 1) {
            opener = `你终于把【${enemy.name}】从暗处逼到了明面。`;
        } else {
            opener = `你与【${enemy.name}】已经不是第一次交手，这次双方都没有再留试探空间。`;
        }
        const style = optionId === "assault"
            ? ` 你没有再等，直接命令 ${servant.name} 抢先冲阵。`
            : ` 你先压住出手欲望，逼 ${servant.name} 盯死对方的起手与破绽。`;
        return opener + style;
    }

    function openingProfile(servant) {
        if (hasTrait(servant.traits, "王") || hasTrait(servant.traits, "皇")) return "sovereign";
        if (hasTrait(servant.traits, "暗杀") || hasTrait(servant.traits, "高速") || servant.className === "Assassin") return "predator";
        if (hasTrait(servant.traits, "军略") || hasTrait(servant.traits, "分析") || servant.className === "Caster") return "tactician";
        if (hasTrait(servant.traits, "守护") || servant.className === "Saber") return "guardian";
        return "standard";
    }

    function applyOpeningBonus(session) {
        if (session.openingProfile === "predator") applyDelta(session, { progress: 1, exposure: 1 });
        if (session.openingProfile === "tactician") applyDelta(session, { truth: 1, enemyIntel: 1 });
        if (session.openingProfile === "guardian") applyDelta(session, { hp: 1, mana: 1 });
        if (session.openingProfile === "sovereign") applyDelta(session, { progress: 1, truth: 1 });
    }

    function masteryLevel(session, servantId) {
        return clamp(Number(session.progression?.servantMastery?.[servantId] || 1), 1, 9);
    }

    function uniqueCandidates(rng, count) {
        const list = [];
        const ids = new Set();
        while (list.length < count) {
            const servant = summonServant(rng);
            if (ids.has(servant.id)) continue;
            ids.add(servant.id);
            list.push(servant);
        }
        return list;
    }

    function summonServant(rng) {
        const className = pick(SERVANT_CLASSES, rng);
        return summonServantFromClass(className, rng, null);
    }

    function summonServantFromClass(className, rng, excludeId) {
        const profile = CLASS_PROFILES[className] || { label: className, baseHp: 8, baseLoyalty: 6, manaCost: 2, coreTraits: [] };
        const pool = (SERVANT_POOLS[className] || []).filter((entry) => !excludeId || entry.id !== excludeId);
        const entry = pick(pool.length ? pool : (SERVANT_POOLS[className] || []), rng) || {
            id: `${className.toLowerCase()}_default`,
            name: className,
            title: "无名英灵",
            noblePhantasm: "未知宝具",
            traits: [],
            introLine: "从者沉默地注视着你。"
        };
        return {
            id: entry.id,
            className,
            classLabel: profile.label,
            name: entry.name,
            title: entry.title,
            noblePhantasm: entry.noblePhantasm,
            alignment: entry.alignment || "中立",
            origin: entry.origin || "传承不明",
            personality: entry.personality || "沉默",
            combatStyle: entry.combatStyle || "标准交战",
            masterAffinity: entry.masterAffinity || "待观察",
            loyalty: clamp((profile.baseLoyalty || 6) + Math.floor(rng() * 3), 1, 10),
            hp: clamp((profile.baseHp || 8) + Math.floor(rng() * 2), 1, 12),
            manaCost: profile.manaCost || 2,
            npCharge: 0,
            traits: Array.from(new Set([...(profile.coreTraits || []), ...((entry.traits) || [])])).slice(0, 4),
            introLine: entry.introLine || "从者沉默地注视着你。"
        };
    }

    function storyRate(session, actionId) {
        let rate = 0.65;
        if (actionId === "rest") rate += 0.15;
        if (actionId === "observe") rate += 0.08;
        if (actionId === "talk") rate += 0.06;
        if (actionId === "gamble") rate -= 0.14;
        if (session.sanity <= 3) rate -= 0.08;
        if (session.hp <= 3) rate -= 0.08;
        return clamp(rate, 0.22, 0.9);
    }

    function classAdvantage(a, b) {
        const table = {
            Saber: { Lancer: 1.2, Archer: -0.85, Berserker: 0.2 },
            Archer: { Saber: 1.15, Lancer: -0.9, Assassin: 0.25 },
            Lancer: { Archer: 1.15, Saber: -0.9, Rider: 0.25 },
            Rider: { Caster: 1.1, Assassin: -0.65, Berserker: 0.2 },
            Caster: { Assassin: 1.05, Rider: -0.7, Berserker: 0.35 },
            Assassin: { Rider: 1.0, Caster: -0.6, Archer: 0.2 },
            Berserker: { Saber: 0.15, Rider: 0.15, Caster: -0.2 }
        };
        return (table[a] && table[a][b]) || 0;
    }

    function hasServantTrait(servant, keyword) {
        return (servant?.traits || []).some((item) => String(item).includes(keyword));
    }

    function traitAdvantage(attacker, defender) {
        let score = 0;
        if (hasServantTrait(attacker, "\u9f99\u6740") && (hasServantTrait(defender, "\u9f99\u56e0\u5b50") || hasServantTrait(defender, "\u9f99"))) score += 1.35;
        if (hasServantTrait(attacker, "\u5bf9\u9b54\u529b") && defender?.className === "Caster") score += 0.55;
        if (attacker?.className === "Assassin" && (hasServantTrait(defender, "\u738b\u8005") || hasServantTrait(defender, "\u7687\u5e1d\u7279\u6743") || hasServantTrait(defender, "\u9ad8\u5b58\u5728\u611f"))) score += 0.45;
        if (attacker?.className === "Caster" && hasServantTrait(defender, "\u72c2\u5316")) score += 0.45;
        if (hasServantTrait(attacker, "\u9ad8\u9632\u5fa1") && defender?.className === "Berserker") score += 0.35;
        if (hasServantTrait(attacker, "\u9ad8\u7206\u53d1") && hasServantTrait(defender, "\u9ad8\u9632\u5fa1")) score -= 0.3;
        return score;
    }

    function heroicAdvantage(attacker, defender) {
        const table = {
            saber_altria: { saber_mordred: 0.95, lancer_karna: -0.2 },
            saber_mordred: { saber_altria: 0.7 },
            saber_siegfried: { saber_sigurd: 0.4 },
            saber_sigurd: { saber_siegfried: 0.4 },
            saber_gawain: { saber_altria: 0.45 },
            archer_gilgamesh: { lancer_enkidu: 0.95, berserker_heracles: 0.85 },
            lancer_enkidu: { archer_gilgamesh: 0.95 },
            archer_emiya: { saber_altria: 0.65, lancer_cuchulainn: 0.45 },
            lancer_cuchulainn: { archer_emiya: 0.55 },
            lancer_karna: { archer_arjuna: 1.05, archer_asvatthaman: 0.75 },
            archer_arjuna: { lancer_karna: 1.05 },
            archer_asvatthaman: { lancer_karna: 0.75 },
            rider_achilles: { berserker_heracles: 0.45 },
            caster_merlin: { saber_altria: 0.7, saber_gawain: 0.75 },
            assassin_kinghassan: { caster_merlin: 0.6, assassin_jack: 0.4 },
            berserker_heracles: { archer_gilgamesh: 0.55 }
        };
        return (table[attacker?.id] && table[attacker.id][defender?.id]) || 0;
    }

    function combatAffinity(attacker, defender) {
        return classAdvantage(attacker?.className, defender?.className) + traitAdvantage(attacker, defender) + heroicAdvantage(attacker, defender);
    }

    function hasTrait(traits, word) {
        return (traits || []).some((item) => String(item).includes(word));
    }

    function stageLabel(session) {
        if (STAGES?.early && session.progress <= STAGES.early.max) return STAGES.early.label;
        if (STAGES?.mid && session.progress <= STAGES.mid.max) return STAGES.mid.label;
        return STAGES?.late?.label || "终局逼近";
    }

    function formatStatus(session) {
        const servantHp = session.servant ? session.servant.hp : 0;
        return `御主 ${session.hp} | 从者 ${servantHp} | 魔力 ${session.mana} | 暴露 ${session.exposure} | 击破 ${session.defeatedServants}/6`;
    }

    function formatServantStatus(session) {
        return session.servant
            ? `从者：${session.servant.className} ${session.servant.name} | 宝具Lv.${session.servant.nobleLevel || 1} | 宝具充能 ${session.servant.npCharge} | 特性 ${session.servant.traits.join(" / ")}`
            : "";
    }

    function formatExtendedStatus(session) {
        return `方针 ${planLabel(session.warPlan)} | 真相 ${session.truth} | 敌情 ${session.enemyIntel} | 裂隙 ${session.rift}`;
    }

    function planLabel(id) {
        const map = {
            aggressive: "激进推进",
            balanced: "稳健推进",
            cautious: "谨慎经营"
        };
        return map[id] || "未决定";
    }


    function applyDelta(session, delta) {
        session.hp = clamp(session.hp + (delta.hp || 0), 0, 10);
        session.sanity = clamp(session.sanity + (delta.sanity || 0), 0, 10);
        session.mana = clamp(session.mana + (delta.mana || 0), 0, 10);
        session.truth = clamp(session.truth + (delta.truth || 0), 0, 10);
        session.rift = clamp(session.rift + (delta.rift || 0), 0, 10);
        session.exposure = clamp(session.exposure + (delta.exposure || 0), 0, 10);
        session.enemyIntel = clamp(session.enemyIntel + (delta.enemyIntel || 0), 0, 10);
        session.defeatedServants = clamp(session.defeatedServants + (delta.defeatedServants || 0), 0, 6);
    }

    function pick(list, rng) {
        return list[Math.floor(rng() * list.length)];
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function createRng() {
        let seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
        return function rng() {
            seed = (1664525 * seed + 1013904223) >>> 0;
            return seed / 0x100000000;
        };
    }

    return { createSession, getView, choose };
});
