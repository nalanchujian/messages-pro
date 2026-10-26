import { platforms, sources as catalogSources } from './value-playbook-sources'
import type { ProductId } from './value-playbook-sources'

export { platforms }
export const frameworkScope = '聚焦团队运营多个 OnlyFans 创作者账号的场景，围绕聊天销售、粉丝关系、内容复用、团队协作与权限管理，对比四家平台的公开官方资料。'
export const executiveSummary = {
  conclusion: 'Onlyfans CRM 的核心价值，是持续经营客户与内容、复制有效销售能力，并让多人、多账号的业务始终可控。',
  perspectives: [
    {
      title: '促进收入增长',
      text: '让高意向机会及时得到处理，让内容与报价匹配需求，并通过持续跟进和关系维护，争取更多成交与复购。',
      links: [{ id: 'conversion', label: '销售机会转化' }, { id: 'retention', label: '客户持续经营' }],
    },
    {
      title: '扩大可复用的经营能力',
      text: '让已有内容充分参与销售，让成熟经验被更多员工使用，在有限时间内承接更多有效工作。',
      links: [{ id: 'content', label: '内容资产回报' }, { id: 'team', label: '经营产能与能力复制' }],
    },
    {
      title: '保持规模化经营可控',
      text: '业务交给团队后，仍能限定账号访问和操作权限，并通过执行记录核对发信责任。',
      links: [{ id: 'control', label: '经营可控性' }],
    },
  ],
}
export type ValueId = 'conversion' | 'content' | 'retention' | 'team' | 'control'

// Each factual statement must cite one official document and its matching section.
// Do not compose independent features into a workflow unless the source documents it.
export interface EvidenceClaim {
  text: string
  ref: string
  section: string
}
export interface Solution {
  platform: ProductId
  feature: string
  claims: EvidenceClaim[]
  limits: EvidenceClaim[]
  refs: string[]
}
export interface LandingPoint {
  id: string
  title: string
  problem: string
  mechanism: string
  example: string
  owner: string
  inflowwAssessment: {
    status: 'Infloww 已覆盖核心能力' | 'Infloww 提供管理数据' | '竞品有可借鉴增量' | '关键差异待验证'
    text: string
    refs: string[]
  }
  solutions: Solution[]
}
export interface BusinessValue {
  id: ValueId
  short: string
  title: string
  thesis: string
  scope: string
  points: LandingPoint[]
}
const c = (text: string, ref: string, section: string): EvidenceClaim => ({ text, ref, section })
const s = (platform: ProductId, feature: string, claims: EvidenceClaim[], limits: EvidenceClaim[] = []): Solution =>
  ({ platform, feature, claims, limits, refs: [...new Set([...claims, ...limits].map(claim => claim.ref))] })

const valueCatalog: BusinessValue[] = [
  {
    id: "conversion",
    short: "销售机会转化",
    title: "提高销售机会的有效转化",
    thesis: "减少机会遗漏，让更多销售机会转化为收入。",
    scope: "经营对象是一轮销售机会，包含首次购买和再次购买。重点是先处理谁、提供什么、何时再跟进；跨周期的关系维护归入“客户持续经营”。",
    points: [
      {
        id: "prioritize",
        title: "让值得处理的机会先被看见",
        problem: "消息按时间挤在一起，新买家、老高价值粉丝和普通闲聊争抢同一份注意力。",
        mechanism: "把消费与行为信号转为可操作的队列，缩短高意向粉丝的等待时间。",
        example: "同一班次同时进来 30 条消息：优先处理刚购买后追问、近期活跃且有消费记录的会话。",
        owner: "班次主管 + 聊天员工",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：收件箱按最新／最早排序，支持 Priority 筛选；官方 Fan Insights 另列消费力分层，但不是会话排序。借鉴方向：评估 Supercreator 的行为优先级排序。待确认：Priority 的判定规则和新排序的实际效果。', refs: ['I22', 'I8', 'S1'] },
        solutions: [
          s("infloww", "Messages Pro · 会话筛选与时间排序", [
            c("收件箱展示粉丝标签与消费总额；近期购买 PPV 的粉丝也有对应标签，便于员工辨认。", "I15", "About Fan tags"),
            c("会话列表提供“最新优先／最早优先”排序，并可按 Priority、Unread、Unread with tips 等条件筛选。", "I22", "Viewing and creating messages"),
          ], [
            c("官方资料列出的是筛选和时间排序，未说明收件箱会按消费与行为信号自动排列会话。", "I22", "Viewing and creating messages"),
            c("Smart Lists 是另一项粉丝分层能力：可按消费建立定向触达名单，名单约每 6 小时更新。", "I6", "What are Smart Lists?"),
          ]),
          s("supercreator", "Inbox Copilot · 优先级与标签", [
            c("根据近期消费、消息和订阅等信息展示粉丝优先级；Hot Buyer 标记过去 48 小时购买过的粉丝，New 标记过去 7 天加入的粉丝。", "S1", "How it works"),
            c("收件箱可按优先级、消费和订阅时长筛选，并隐藏已过期粉丝或创作者账号。", "S1", "Filter your inbox"),
          ]),
          s("onlymonster", "Buying Power · 会话购买潜力", [
            c("打开会话可查看粉丝 0–5 分的 Buying Power，以及消费额、平均 PPV 和近期购买。", "O7", "Buying Power section"),
            c("官方更新记录说明 Buying Power 分数也展示在聊天列表中，便于先辨认潜在高价值会话。", "O11", "14 November - Version 3.35.0"),
          ]),
          s("creatorhero", "Fan Spend Colors · 收件箱消费提示", [
            c("可按粉丝消费门槛设置颜色，在消息收件箱突出高、低消费粉丝。", "C16", "Fan Spend Colors"),
          ], [
            c("文档说明的是消费颜色提示，未说明会自动改变会话排序。", "C16", "Fan Spend Colors"),
          ]),
        ],
      },
      {
        id: "offer",
        title: "让内容、价格与当前需求匹配",
        problem: "统一报价容易向低预算粉丝报高价，也可能低估高意向粉丝对特定内容的接受度。",
        mechanism: "在报价时提供购买历史与内容信息，减少盲猜，让推荐更贴近粉丝的需求与预算。",
        example: "粉丝询问一套新内容：先检查是否买过、通常买什么价格，再决定推荐哪个组合。",
        owner: "内容运营 + 聊天员工",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：聊天侧可看粉丝 PPV 均价等消费数据，素材建议价由员工设置。借鉴方向：参考 Supercreator，按粉丝购买历史提示报价区间与价格偏差。待确认：当前版本有无同类提示，需求判断仍需结合对话。', refs: ['I8', 'I11', 'S2'] },
        solutions: [
          s("infloww", "Fan Insights + Vault Pro", [
            c("聊天侧展示 PPV 消费总额、平均值和打赏信息，供员工查看粉丝历史消费。", "I8", "Spending behavior"),
            c("素材可维护备注、标签和建议价格；这些字段由员工在媒体详情中编辑。", "I11", "Viewing and editing media details"),
          ]),
          s("supercreator", "Pricing Copilot + PriceGuard", [
            c("展示建议价格区间及原因；输入价格时，PriceGuard 提示可能偏低或偏高的报价。", "S2", "Pricing Insights & PriceGuard"),
            c("同时提供最高、平均 PPV 价格和购买记录图；可显示未购买的 PPV，并查看关联内容。", "S2", "Pricing Metrics"),
          ]),
          s("onlymonster", "Fan Information + Vault", [
            c("Buying Power 区域可切换账号与机构视角，查看平均 PPV、平均打赏和近期购买，并进入 PPV 时间线。", "O7", "Buying Power section"),
            c("自定义文件夹内的素材可维护描述、标签和 Recommended Price，为团队提供内容信息及参考价。", "O10", "Media Organization"),
          ]),
          s("creatorhero", "Fan Info · PPV 价格历史", [
            c("粉丝资料展示 PPV 平均价、最高价、购买率和最近购买时间。", "C6", "PPV Stats"),
            c("PPV 时间线区分已购与未购，并呈现发送日期、价格等记录。", "C6", "View PPV Timeline"),
          ]),
        ],
      },
      {
        id: "followup",
        title: "把未成交机会接着处理",
        problem: "PPV 发出以后无人回看：未读、看过未买、已经购买被混在一起。",
        mechanism: "把交易状态变成下一步行动，减少遗漏，并避免继续催促已购买者。",
        example: "一条付费消息已发出一段时间仍未购买：先区分没看见与不感兴趣，再决定是否提醒。",
        owner: "聊天员工 + 自动化配置人",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：可从未购直聊 PPV 报表返回会话；购买后自动触达不等于未购跟进。借鉴方向：评估 CreatorHero 的单条 PPV 延时提醒。待确认：Infloww 当前是否已有未购触发。', refs: ['I3', 'I9', 'C2'] },
        solutions: [
          s("infloww", "Message Dashboard · 人工回到会话", [
            c("消息报表可按购买状态、价格、发送者等条件筛选。", "I3", "Sorting and filtering through messages"),
            c("Direct messages 记录的 Actions 可打开对应聊天，供员工继续处理。", "I3", "How to open a conversation"),
          ], [
            c("报表约每 10 分钟更新；Direct messages 不含自动消息和群发消息，仅记录通过 Infloww 发送的员工直聊消息。", "I3", "How to monitor employee messages"),
          ]),
          s("creatorhero", "PPV Overview + PPV Follow-Ups", [
            c("PPV Overview 区分未看、已看、未回复、已回复和已购状态，记录可直接打开聊天。", "C1", "Key Features"),
            c("PPV Follow-Ups 可设置延迟分钟数、是否包含未看消息的粉丝和跟进文案，随后自动发送。", "C2", "Page Features"),
          ], [
            c("每条 PPV 对同一粉丝只跟进一次；已购买的粉丝会被排除。", "C2", "FAQ"),
          ]),
        ],
      },
    ],
  },
  {
    id: "content",
    short: "内容资产回报",
    title: "提高内容资产的经营回报",
    thesis: "提高内容复用效率，让已有素材持续创造收益。",
    scope: "经营对象是内容及内容组合。与销售转化共享报价动作，但这里关注跨粉丝、跨周期的内容收益。",
    points: [
      {
        id: "find-content",
        title: "找到适合内容，并避免重复售卖",
        problem: "素材越来越多，员工找不到对应内容，或把粉丝已经买过的内容再次推荐。",
        mechanism: "把可查找性和单个粉丝的购买记忆放在选材环节，降低操作损耗与重复销售。",
        example: "粉丝想看旅行主题内容：员工按主题找素材，再核对免费发送和购买历史。",
        owner: "素材管理员 + 聊天员工",
        inflowwAssessment: { status: 'Infloww 已覆盖核心能力', text: '现状：Vault Pro 可搜索素材，并过滤当前粉丝已看或已解锁的内容；Supercreator 也提供逐粉丝素材状态。优化方向：验证过滤能否减少重复推荐，不把可选过滤写成强制拦截。', refs: ['I11', 'S11'] },
        solutions: [
          s("infloww", "Vault Pro · 搜索与已看过滤", [
            c("可按备注、标签或历史 PPV 文案搜索素材。", "I11", "Filtering the vault by media details"),
            c("提供隐藏粉丝已看、已解锁或已在创作者动态中发布内容的过滤开关。", "I11", "Filtering the vault by content seen type"),
          ]),
          s("supercreator", "Vault Copilot · 单粉丝素材状态", [
            c("素材库标出对当前粉丝已发送、已购买、免费发送或发布在动态中的素材。", "S11", "What can you find in the Super Vault?"),
          ], [
            c("重复上传的素材按不同实例记录；系统不会扫描文件内容来识别重复，Super Mass 也不提供这种逐粉丝发送状态跟踪。", "S11", "FAQs"),
          ]),
          s("onlymonster", "Vault Labeling + PPV History", [
            c("素材用标签区分免费发送、已付费、未付费和已发布状态。", "O10", "Vault Labeling"),
            c("PPV History 可查看发送内容、日期、价格及购买情况。", "O10", "PPV History"),
          ], [
            c("重新上传的相同文件会生成独立记录，不会继承原素材的发送或购买标签。", "O10", "Vault Labeling"),
          ]),
          s("creatorhero", "Vault · 搜索与分类", [
            c("通过搜索、分类及照片／视频／GIF 类型筛选查找素材；分类可创建、重命名和删除。", "C12", "Search and Filter"),
            c("可按最近、点赞或打赏等方式排序。", "C12", "Sort Options"),
          ], [
            c("该文档只证实素材查找与分类，未说明会在当前粉丝选材时提示其已购内容。", "C12", "Search and Filter"),
          ]),
        ],
      },
      {
        id: "package",
        title: "把散落素材变成可复用的销售组合",
        problem: "好内容需要反复找图、写介绍、配价格；经验留在个别员工手里。",
        mechanism: "一次整理文本、素材和使用条件，多次在合适场景复用，减少内容上架与销售准备成本。",
        example: "把一个旅行系列整理为“介绍 → 预览 → 付费组合”，员工按对话阶段调用。",
        owner: "内容运营 + 资深销售",
        inflowwAssessment: { status: 'Infloww 已覆盖核心能力', text: '现状：Scripts 可复用图文序列、提示下一条，并查看发送与购买表现；发送由员工决定，竞品模板也用于复用。优化方向：评估序列使用效果，不把 Scripts 当作自动销售流程。', refs: ['I2', 'S9', 'O8', 'C7'] },
        solutions: [
          s("infloww", "Scripts · 消息序列", [
            c("可创建话术序列，并在条件步骤内配置最多 3 个选项，发送时由员工选择。", "I2", "Creating a script sequence"),
            c("聊天输入“/”后按名称、序列、标签或正文关键词查找话术；发送序列中的话术后，会提示下一条。", "I2", "Using Scripts in Messages Pro"),
            c("脚本可查看发送、购买及收入统计，供团队复盘其使用表现。", "I2", "Optimize your messaging strategies with key statistics"),
          ]),
          s("supercreator", "Message Library · 消息与媒体模板", [
            c("消息库可预先保存文案、媒体、价格、标题和文件夹，也可设置个性化定价后重复调用。", "S9", "How to use your Message Library"),
          ]),
          s("onlymonster", "Message Templates · 内容与价格模板", [
            c("模板支持保存消息内容，并配置付费文字或付费媒体的价格。", "O8", "Message Pricing"),
            c("Insert 将模板放入编辑区继续修改；Send 按模板当前配置直接发送。", "O8", "Inserting and Sending Templates"),
          ]),
          s("creatorhero", "Scripts · 文本与媒体组合", [
            c("创建脚本时可保存标题、正文、姓名变量和媒体，并放入指定文件夹。", "C7", "Creating a Script"),
            c("脚本支持导入和导出，方便批量保存与恢复。", "C7", "Export & Import Scripts"),
          ]),
        ],
      },
      {
        id: "content-review",
        title: "用销售反馈决定复用与制作方向",
        problem: "只知道总销售额，不知道哪些内容适合继续卖，哪些只是曝光多。",
        mechanism: "把内容、发送与购买结果关联，区分“卖得多”和“单位机会贡献高”。",
        example: "内容负责人打开旅行系列文件夹，查看哪些素材被发送、被购买，以及对应的销售消息。",
        owner: "内容负责人 + 经营分析",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：Vault Pro 已有素材和文件夹统计；CreatorHero 可沿文件夹、PPV、发送记录下钻。借鉴方向：核实 Infloww 能否贯通同一查看路径。待确认：实际分析需求；打包收入不可按素材求和。', refs: ['I12', 'I3', 'C13'] },
        solutions: [
          s("infloww", "Vault Pro · 素材统计", [
            c("素材层展示发送次数、解锁次数／比例与毛收入。", "I12", "Viewing statistics in Grid and Table views"),
            c("非默认文件夹和分类汇总发送数、收入，并以合计解锁数除以合计发送数计算整体解锁率。", "I12", "Understanding folder and category summaries"),
          ], [
            c("素材统计从 2026 年 8 月 27 日开始提供，不包含此前数据；直接从 OnlyFans 或其他流程发送的内容可能造成统计差异。", "I12", "Important information about statistics"),
            c("OnlyFans Mass Messages（OFMM）的发送、解锁及收入不计入；解锁次数与毛收入不扣除拒付（chargeback）。", "I12", "文章开篇 / Vault Pro provides the following statistics"),
            c("多素材打包销售时，每个素材都会记入整笔消息价格；不能把这些素材的收入直接相加当作独立交易收入。", "I12", "Important information about statistics"),
          ]),
          s("creatorhero", "PPV Tracking · 文件夹到消息", [
            c("在文件夹层查看收入、购买率和购买数，进入后查看具体 PPV 的发送数、购买数、净收入及平均净价。", "C13", "Detailed PPV Tracking"),
            c("进一步进入单条消息可查看各次发送及购买记录，并通过 View in Chat 回到原会话。", "C13", "Message Table"),
          ]),
        ],
      },
    ],
  },
  {
    id: "retention",
    short: "客户持续经营",
    title: "延续客户关系，促进持续消费",
    thesis: "延续客户关系，促进复购、续订与回流。",
    scope: "经营对象是同一位粉丝跨周期的关系。重点是记住偏好、接续服务和生命周期触达；一轮具体成交的处理归入“销售机会转化”。",
    points: [
      {
        id: "memory",
        title: "让关系记忆跟着粉丝走",
        problem: "换人、换班或隔几天再聊时，偏好与承诺丢失，粉丝反复被问同样的问题。",
        mechanism: "在回复前恢复必要上下文，降低重复询问和不相关推荐。",
        example: "晚班接手一位老粉丝：先看偏好、最近购买与上次沟通，而不是重新从头认识。",
        owner: "每位经办员工",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：Infloww 以人工资料和备注承接关系；Supercreator 可从对话提取信息，CreatorHero 可生成聊天摘要。借鉴方向：评估自动整理能否缩短交接。待确认：Infloww 当前 AI 摘要是否可用；2026 年 5 月对比页不能证明现状。', refs: ['I8', 'I23', 'C14', 'S8'] },
        solutions: [
          s("infloww", "Fan Insights · 资料与备注模板", [
            c("聊天侧可维护昵称、生日、所在地等资料。", "I8", "Profile"),
            c("备注区支持自由文本和自定义模板。", "I8", "Notes"),
          ], [
            c("官方对比页将 AI fan summary 标为开发中，但该表注明截至 2026 年 5 月，仅作为历史状态依据，不代表当前版本状态。", "I23", "Platform comparison / OnlyFans"),
          ]),
          s("supercreator", "Fans CRM · AI 整理与团队备注", [
            c("Fill with AI 从对话中提取粉丝偏好和资料，填入或更新 CRM 字段。", "S8", "Fill with AI"),
            c("Notes Template 可设置机构默认备注结构，供团队在粉丝资料中使用。", "S8", "Notes Template"),
          ]),
          s("onlymonster", "Advanced Fan Information · 偏好与备注", [
            c("粉丝资料可记录生日、时区、订阅和续订状态，并查看最近回复、最近阅读等信息。", "O7", "General"),
            c("Preferences 可手工记录和编辑粉丝偏好。", "O7", "Preferences"),
          ]),
          s("creatorhero", "Fan Notes + Chat Summary", [
            c("Fan Notes 支持备注模板和聊天界面内编辑，资料随当前粉丝展示。", "C6", "Fan Notes"),
            c("Summarize Chat 弹窗可选择时间范围并生成摘要，也可刷新或导出。", "C14", "Summarizing a Chat"),
          ]),
        ],
      },
      {
        id: "lifecycle",
        title: "在关键生命周期节点主动经营",
        problem: "新订阅没被欢迎、即将到期未联系、买完后没有后续，关系自然冷却。",
        mechanism: "让时间或状态触发合适动作，把重复检查交给系统，把语境判断留给人员。",
        example: "对新粉先介绍，对临期付费粉解释后续内容，对已到期老买家开展一次有理由的唤回。",
        owner: "生命周期运营",
        inflowwAssessment: { status: 'Infloww 已覆盖核心能力', text: '现状：Smart Messages 已有生命周期触发与排除规则，过期触达可设多步序列并在粉丝回复后停止；Supercreator 另有跨阶段可视化分支。优化方向：先评估续订与回流效果，再判断是否需要跨场景流程。', refs: ['I9', 'I16', 'S14'] },
        solutions: [
          s("infloww", "Smart Messages · 生命周期触发", [
            c("提供延迟欢迎、即将到期、已过期、生日、购买及重新订阅等消息类型；生日触发使用粉丝资料中的生日。", "I9", "Smart Messages Types"),
            c("已过期粉丝触达可配置后续消息序列，并根据粉丝是否回复决定下一条消息。", "I16", "Build the message or sequence"),
          ], [
            c("一个粉丝同时符合多个类型时，只发送优先级最高的一类；官方文档给出了类型优先顺序。", "I9", "FAQs"),
          ]),
          s("supercreator", "Message Flow · 分阶段自动触达", [
            c("可按回复与否设置条件分支和时间延迟，自动发送后续消息或 PPV。", "S14", "How it works, step by step"),
            c("新粉丝与订阅三个月的粉丝可进入不同阶段，按所处阶段接收内容。", "S14", "How it works, step by step"),
          ]),
          s("onlymonster", "Auto Messages · 状态触发", [
            c("提供欢迎、上线、已过期和即将过期四类触发；即将过期触达适用于关闭自动续订的粉丝。", "O9", "Available Triggers / Send Message In"),
            c("触发后的动作可选择发送消息，或启动 Mimic AI 会话。", "O9", "Action Type"),
          ]),
          s("creatorhero", "Expiring Fans · 到期前自动消息", [
            c("可针对即将到期的粉丝自动发送消息，并配置发送时机与内容。", "C17", "Settings Overview"),
          ]),
        ],
      },
      {
        id: "relationship-review",
        title: "持续查看粉丝增长与留存",
        problem: "只看当期收入，很难知道粉丝基盘是在积累，还是在流失。",
        mechanism: "持续呈现新增、活跃、保留和流失情况，为关系经营提供背景。",
        example: "经营负责人查看老粉的订阅状态与购买历史，区分仍在互动、持续购买和已经沉默的人。",
        owner: "经营负责人",
        inflowwAssessment: { status: '关键差异待验证', text: '现状：Fan Reports 有增长和消费数据；官方介绍留存表，本地前端却未启用该组件。待验证方向：确认实际入口和留存指标，再判断能否开展订阅批次分析。', refs: ['V-I2'] },
        solutions: [
          s("infloww", "Fan Reports · 新增、流失与保留", [
            c("报告呈现新增、流失、保留和活跃粉丝，以及自动续订开启／关闭情况；导出时可选日期范围与指标。", "V-I2", "文章开篇"),
            c("官方资料介绍留存表，用于查看粉丝在一段时间内维持订阅的情况；本地前端页面当前未启用该表。", "V-I2", "Understanding Fan Retention"),
          ]),
          s("supercreator", "Creator Analytics · 订阅增长", [
            c("订阅分析展示新增、流失和活跃订阅者及其消费，并提供与上一周期的比较。", "V-S1", "Subscribers and growth"),
          ]),
        ],
      },
    ],
  },
  {
    id: "team",
    short: "经营产能与能力复制",
    title: "扩大经营产能，复制有效经验",
    thesis: "扩大有效工作量，降低对个别员工的依赖。",
    scope: "经营对象是人员、经验与执行流程，关注分工、培训和可承担的工作量。账号访问、敏感操作和责任追溯归入“经营可控性”。",
    points: [
      {
        id: "ownership",
        title: "划分工作范围，减少多人协作冲突",
        problem: "多人看到同一收件箱，容易重复回复，也容易都以为别人会处理。",
        mechanism: "通过分组与范围过滤减少交叉处理；人员责任和班次权限需要分别明确。",
        example: "早晚班交替：明确每组由谁处理、未完事项交给谁，并检查超时会话。",
        owner: "班次主管",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：Infloww 可分组过滤，但不能把员工绑定到组，员工仍可看完整收件箱；Supercreator 按聊天员建立颜色组。借鉴方向：评估组与负责人的明确映射。待确认：颜色组不等于强制隔离或交接闭环。', refs: ['I1', 'S6'] },
        solutions: [
          s("infloww", "Split Inbox · 分组与范围过滤", [
            c("收件箱最多拆成 9 组；员工按负责的组过滤，新订阅者的自动分配以长期工作量平衡为目标。", "I1", "How to use Split Inbox"),
            c("可手动把粉丝移到其他组；修改组数也会重新分配粉丝。", "I1", "Moving fans to other groups"),
          ], [
            c("当前版本不能把员工直接绑定到分组，官方建议另行告知员工负责哪些组。", "I1", "FAQs"),
          ]),
          s("supercreator", "Split Inbox · 固定颜色分组", [
            c("按聊天员工设置颜色组，随机把粉丝分入各组；粉丝通常保持在原组。", "S6", "How does it work?"),
            c("最多设置 3 个颜色组；改变组数会重新生成分组，部分粉丝会换组。", "S6", "How to use it?"),
          ]),
          s("onlymonster", "Inboxes · 分组与显示范围", [
            c("Inboxes 最多支持 6 组，可自定义名称和颜色，并选择显示哪些组。", "O6", "Enhanced System Highlights"),
          ]),
        ],
      },
      {
        id: "repeatability",
        title: "把优秀员工的经验交给整个团队",
        problem: "新人从零摸索，优秀员工离开后，常用话术和内容推荐经验也难以延续。",
        mechanism: "把成熟员工的消息与内容组合沉淀为共享模板，减少重复准备和新人摸索。",
        example: "把欢迎、需求确认和内容推荐整理成话术序列，供不同员工按场景调用。",
        owner: "培训负责人 + 资深员工",
        inflowwAssessment: { status: 'Infloww 已覆盖核心能力', text: '现状：Scripts 已支持跨创作者共享、从聊天保存话术；竞品也有跨账号复制和模板复用。优化方向：明确适用场景与维护人，验证新人能否稳定调用，而非重复建设共享功能。', refs: ['I2', 'C7', 'S9'] },
        solutions: [
          s("infloww", "Scripts · 跨创作者共享话术", [
            c("话术和序列可在不同创作者之间共享，团队可复用同一套已整理内容。", "I2", "Sharing among creators"),
            c("聊天中的消息可直接另存为新话术，再用于后续会话。", "I2", "Quick adding a new script"),
          ]),
          s("supercreator", "Message Library · 模板匹配", [
            c("输入文字时会匹配消息库并提供自动补全；已向当前粉丝发过的模板会以划线方式提示。", "S9", "How to use your Message Library"),
          ]),
          s("onlymonster", "Message Templates · 下一步提示", [
            c("模板发送后会提供下一条模板的导航提示。", "O8", "Navigation Assistance"),
          ]),
          s("creatorhero", "Scripts · 跨账号复制", [
            c("通过文件夹旁的复选框，可将脚本复制到其他创作者账号。", "C7", "FAQ"),
          ]),
        ],
      },
      {
        id: "management",
        title: "根据工作负荷安排人员与培训",
        problem: "主管只看总销售排名，难以区分人员投入、工作负荷与能力差异。",
        mechanism: "结合工时、消息与响应情况了解工作分布，为排班和培训提供依据。",
        example: "员工销售下降：先看是否少了机会，再看回复和报价过程，最后讨论培训或排班。",
        owner: "主管 + 培训负责人",
        inflowwAssessment: { status: 'Infloww 提供管理数据', text: '现状：Infloww 有销售、直聊、排班及打卡工时；Supercreator 工时按发信活动估算，CreatorHero 也统计活跃时间。优化方向：主管结合数据和会话样本安排排班、培训，不称为系统自动诊断。', refs: ['I4', 'I3', 'S5', 'C4'] },
        solutions: [
          s("infloww", "Employee Reports · 人员投入与工作量", [
            c("员工报表包含销售、消息、解锁率、排班／打卡工时和响应时间等指标。", "I4", "Key metrics explained"),
          ]),
          s("supercreator", "Chatter Analytics · 员工与会话明细", [
            c("Team Overview 汇总员工销售、消息、估算工时和薪酬。", "S5", "Team Overview"),
            c("Messages Breakdown 可通过 View Chat 查看具体对话。", "S5", "Messages Breakdown"),
          ], [
            c("Activity 的工时按有发信活动的 30 分钟区间估算，不等同于精确打卡时长。", "S5", "Activity"),
          ]),
          s("creatorhero", "Chatter Tracking · 员工工作明细", [
            c("Chatter Tracking 的员工表展示收入、响应时间、消息和 PPV 发送／购买情况，并可进入个人详情。", "C4", "All Chatters Table"),
          ]),
        ],
      },
    ],
  },
  {
    id: "control",
    short: "经营可控性",
    title: "业务交给团队，经营仍然可控",
    thesis: "明确访问与操作边界，掌握执行过程和责任。",
    scope: "经营对象是账号、操作权限与责任。关注谁能进入、能做什么、执行后如何核对；工作速度与经验复用归入“经营产能与能力复制”。",
    points: [
      {
        id: "account-access",
        title: "按工作需要授予账号访问",
        problem: "多人共用创作者账号，容易把登录凭据与长期访问权一起交给员工。",
        mechanism: "将账号访问配置为可授予、可限制的工作权限，减少凭据共享和非工作时段访问。",
        example: "新员工只获得所负责账号的访问；启用班次限制后，下班时段无法再打开账号。",
        owner: "账号负责人 + 管理员",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：Infloww 可按员工分配创作者并停用员工账号，证实的是平台数据访问；OnlyMonster 可限制非班次账号访问。借鉴方向：评估时段控制。待确认：Infloww 是否已有同类限制，以及 OnlyFans 会话的访问边界。', refs: ['I18', 'O4', 'S12'] },
        solutions: [
          s("infloww", "Team Management · 员工账号与创作者授权", [
            c("员工通过一次性邀请链接验证账号并设置密码；管理员随后可为员工分配创作者，员工只能查看获分配创作者的数据与表现。", "I18", "How to manage employees on Infloww"),
            c("停用员工会撤销其对 Infloww 及相关数据的访问，同时保留非活跃的员工账号记录。", "I18", "How to delete or deactivate employees on Infloww"),
          ]),
          s("supercreator", "SharedLogin · 共享会话与访问控制", [
            c("通过共享已登录会话，让员工访问获授权的账号，无需共享账号密码；管理员可随时允许或阻止账号访问。", "S12", "Why use SharedLogin™?"),
          ], [
            c("新成员默认没有任何 OnlyFans 账号权限，需要在 Team Members 页面配置。", "S12", "Permissions"),
          ]),
          s("onlymonster", "Shift-Based Access · 班次访问限制", [
            c("可按角色启用班次访问限制；开启后，该角色的成员只能在排班时段访问账号。", "O4", "Role-Based Access"),
          ], [
            c("具备 View Shifts 权限的成员可在班次临近结束时延长 15 分钟。", "O4", "Shift Extension"),
          ]),
          s("creatorhero", "Creators · 员工账号范围", [
            c("管理员可为每位创作者设置团队成员访问范围。", "C18", "Access"),
          ]),
        ],
      },
      {
        id: "operation-permissions",
        title: "限定岗位可见数据与操作",
        problem: "聊天员工需要接待粉丝，但不一定需要查看全部收入、修改账号设置或删除内容。",
        mechanism: "把工作所需功能、敏感操作和数据范围分别授权，让权限与岗位责任相符。",
        example: "聊天员工使用消息与素材；主管查看下属业务数据，管理员保留敏感设置权限。",
        owner: "经营负责人 + 管理员",
        inflowwAssessment: { status: '关键差异待验证', text: '现状：Infloww 官方证实页面与数据权限，本地前端另有媒体删除和移除创作者记录权限；CreatorHero 列出 OnlyFans 细粒度操作权限。待验证方向：核对 Infloww 权限的实际生效范围，勿把创作者记录移除等同于删除 OnlyFans 账号。', refs: ['I13', 'I22', 'C15'] },
        solutions: [
          s("infloww", "Role Permissions · 功能与数据范围", [
            c("可按角色授予或限制功能页面，并设置本人、本人和下属、全部数据三类数据范围。", "I13", "Adjust permissions"),
            c("Owner 和 Admin 可直接访问银行菜单，其他角色需要获得对应权限后才能访问。", "I22", "文章开篇"),
          ]),
          s("supercreator", "Roles and Permissions · 岗位权限", [
            c("提供 Chatter、Account Manager、Supervisor、Owner 和 Analyst 五类角色，分配后可进一步调整成员权限。", "S13", "Setting Roles and Permissions"),
            c("可限制员工查看银行信息和账号敏感设置；启用限制后，相应功能对员工隐藏。", "S13", "Sensitive Information on OnlyFans"),
          ]),
          s("onlymonster", "Roles & Permissions · 敏感操作权限", [
            c("可按角色配置功能和敏感操作的访问权限。", "O13", "General Permissions"),
          ]),
          s("creatorhero", "Roles · 操作权限配置", [
            c("可创建自定义角色，分别选择 OnlyFans 和 CreatorHero 后台权限，再分配给团队成员。", "C15", "Create Custom Roles / Assign and Update Roles"),
            c("OnlyFans 权限包括消息处理、媒体删除、银行信息访问和删除 OnlyFans 账号等操作。", "C15", "OnlyFans Permissions"),
          ]),
        ],
      },
      {
        id: "execution-traceability",
        title: "追溯消息执行，核对发信责任",
        problem: "业务由多人接续，管理者需要了解谁发了什么，以及消息如何产生。",
        mechanism: "通过可查询的消息记录核对发送者、内容与来源，减少只凭口头说明处理问题。",
        example: "出现回复争议时，先按发送者和时间查消息，再回到原会话核对上下文。",
        owner: "主管 + 经营负责人",
        inflowwAssessment: { status: '竞品有可借鉴增量', text: '现状：Infloww 可追溯员工直聊消息，报表约 10 分钟更新；Supercreator 覆盖多类消息，OnlyMonster 的记录数秒内可见。借鉴方向：优先评估跨消息类型与近实时质检。待确认：输入方式细分是否另有管理价值。', refs: ['I3', 'S5', 'O5'] },
        solutions: [
          s("infloww", "Message Dashboard · 消息记录", [
            c("可查看员工发送或撤回的消息，以及购买状态、收入和响应时间；可从记录打开会话了解上下文。", "I3", "How to monitor employee messages"),
          ], [
            c("消息报表约每 10 分钟更新；Direct messages 不含自动和群发消息，仅包含通过 Infloww 发送的员工直聊消息。", "I3", "How to monitor employee messages"),
          ]),
          s("supercreator", "Chatter Analytics · 多类消息记录", [
            c("Chatter Messages 可查询工作区收发消息，并按消息类别、方向、类型、购买状态和时间筛选。", "S5", "Chatter Messages"),
            c("类别包括聊天员工直聊、群发、自动生成及系列消息等。", "S5", "Chatter Messages"),
          ]),
          s("onlymonster", "Message Tracker · 发信过程追溯", [
            c("消息记录区分手输、粘贴、AI 助手和模板等输入来源，并显示发送者、价格及购买状态。", "O5", "Table Columns"),
            c("可将筛选后的消息记录导出为 CSV 或 XLSX。", "O5", "Export"),
          ], [
            c("Message Tracker 中的消息自发送日起保存 3 个月。", "O5", "How It Works"),
          ]),
          s("creatorhero", "Message History · 消息历史", [
            c("可按消息类型和发送者筛选历史记录，查看发送者、粉丝、日期，并跳转到原消息。", "C19", "Page Features"),
          ]),
        ],
      },
    ],
  },

]

const coreOrder: ValueId[] = ['conversion', 'retention', 'content', 'team', 'control']
export const values = coreOrder.map(id => valueCatalog.find(value => value.id === id)!)

const usedRefs = new Set(values.flatMap(value => value.points.flatMap(point => [...point.inflowwAssessment.refs, ...point.solutions.flatMap(solution => solution.refs)])))
export const sources = catalogSources.filter(source => usedRefs.has(source.id))
export const sourceMap = new Map(sources.map(source => [source.id, source]))
