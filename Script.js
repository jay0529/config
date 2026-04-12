// ==================== 常量配置 ====================
const CONFIG = {
    TEST_URL: "http://www.gstatic.com/generate_204",
    DEFAULT_INTERVAL: 300,
    HEALTH_CHECK_INTERVAL: 600,
    RULE_UPDATE_INTERVAL: 86400,
    REGION_TOLERANCE: {
        default: 50,
        US: 150,
        UK: 100
    }
};

// ==================== 排除关键词 ====================
const excludeKeywords = [
    "下载", "测试", "充值", "余额", "分割线",
    "群", "官网", "失联", "邮件", "剩余", "到期"
];

function shouldExclude(name) {
    return excludeKeywords.some(keyword => name.includes(keyword));
}

// ==================== 地区正则配置 ====================
const REGEX_CONFIGS = {
    hk: /(?:^|\s|\(|（)(?:港|香港|HK|Hong\s*Kong|HongKong|hongkong)(?:$|\s|\)|）|\d)/i,
    tw: /(?:^|\s|\(|（)(?:台|台湾|新北|彰化|TW|Taiwan)(?:$|\s|\)|）|\d)/i,
    jp: /(?:^|\s|\(|（)(?:日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan)(?:$|\s|\)|）|\d)/i,
    us: /(?:^|\s|\(|（)(?:美|美国|波特兰|达拉斯|俄勒冈|凤凰城|费利蒙|硅谷|拉斯维加斯|洛杉矶|圣何塞|圣克拉拉|西雅图|芝加哥|US|United\s*States)(?:$|\s|\)|）|\d)/i,
    sg: /(?:^|\s|\(|（)(?:新加坡|坡|狮城|SG|Singapore)(?:$|\s|\)|）|\d)/i,
    kr: /(?:^|\s|\(|（)(?:韩|韩国|首尔|韓|KR|Korea|KOR)(?:$|\s|\)|）|\d)/i,
    uk: /(?:^|\s|\(|（)(?:英|英国|伦敦|英格兰|UK|United\s*Kingdom)(?:$|\s|\)|）|\d)/i,
    nf: /(?:^|\s|\(|（)(?:奈飞|NF|解锁|Netflix|NETFLIX|Media)(?:$|\s|\)|）|\d)/i,
    netease: /(?:^|\s|\(|（)(?:网易|音乐|解锁|Music|NetEase)(?:$|\s|\)|）|\d)/i
};

// ==================== 地区组配置 ====================
const REGION_GROUP_CONFIGS = [
    { regex: REGEX_CONFIGS.hk, name: "🇭🇰 香港节点", tolerance: CONFIG.REGION_TOLERANCE.default },
    { regex: REGEX_CONFIGS.tw, name: "🇨🇳 台湾节点", tolerance: CONFIG.REGION_TOLERANCE.default },
    { regex: REGEX_CONFIGS.jp, name: "🇯🇵 日本节点", tolerance: CONFIG.REGION_TOLERANCE.default },
    { regex: REGEX_CONFIGS.us, name: "🇺🇲 美国节点", tolerance: CONFIG.REGION_TOLERANCE.US },
    { regex: REGEX_CONFIGS.sg, name: "🇸🇬 狮城节点", tolerance: CONFIG.REGION_TOLERANCE.default },
    { regex: REGEX_CONFIGS.kr, name: "🇰🇷 韩国节点", tolerance: CONFIG.REGION_TOLERANCE.default },
    { regex: REGEX_CONFIGS.uk, name: "🇬🇧 英国节点", tolerance: CONFIG.REGION_TOLERANCE.UK }
];

// ==================== 工具函数 ====================
function getProxiesByRegex(proxies, regex, concatProxies = []) {
    return [
        ...proxies
            .filter(e => regex.test(e.name) && !shouldExclude(e.name))
            .map(e => e.name),
        ...concatProxies
    ];
}

// 创建健康检查配置
function createHealthCheck() {
    return {
        enable: true,
        url: CONFIG.TEST_URL,
        interval: CONFIG.HEALTH_CHECK_INTERVAL,
        timeout: 5000,
        lazy: false
    };
}

// ==================== 分组模板与构造函数 ====================
const PROXY_OPTION_TEMPLATES = {
    nodeAuto: ["🚀 节点选择", "♻️ 自动选择"],
    nodeAutoManual: ["🚀 节点选择", "♻️ 自动选择", "🚀 手动切换"],
    nodeAutoManualDirect: ["🚀 节点选择", "♻️ 自动选择", "🚀 手动切换", "DIRECT"],
    nodeAutoFailoverLoadBalance: ["🚀 节点选择", "♻️ 自动选择", "🔯 故障转移", "🔮 负载均衡"],
    directNodeAutoManual: ["DIRECT", "🚀 节点选择", "♻️ 自动选择", "🚀 手动切换"],
    directNodeAuto: ["DIRECT", "🚀 节点选择", "♻️ 自动选择"],
    autoNodeManualDirect: ["♻️ 自动选择", "🚀 节点选择", "🚀 手动切换", "DIRECT"],
    rejectDirect: ["REJECT", "DIRECT"]
};

function createSelectGroup(name, proxies, extras = {}) {
    return {
        name,
        type: "select",
        proxies,
        ...extras
    };
}

function createUrlTestGroup(name, proxies, options = {}) {
    return {
        name,
        type: "url-test",
        proxies,
        url: options.url || CONFIG.TEST_URL,
        interval: options.interval || CONFIG.DEFAULT_INTERVAL,
        tolerance: options.tolerance ?? 50
    };
}

function createFallbackGroup(name, proxies, options = {}) {
    return {
        name,
        type: "fallback",
        proxies,
        url: options.url || CONFIG.TEST_URL,
        interval: options.interval || CONFIG.DEFAULT_INTERVAL
    };
}

function createLoadBalanceGroup(name, proxies, options = {}) {
    return {
        name,
        type: "load-balance",
        strategy: options.strategy || "consistent-hashing",
        proxies,
        url: options.url || CONFIG.TEST_URL,
        interval: options.interval || CONFIG.DEFAULT_INTERVAL
    };
}

function ruleSetRules(ruleSetNames, targetGroup) {
    return ruleSetNames.map(ruleSetName => `RULE-SET,${ruleSetName},${targetGroup}`);
}

// ==================== 规则集配置 ====================
function createRuleProvider(url, path, options = {}) {
    return {
        type: "http",
        format: options.format || "yaml",
        interval: CONFIG.RULE_UPDATE_INTERVAL,
        behavior: options.behavior || "classical",
        url,
        path
    };
}

const RULE_PROVIDER_DEFINITIONS = [
    ["LocalAreaNetwork",  "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/LocalAreaNetwork.list",        "./ruleset/LocalAreaNetwork.yaml"],
    ["UnBan",             "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/UnBan.list",                   "./ruleset/UnBan.yaml"],
    ["BanAD",             "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/BanAD.list",                   "./ruleset/BanAD.yaml"],
    ["BanProgramAD",      "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/BanProgramAD.list",            "./ruleset/BanProgramAD.yaml"],
    ["BanEasyList",       "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/BanEasyList.list",             "./ruleset/BanEasyList.yaml"],
    ["BanEasyListChina",  "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/BanEasyListChina.list",        "./ruleset/BanEasyListChina.yaml"],
    ["BanEasyPrivacy",    "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/BanEasyPrivacy.list",          "./ruleset/BanEasyPrivacy.yaml"],
    ["GoogleFCM",         "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/GoogleFCM.list",       "./ruleset/GoogleFCM.yaml"],
    ["GoogleCN",          "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/GoogleCN.list",                "./ruleset/GoogleCN.yaml"],
    ["SteamCN",           "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/SteamCN.list",         "./ruleset/SteamCN.yaml"],
    ["Bing",              "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Bing.list",                    "./ruleset/Bing.yaml"],
    ["OneDrive",          "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/OneDrive.list",                "./ruleset/OneDrive.yaml"],
    ["Microsoft",         "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Microsoft.list",              "./ruleset/Microsoft.yaml"],
    ["Apple",             "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Apple.list",                  "./ruleset/Apple.yaml"],
    ["Telegram",          "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Telegram.list",               "./ruleset/Telegram.yaml"],
    ["AI",                "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/AI.list",              "./ruleset/AI.yaml"],
    ["OpenAi",            "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/OpenAi.list",          "./ruleset/OpenAi.yaml"],
    ["NetEaseMusic",      "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/NetEaseMusic.list",    "./ruleset/NetEaseMusic.yaml"],
    ["Epic",              "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Epic.list",            "./ruleset/Epic.yaml"],
    ["Origin",            "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Origin.list",         "./ruleset/Origin.yaml"],
    ["Sony",              "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Sony.list",            "./ruleset/Sony.yaml"],
    ["Steam",             "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Steam.list",           "./ruleset/Steam.yaml"],
    ["Nintendo",          "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Nintendo.list",        "./ruleset/Nintendo.yaml"],
    ["YouTube",           "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/YouTube.list",         "./ruleset/YouTube.yaml"],
    ["Netflix",           "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Netflix.list",         "./ruleset/Netflix.yaml"],
    ["Bahamut",           "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Bahamut.list",         "./ruleset/Bahamut.yaml"],
    ["BilibiliHMT",       "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/BilibiliHMT.list",     "./ruleset/BilibiliHMT.yaml"],
    ["Bilibili",          "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Ruleset/Bilibili.list",        "./ruleset/Bilibili.yaml"],
    ["ChinaMedia",        "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ChinaMedia.list",              "./ruleset/ChinaMedia.yaml"],
    ["ProxyMedia",        "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyMedia.list",              "./ruleset/ProxyMedia.yaml"],
    ["ProxyGFWlist",      "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyGFWlist.list",            "./ruleset/ProxyGFWlist.yaml"],
    ["ChinaDomain",       "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ChinaDomain.list",             "./ruleset/ChinaDomain.yaml"],
    ["ChinaCompanyIp",    "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ChinaCompanyIp.list",          "./ruleset/ChinaCompanyIp.yaml"],
    ["Download",          "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Download.list",                "./ruleset/Download.yaml"],
    ["CustomDirect",      "https://raw.githubusercontent.com/Lbiebest/clash-config/refs/heads/master/rules/CustomDirect.list", "./ruleset/CustomDirect.yaml"],
    ["ChinaExtra",        "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/China/China.list", "./ruleset/ChinaExtra.yaml"],
    ["ChinaIPs",          "https://raw.githubusercontent.com/DivineEngine/Profiles/master/Clash/RuleSet/Extra/ChinaIP.yaml",   "./ruleset/ChinaIPs.yaml",   { behavior: "ipcidr" }],
    ["ProcessRules",      "https://raw.githubusercontent.com/Lbiebest/clash-config/refs/heads/master/rules/ProcessRules.list", "./ruleset/ProcessRules.yaml", { format: "yaml", behavior: "classical" }]
];

const ruleProviders = Object.fromEntries(
    RULE_PROVIDER_DEFINITIONS.map(([name, url, path, options]) => [name, createRuleProvider(url, path, options)])
);

// ==================== 主函数 ====================
function main(config) {
    try {
        // 验证配置
        if (!config.proxies || !Array.isArray(config.proxies)) {
            console.error("Invalid proxies configuration");
            return config;
        }

        const allProxies = config.proxies.map(e => e.name);

        // 获取各地区的代理节点
        const regionProxies = {};
        REGION_GROUP_CONFIGS.forEach(cfg => {
            regionProxies[cfg.name] = getProxiesByRegex(config.proxies, cfg.regex);
        });

        const hkProxies = regionProxies["🇭🇰 香港节点"] || [];
        const twProxies = regionProxies["🇨🇳 台湾节点"] || [];
        const jpProxies = regionProxies["🇯🇵 日本节点"] || [];
        const usProxies = regionProxies["🇺🇲 美国节点"] || [];
        const sgProxies = regionProxies["🇸🇬 狮城节点"] || [];
        const krProxies = regionProxies["🇰🇷 韩国节点"] || [];
        const ukProxies = regionProxies["🇬🇧 英国节点"] || [];

        const nfProxies = getProxiesByRegex(config.proxies, REGEX_CONFIGS.nf);
        const neteaseMusicProxies = getProxiesByRegex(config.proxies, REGEX_CONFIGS.netease);

        // ==================== 创建地区分组 ====================
        const regionGroups = [];

        REGION_GROUP_CONFIGS.forEach(cfg => {
            const proxies = regionProxies[cfg.name] || [];
            if (proxies.length > 0) {
                regionGroups.push(createUrlTestGroup(cfg.name, proxies, {
                    tolerance: cfg.tolerance
                }));
            }
        });

        const regionGroupNames = regionGroups.map(group => group.name);
        const allProxyNames = allProxies.filter(name => !shouldExclude(name));

        // ==================== 辅助函数 ====================
        function getAvailableProxies(baseProxies, includeRegions = true) {
            const result = [...baseProxies];

            if (includeRegions) {
                if (hkProxies.length > 0) result.push("🇭🇰 香港节点");
                if (twProxies.length > 0) result.push("🇨🇳 台湾节点");
                if (jpProxies.length > 0) result.push("🇯🇵 日本节点");
                if (usProxies.length > 0) result.push("🇺🇲 美国节点");
                if (sgProxies.length > 0) result.push("🇸🇬 狮城节点");
                if (krProxies.length > 0) result.push("🇰🇷 韩国节点");
            }

            return [...new Set(result)];
        }

        function fromTemplate(templateKey, options = {}) {
            const { includeRegions = true, prepend = [], append = [] } = options;
            const baseTemplate = PROXY_OPTION_TEMPLATES[templateKey] || [];
            return [...new Set([
                ...prepend,
                ...getAvailableProxies(baseTemplate, includeRegions),
                ...append
            ])];
        }

        // ==================== 代理组配置 ====================
        config["proxy-groups"] = [
            // 主节点选择
            createSelectGroup("🚀 节点选择", [
                "♻️ 自动选择",
                "🔯 故障转移",
                "🔮 负载均衡",
                ...regionGroupNames,
                "🚀 手动切换",
                "DIRECT"
            ]),
            createSelectGroup("🚀 手动切换", allProxies),
            createUrlTestGroup("♻️ 自动选择", allProxyNames, { tolerance: 50 }),
            createFallbackGroup("🔯 故障转移", allProxyNames),
            createLoadBalanceGroup("🔮 负载均衡", allProxyNames),

            // 应用分组
            createSelectGroup("📲 电报消息", fromTemplate("nodeAuto", {
                prepend: ["🚀 节点选择"],
                append: ["🚀 手动切换", "DIRECT"]
            })),
            createSelectGroup("💬 Ai平台", fromTemplate("nodeAuto", {
                prepend: ["🚀 节点选择"],
                append: ["🚀 手动切换", "DIRECT"]
            })),
            createSelectGroup("📹 油管视频", fromTemplate("nodeAuto", {
                prepend: ["🚀 节点选择"],
                append: ["🚀 手动切换", "DIRECT"]
            })),
            createSelectGroup("🎥 奈飞视频", [
                "🎥 奈飞节点",
                "🚀 节点选择",
                "♻️ 自动选择",
                "🔯 故障转移",
                "🔮 负载均衡",
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换",
                "DIRECT"
            ]),
            createSelectGroup("📺 巴哈姆特", [
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                "🚀 节点选择",
                "🚀 手动切换",
                "DIRECT"
            ]),
            createSelectGroup("📺 哔哩哔哩", [
                "🎯 全球直连",
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : [])
            ]),
            createSelectGroup("🌍 国外媒体", fromTemplate("nodeAuto", {
                prepend: ["🚀 节点选择"],
                append: ["🚀 手动切换", "DIRECT"]
            })),
            createSelectGroup("🌏 国内媒体", [
                "DIRECT",
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("📢 谷歌FCM", [
                "DIRECT",
                "🚀 节点选择",
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("Ⓜ️ 微软Bing", [
                "DIRECT",
                "🚀 节点选择",
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("Ⓜ️ 微软云盘", [
                "DIRECT",
                "🚀 节点选择",
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("Ⓜ️ 微软服务", [
                "DIRECT",
                "🚀 节点选择",
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("🍎 苹果服务", [
                "DIRECT",
                "🚀 节点选择",
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("🎮 游戏平台", [
                "DIRECT",
                "🚀 节点选择",
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),
            createSelectGroup("🎶 网易音乐", [
                "DIRECT",
                "🚀 节点选择",
                "♻️ 自动选择",
                ...neteaseMusicProxies
            ]),
            createSelectGroup("🎯 全球直连", fromTemplate("directNodeAuto")),
            createSelectGroup("🛑 广告拦截", fromTemplate("rejectDirect", { includeRegions: false })),
            createSelectGroup("🍃 应用净化", fromTemplate("rejectDirect", { includeRegions: false })),
            createSelectGroup("🆎 AdBlock",  fromTemplate("rejectDirect", { includeRegions: false })),
            createSelectGroup("🛡️ 隐私防护", fromTemplate("rejectDirect", { includeRegions: false })),
            createSelectGroup("🐟 漏网之鱼", [
                "🚀 节点选择",
                "♻️ 自动选择",
                "DIRECT",
                ...(hkProxies.length > 0 ? ["🇭🇰 香港节点"] : []),
                ...(twProxies.length > 0 ? ["🇨🇳 台湾节点"] : []),
                ...(sgProxies.length > 0 ? ["🇸🇬 狮城节点"] : []),
                ...(jpProxies.length > 0 ? ["🇯🇵 日本节点"] : []),
                ...(usProxies.length > 0 ? ["🇺🇲 美国节点"] : []),
                ...(krProxies.length > 0 ? ["🇰🇷 韩国节点"] : []),
                "🚀 手动切换"
            ]),

            createSelectGroup("🎥 奈飞节点", [
                ...(nfProxies.length > 0 ? nfProxies : ["🚀 节点选择"]),
                "🚀 节点选择",
                "DIRECT"
            ]),

            // 地区分组
            ...regionGroups
        ];

        // ==================== 规则配置 ====================
        config["rule-providers"] = ruleProviders;

        // 自定义直连规则
        const customDirectRules = [
            // Gemini AI 规则
            "DOMAIN,ai.google.dev,💬 Ai平台",
            "DOMAIN,alkalimakersuite-pa.clients6.google.com,💬 Ai平台",
            "DOMAIN,makersuite.google.com,💬 Ai平台",
            "DOMAIN-SUFFIX,bard.google.com,💬 Ai平台",
            "DOMAIN-SUFFIX,deepmind.com,💬 Ai平台",
            "DOMAIN-SUFFIX,deepmind.google,💬 Ai平台",
            "DOMAIN-SUFFIX,gemini.google.com,💬 Ai平台",
            "DOMAIN-SUFFIX,generativeai.google,💬 Ai平台",
            "DOMAIN-SUFFIX,proactivebackend-pa.googleapis.com,💬 Ai平台",
            "DOMAIN-SUFFIX,apis.google.com,💬 Ai平台",
            "DOMAIN-KEYWORD,colab,💬 Ai平台",
            "DOMAIN-KEYWORD,developerprofiles,💬 Ai平台",
            "DOMAIN-KEYWORD,generativelanguage,💬 Ai平台",

            "DOMAIN-SUFFIX,claude.ai,💬 Ai平台",
            "DOMAIN-SUFFIX,anthropic.com,💬 Ai平台",

            "DOMAIN-SUFFIX,github.com,♻️ 自动选择",
            "DOMAIN-SUFFIX,github.io,♻️ 自动选择",
            "DOMAIN-SUFFIX,githubusercontent.com,♻️ 自动选择",
            "DOMAIN-SUFFIX,ghcr.io,♻️ 自动选择",

            "DOMAIN-SUFFIX,googleapis.com,♻️ 自动选择",

            // 特定域名
            "DOMAIN,zhuce.mri.edu.kg,♻️ 自动选择",
            "DOMAIN-KEYWORD,imgur,🇺🇲 美国节点",

            "DOMAIN-KEYWORD,infini,DIRECT",
            "DOMAIN-KEYWORD,cnki,DIRECT",
            "DOMAIN-KEYWORD,weixin,DIRECT",
            "DOMAIN-KEYWORD,qcc,DIRECT",
            "DOMAIN-KEYWORD,gitcode,DIRECT",
            "DOMAIN-SUFFIX,linux.do,DIRECT",
            "DOMAIN-SUFFIX,speedtest.net,DIRECT",
            "DOMAIN-SUFFIX,nguaduot.cn,DIRECT"
        ];

        // Garena 直连规则
        const garenaRules = [
            "DOMAIN-SUFFIX,garena.com,DIRECT",
            "DOMAIN-SUFFIX,seagroup.com,DIRECT",
            "DOMAIN-SUFFIX,sea.com,DIRECT",
            "DOMAIN-SUFFIX,garena.cn,DIRECT",
            "DOMAIN-SUFFIX,garenanow.com,DIRECT",
            "DOMAIN-SUFFIX,web.garenanow.com,DIRECT",
            "DOMAIN-SUFFIX,freefiremobile.com,DIRECT"
        ];

        // ==================== 规则顺序 ====================
        config["rules"] = [
            // 1. Garena 直连规则（最高优先级）
            ...garenaRules,

            // 2. 进程规则
            ...ruleSetRules(["ProcessRules"], "DIRECT"),

            // 3. 自定义规则
            ...customDirectRules,
            ...ruleSetRules(["CustomDirect"], "DIRECT"),

            // 4. 局域网直连
            ...ruleSetRules(["LocalAreaNetwork"], "🎯 全球直连"),
            ...ruleSetRules(["UnBan"], "🎯 全球直连"),

            // 5. 广告拦截（尽早拦截）
            ...ruleSetRules(["BanAD"], "🛑 广告拦截"),
            ...ruleSetRules(["BanProgramAD"], "🍃 应用净化"),
            ...ruleSetRules(["BanEasyList"], "🆎 AdBlock"),
            ...ruleSetRules(["BanEasyListChina"], "🆎 AdBlock"),
            ...ruleSetRules(["BanEasyPrivacy"], "🛡️ 隐私防护"),

            // 6. 谷歌FCM
            ...ruleSetRules(["GoogleFCM"], "📢 谷歌FCM"),

            // 7. 国内服务直连
            ...ruleSetRules(["GoogleCN"], "🎯 全球直连"),
            ...ruleSetRules(["SteamCN"], "🎯 全球直连"),

            // 8. 微软服务
            ...ruleSetRules(["Bing"], "Ⓜ️ 微软Bing"),
            ...ruleSetRules(["OneDrive"], "Ⓜ️ 微软云盘"),
            ...ruleSetRules(["Microsoft"], "Ⓜ️ 微软服务"),

            // 9. 苹果服务
            ...ruleSetRules(["Apple"], "🍎 苹果服务"),

            // 10. 即时通讯
            ...ruleSetRules(["Telegram"], "📲 电报消息"),

            // 11. AI平台
            ...ruleSetRules(["AI"], "💬 Ai平台"),
            ...ruleSetRules(["OpenAi"], "💬 Ai平台"),

            // 12. 网易音乐
            ...ruleSetRules(["NetEaseMusic"], "🎶 网易音乐"),

            // 13. 游戏平台
            ...ruleSetRules(["Epic"], "🎮 游戏平台"),
            ...ruleSetRules(["Origin"], "🎮 游戏平台"),
            ...ruleSetRules(["Sony"], "🎮 游戏平台"),
            ...ruleSetRules(["Steam"], "🎮 游戏平台"),
            ...ruleSetRules(["Nintendo"], "🎮 游戏平台"),

            // 14. 流媒体服务
            ...ruleSetRules(["YouTube"], "📹 油管视频"),
            ...ruleSetRules(["Netflix"], "🎥 奈飞视频"),
            ...ruleSetRules(["Bahamut"], "📺 巴哈姆特"),
            ...ruleSetRules(["BilibiliHMT"], "📺 哔哩哔哩"),
            ...ruleSetRules(["Bilibili"], "📺 哔哩哔哩"),

            // 15. 媒体服务
            ...ruleSetRules(["ChinaMedia"], "🌏 国内媒体"),
            ...ruleSetRules(["ProxyMedia"], "🌍 国外媒体"),

            // 16. 代理列表
            ...ruleSetRules(["ProxyGFWlist"], "🚀 节点选择"),

            // 17. 国内域名（直连）
            ...ruleSetRules(["ChinaDomain"], "🎯 全球直连"),
            ...ruleSetRules(["ChinaExtra"], "🎯 全球直连"),
            ...ruleSetRules(["ChinaCompanyIp"], "🎯 全球直连"),
            ...ruleSetRules(["Download"], "🎯 全球直连"),

            // 18. IP规则
            ...ruleSetRules(["ChinaIPs"], "🎯 全球直连"),

            // 19. 兜底规则
            "MATCH,🐟 漏网之鱼"
        ];

        console.log(`配置生成完成 - 节点总数: ${allProxies.length}, 地区组: ${regionGroups.length}`);

        return config;

    } catch (error) {
        console.error("配置生成错误:", error);
        return config;
    }
}
