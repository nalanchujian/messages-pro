import { platforms, sources as catalogSources } from './value-playbook-sources'
import type { ProductId } from './value-playbook-sources'

export { platforms }
export const auditedAt = '2026-10-22'
export const frameworkScope = '以聊天销售内容为主、由多名员工运营多个创作者账号的 CRM。五类是本报告的核心价值框架，编号不代表统一优先级。'
export const auditNote = '既有资料于 2026 年 10 月 21 日核查；经营可控性相关资料于 2026 年 10 月 22 日补充核查。'
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
      text: '业务交给团队后，仍能限定账号访问和操作权限，并通过执行记录掌握过程、核对归属。',
      links: [{ id: 'control', label: '经营可控性' }],
    },
  ],
  implication: '围绕销售、客户与内容打通日常经营流程，同时建设能力复用与权限控制。建设次序取决于业务瓶颈与团队规模。',
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
  inflowwProposal: string
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
        inflowwProposal: "补齐实时机会优先级队列：综合近期消费、入站消息、订阅状态与等待时长排序，并让员工可直接从队列进入会话。",
        solutions: [
          s("infloww", "Smart Lists · 消费分层", [
            c("按累计消费建立粉丝分层名单，可选择是否纳入已过期粉丝。", "I6", "Segment by total spend"),
          ], [
            c("名单通常每 6 小时刷新，首次生成约需 30 分钟。", "I6", "Segment by total spend"),
          ]),
          s("supercreator", "Inbox Copilot · 优先级与标签", [
            c("根据近期消费、消息和订阅等信息展示粉丝优先级；Hot Buyer 标记过去 48 小时购买过的粉丝，New 标记过去 7 天加入的粉丝。", "S1", "How it works"),
            c("收件箱可按优先级、消费和订阅时长筛选，并隐藏已过期粉丝或创作者账号。", "S1", "Filter your inbox"),
          ]),
          s("onlymonster", "Dynamic Fan Lists · 条件名单", [
            c("可按账号消费、机构消费、最近购买和聊天活跃条件建立名单；活跃条件区分“员工已发信”和“粉丝也有回复”。", "O2", "Available Filters"),
            c("名单明细展示消费及最近购买信息，并提供对应会话的 Chat 链接。", "O2", "List of Fans"),
          ]),
          s("creatorhero", "Recent Spend List · 近期消费者", [
            c("选择 1 分钟至 30 天的时间范围，生成近期有消费的粉丝名单。", "C11", "Creating a Recent Spend List"),
          ], [
            c("订阅费不计入这一名单的消费条件。", "C11", "What qualifies as a “Recent Spend”?"),
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
        inflowwProposal: "在报价动作中补齐价格建议与异常提醒：结合该粉丝的购买区间、最高成交价和内容历史给出建议，并提示明显偏高或偏低的价格。",
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
        inflowwProposal: "补齐可配置的 PPV 自动跟进：按未看、已看未购等状态设置等待时间、文案与排除规则，已购后自动停止触达。",
        solutions: [
          s("infloww", "Message Dashboard · 人工回到会话", [
            c("消息报表可按购买状态、价格、发送者等条件筛选。", "I3", "Sorting and filtering through messages"),
            c("Direct messages 记录的 Actions 可打开对应聊天，供员工继续处理。", "I3", "How to open a conversation"),
          ], [
            c("报表约每 10 分钟更新，只记录通过 Infloww 发送的消息。", "I3", "How to monitor employee messages"),
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
        inflowwProposal: "在选材界面直接呈现当前粉丝的已发送、免费发送、已购与未购状态，并可回看对应 PPV 记录，减少进入多处页面核对。",
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
        inflowwProposal: "把话术序列升级为可售卖的内容组合：将文案、预览、媒体、建议价和适用标签打包，并允许员工按需微调后发送。",
        solutions: [
          s("infloww", "Scripts · 消息序列", [
            c("可创建话术序列，并在条件步骤内配置最多 3 个选项，发送时由员工选择。", "I2", "Creating a script sequence"),
            c("聊天输入“/”后按名称、序列、标签或正文关键词查找话术；发送序列中的话术后，会提示下一条。", "I2", "Using Scripts in Messages Pro"),
          ]),
          s("supercreator", "Message Library + Izzy Product Catalog", [
            c("消息库可预先保存文案、媒体、价格、标题和文件夹，也可设置个性化定价后重复调用。", "S9", "How to use your Message Library"),
            c("Izzy 产品目录保存媒体、预览、价格、描述、标签和文案，作为 AI 销售的内容目录。", "S4", "Product Catalog"),
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
        inflowwProposal: "补齐“内容—PPV—会话”的下钻链路，并在组合售卖时提供避免重复归因的收入口径，帮助判断真实的内容贡献。",
        solutions: [
          s("infloww", "Vault Pro · 素材统计", [
            c("素材层展示发送次数、解锁次数／比例与毛收入。", "I12", "Viewing statistics in Grid and Table views"),
            c("文件夹和分类汇总发送数、解锁数、收入，并按整体发送数计算解锁率。", "I12", "Understanding folder and category summaries"),
          ], [
            c("多素材打包销售时，每个素材都会记入整笔消息价格；不能把这些素材的收入直接相加当作独立交易收入。", "I12", "Important information about statistics"),
          ]),
          s("supercreator", "Message Library · 复用畅销 PPV", [
            c("Import PPVs 提供 Recent 与 Best Selling 入口，可把近期或畅销 PPV 导入消息库，作为模板再次使用。", "S9", "How to use your Message Library"),
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
        inflowwProposal: "补齐对话摘要与结构化偏好提取：从近期聊天中生成可编辑摘要，并建议更新偏好、承诺和风险提示，降低交接成本。",
        solutions: [
          s("infloww", "Fan Insights · 资料与备注模板", [
            c("聊天侧可维护昵称、生日、所在地等资料。", "I8", "Profile"),
            c("备注区支持自由文本和自定义模板。", "I8", "Notes"),
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
        inflowwProposal: "补齐已过期粉丝的自动化经营：按历史消费和到期时长分层，配置唤回节奏、暂停条件与效果回看，而非只依赖单次触发消息。",
        solutions: [
          s("infloww", "Smart Messages · 生命周期触发", [
            c("提供延迟欢迎、即将到期、已过期、生日、购买及重新订阅等消息类型；生日触发使用粉丝资料中的生日。", "I9", "Smart Messages Types"),
          ], [
            c("一个粉丝同时符合多个类型时，只发送优先级最高的一类；官方文档给出了类型优先顺序。", "I9", "FAQs"),
          ]),
          s("supercreator", "Expired Fans Automation · 重新建立触达", [
            c("自动关注已过期粉丝，每天约处理 100–200 人，优先关注高消费粉丝，并排除创作者账号。", "V-S2", "How does it work?"),
            c("可在 Automation 页面启用或暂停该自动化。", "V-S2", "How do you start using the Expired Fans automation?"),
          ]),
          s("onlymonster", "Auto Messages · 状态触发", [
            c("提供欢迎、上线、已过期、即将过期及关闭自动续订等触发条件。", "O9", "Available Triggers"),
            c("触发后的动作可选择发送消息，或启动 Mimic AI 会话。", "O9", "Action Type"),
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
        inflowwProposal: "补齐订阅留存与消费的联动看板：按 cohort 对比新增、流失、留存及消费贡献，并支持下钻到具体粉丝名单以便发起行动。",
        solutions: [
          s("infloww", "Fan Reports · 新增、流失与保留", [
            c("报告呈现新增、流失、保留和活跃粉丝，以及自动续订开启／关闭情况；导出时可选日期范围与指标。", "V-I2", "文章开篇"),
            c("留存表查看粉丝在一段时间内维持订阅的情况。", "V-I2", "Understanding Fan Retention"),
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
        inflowwProposal: "补齐“分组—员工—班次”的直接绑定：明确当前负责人、交接对象和超时会话，避免只靠线下告知分工。",
        solutions: [
          s("infloww", "Split Inbox · 分组与范围过滤", [
            c("收件箱最多拆成 9 组；员工按负责的组过滤，新订阅者的自动分配以长期工作量平衡为目标。", "I1", "How to use Split Inbox"),
            c("可手动把粉丝移到其他组；修改组数也会重新分配粉丝。", "I1", "Moving fans to other groups"),
          ], [
            c("当前版本不能把员工直接绑定到分组，官方建议另行告知员工负责哪些组。", "I1", "FAQs"),
          ]),
          s("supercreator", "Split Inbox · 固定颜色分组", [
            c("随机把粉丝分入颜色组，原有粉丝保持在同组。", "S6", "How does it work?"),
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
        problem: "新人从零摸索，优秀员工一离开，沟通节奏、内容选择和异常处理也跟着消失。",
        mechanism: "沉淀适用条件和下一步，把重复操作工具化，让人工集中处理判断与例外。",
        example: "把成熟员工的欢迎、需求确认、内容推荐过程拆成模板，并明确哪些情况必须转人工。",
        owner: "培训负责人 + 资深员工",
        inflowwProposal: "补齐可复用的销售 playbook：除话术外，保存触发条件、步骤、例外处理和转人工规则；可为不同创作者配置语气与事实资料。",
        solutions: [
          s("infloww", "Scripts · 共享话术与序列", [
            c("话术和序列可在不同创作者之间共享，团队可复用同一套已整理内容。", "I2", "Sharing among creators"),
            c("聊天中的消息可直接另存为新话术，再用于后续会话。", "I2", "Quick adding a new script"),
          ]),
          s("supercreator", "Message Library + Izzy Bio", [
            c("输入文字时会匹配消息库并提供自动补全；已向当前粉丝发过的模板会以划线方式提示。", "S9", "How to use your Message Library"),
            c("Izzy 的 Bio 可配置创作者性格、交流风格及事实信息，作为 AI 聊天的人设资料。", "S4", "Bio"),
          ]),
          s("onlymonster", "Message Templates + Mimic 人工接管", [
            c("模板发送后会提供下一条模板的导航提示。", "O8", "Navigation Assistance"),
            c("Mimic 把需要员工处理的会话放入 Escalated Chats 并展示原因；员工发出第一条人工消息后，会话移出该列表。", "O3", "Escalated Chats"),
          ]),
          s("creatorhero", "Scripts + Hero Copilot Skills", [
            c("通过文件夹旁的复选框，可将脚本复制到其他创作者账号。", "C7", "FAQ"),
            c("Hero Copilot 的 Skills 可保存名称、触发条件与操作说明，并选择在机构内共享。", "C5", "Customizing Hero Copilot"),
          ], [
            c("Hero Copilot 可起草内容或保存脚本，但不会向粉丝直接发送消息、PPV 或群发消息。", "C5", "FAQs"),
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
        inflowwProposal: "在人员指标异常处补齐会话下钻与辅导样本：从响应、发送、解锁等指标直接查看代表性对话，形成可执行的排班或培训动作。",
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
        inflowwProposal: "优先补齐受管登录会话与账号级授权：无需共享密码即可按人授予、随时撤销访问，并支持按班次限制打开账号。",
        solutions: [
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
        ],
      },
      {
        id: "operation-permissions",
        title: "限定岗位可见数据与操作",
        problem: "聊天员工需要接待粉丝，但不一定需要查看全部收入、修改账号设置或删除内容。",
        mechanism: "把工作所需功能、敏感操作和数据范围分别授权，让权限与岗位责任相符。",
        example: "聊天员工使用消息与素材；主管查看下属业务数据，管理员保留敏感设置权限。",
        owner: "经营负责人 + 管理员",
        inflowwProposal: "在现有数据范围控制上补齐细粒度的敏感操作权限：按角色配置银行信息、账号设置、媒体删除和账号删除等高风险操作。",
        solutions: [
          s("infloww", "Role Permissions · 功能与数据范围", [
            c("可按角色授予或限制功能页面，并设置本人、本人和下属、全部数据三类数据范围。", "I13", "Adjust permissions"),
          ]),
          s("supercreator", "Roles and Permissions · 岗位权限", [
            c("提供 Chatter、Account Manager、Supervisor、Owner 和 Analyst 五类角色，分配后可进一步调整成员权限。", "S13", "Setting Roles and Permissions"),
            c("可限制员工查看银行信息和账号敏感设置；启用限制后，相应功能对员工隐藏。", "S13", "Sensitive Information on OnlyFans"),
          ]),
          s("creatorhero", "Roles · 操作权限配置", [
            c("可创建自定义角色，分别选择 OnlyFans 和 CreatorHero 后台权限，再分配给团队成员。", "C15", "Create Custom Roles / Assign and Update Roles"),
            c("OnlyFans 权限包括消息处理、媒体删除、银行信息访问和账号删除等操作。", "C15", "OnlyFans Permissions"),
          ]),
        ],
      },
      {
        id: "execution-traceability",
        title: "追溯消息执行，核对销售归属",
        problem: "业务由多人接续，管理者需要了解谁发了什么，以及交易当前归属于谁。",
        mechanism: "通过可查询的消息和销售记录核对执行过程，减少只凭口头说明处理问题。",
        example: "出现报价或销售归属争议时，先核对消息发送者与交易记录，再按权限处理。",
        owner: "主管 + 经营负责人",
        inflowwProposal: "补齐消息来源与归属变更审计：标明手输、模板或 AI 等发送来源，记录销售重新分配历史，并支持按条件导出核对。",
        solutions: [
          s("infloww", "Message Dashboard · 员工消息记录", [
            c("可查看员工发送或撤回的消息，以及购买状态、收入和响应时间；可从记录打开会话了解上下文。", "I3", "How to monitor employee messages"),
          ], [
            c("消息报表约每 10 分钟更新，仅包含通过 Infloww 发送的消息。", "I3", "How to monitor employee messages"),
          ]),
          s("onlymonster", "Message Tracker · 发信过程追溯", [
            c("消息记录区分手输、粘贴、AI 助手和模板等输入来源，并显示发送者、价格及购买状态。", "O5", "Table Columns"),
            c("可将筛选后的消息记录导出为 CSV 或 XLSX。", "O5", "Export"),
          ], [
            c("Message Tracker 中的消息自发送日起保存 3 个月。", "O5", "How It Works"),
          ]),
          s("creatorhero", "Sales Assignment · 销售归属核对", [
            c("粉丝购买 PPV 后，销售自动归属于发送该消息的员工；可在 Notifications 中选择交易并重新指定员工。", "C3", "How PPV Sales Are Assigned / Reassigning a Sale"),
          ], [
            c("当前不记录重新分配的历史，只能在通知中查看当前归属。", "C3", "FAQ"),
          ]),
        ],
      },
    ],
  },

]

const coreOrder: ValueId[] = ['conversion', 'retention', 'content', 'team', 'control']
export const values = coreOrder.map(id => valueCatalog.find(value => value.id === id)!)

const usedRefs = new Set(values.flatMap(value => value.points.flatMap(point => point.solutions.flatMap(solution => solution.refs))))
export const sources = catalogSources.filter(source => usedRefs.has(source.id))
export const sourceMap = new Map(sources.map(source => [source.id, source]))

export const pointCount = values.reduce((total, value) => total + value.points.length, 0)
export const solutionCount = values.reduce((total, value) => total + value.points.reduce((sum, point) => sum + point.solutions.length, 0), 0)
export const evidenceCount = values.reduce((total, value) => total + value.points.reduce((sum, point) => sum + point.solutions.reduce((count, solution) => count + solution.claims.length + solution.limits.length, 0), 0), 0)

const claimMarkdown = (claim: EvidenceClaim) => {
  const source = sourceMap.get(claim.ref)!
  return `${claim.text}（[${source.title} · ${claim.section}](${source.url})）`
}

export function buildMarkdown() {
  const lines = [
    '# Onlyfans CRM 产品价值分析',
    '不同平台能力对比与产品建设启示',
    `报告更新于 ${auditedAt}。5 类核心产品价值，共 ${pointCount} 个落地点、${solutionCount} 项平台实现，引用 ${sources.length} 份官方资料。`,
    `研究范围：${frameworkScope}`,
    '## 管理摘要（本报告分析）',
    `核心判断：${executiveSummary.conclusion}`,
    ...executiveSummary.perspectives.map(item => `**${item.title}**：${item.text}`),
    `**产品建设启示**：${executiveSummary.implication}`,
    '每条当前实现及适用边界均附官方文章和章节。仅列有直接依据的条目；未列出的平台不代表不支持。问题、作用与场景是本页分析，不代表官方承诺或实测效果。',
    '',
  ]
  values.forEach((value, index) => {
    const label = String(index + 1)
    lines.push(`## ${label}. ${value.title}`, value.thesis, '', `分析范围：${value.scope}`, '')
    value.points.forEach((point, pointIndex) => {
      lines.push(`### ${label}.${pointIndex + 1} ${point.title}`, `问题（分析）：${point.problem}`, `作用（分析）：${point.mechanism}`, `示例情境：${point.example}`, `主要使用者：${point.owner}`, `Infloww 建设建议（本页分析）：${point.inflowwProposal}`, '')
      point.solutions.forEach(solution => {
        const platform = platforms.find(item => item.id === solution.platform)!
        lines.push(`#### ${platform.name} · ${solution.feature}`, '当前实现：', ...solution.claims.map(claim => `- ${claimMarkdown(claim)}`))
        if (solution.limits.length) lines.push('适用边界：', ...solution.limits.map(claim => `- ${claimMarkdown(claim)}`))
        lines.push('')
      })
    })
  })
  lines.push('## 跨价值的共同基础（分析）', '在动作发生处提供相关信息；用反馈修正下一轮运营。AI、分组、报表和自动化是承载这些价值的能力，可同时服务多个经营目标。', '', '## 资料说明', `${auditNote}每个引用标明原文章节，区分人工操作与自动执行；不将独立功能推演成官方已实现的联动流程。未登录四家真实账号验收，套餐及开放范围以现行产品为准。`, '', '## 官方资料索引', ...sources.map(source => `- ${source.platform} · [${source.title}](${source.url})`))
  return lines.join('\n\n')
}
