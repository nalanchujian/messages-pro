import { platforms, sources as catalogSources } from './value-playbook-sources'
import type { ProductId } from './value-playbook-sources'

export { platforms }
export const auditedAt = '2026-10-21'
export type ValueId = 'conversion' | 'content' | 'retention' | 'team' | 'acquisition'

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

export const values: BusinessValue[] = [
  {
    id: "conversion",
    short: "销售转化",
    title: "提高销售机会的有效转化",
    thesis: "把已经出现的兴趣，推进为合适的报价和及时的成交。",
    scope: "经营对象是一轮销售机会。重点是先处理谁、提供什么、何时再跟进；跨月留存放在“客户长期价值”中。",
    points: [
      {
        id: "prioritize",
        title: "让值得处理的机会先被看见",
        problem: "消息按时间挤在一起，新买家、老高价值粉丝和普通闲聊争抢同一份注意力。",
        mechanism: "把消费与行为信号转为可操作的队列，缩短高意向粉丝的等待时间。",
        example: "同一班次同时进来 30 条消息：优先处理刚购买后追问、近期活跃且有消费记录的会话。",
        owner: "班次主管 + 聊天员工",
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
    short: "内容回报",
    title: "提高内容资产的经营回报",
    thesis: "让已经制作的内容更容易找到、正确售卖，并知道下一步该复用什么。",
    scope: "经营对象是内容及内容组合。与销售转化共享报价动作，但这里关注跨粉丝、跨周期的内容收益。",
    points: [
      {
        id: "find-content",
        title: "找到适合内容，并避免重复售卖",
        problem: "素材越来越多，员工找不到对应内容，或把粉丝已经买过的内容再次推荐。",
        mechanism: "把可查找性和单个粉丝的购买记忆放在选材环节，降低操作损耗与重复销售。",
        example: "粉丝想看旅行主题内容：员工按主题找素材，再核对免费发送和购买历史。",
        owner: "素材管理员 + 聊天员工",
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
    short: "客户长期价值",
    title: "提高客户的长期价值",
    thesis: "让每次互动积累到下一次，把一次购买延续为可持续的关系。",
    scope: "经营对象是同一位粉丝跨周期的关系。保留、复购和唤回分别观察，避免用一次成交替代长期价值。",
    points: [
      {
        id: "memory",
        title: "让关系记忆跟着粉丝走",
        problem: "换人、换班或隔几天再聊时，偏好与承诺丢失，粉丝反复被问同样的问题。",
        mechanism: "在回复前恢复必要上下文，降低重复询问和不相关推荐。",
        example: "晚班接手一位老粉丝：先看偏好、最近购买与上次沟通，而不是重新从头认识。",
        owner: "每位经办员工",
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
    short: "团队效率",
    title: "提高团队的经营效率与扩展能力",
    thesis: "让更多员工稳定地接续工作，同时控制协作、训练与管理成本。",
    scope: "经营对象是人、班次和执行过程。脚本与内容资产共用，但这里衡量培训、人效、交接与管理投入。",
    points: [
      {
        id: "ownership",
        title: "划分工作范围，减少多人协作冲突",
        problem: "多人看到同一收件箱，容易重复回复，也容易都以为别人会处理。",
        mechanism: "通过分组与范围过滤减少交叉处理；人员责任和班次权限需要分别明确。",
        example: "早晚班交替：明确每组由谁处理、未完事项交给谁，并检查超时会话。",
        owner: "班次主管",
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
          s("onlymonster", "Inboxes + Shift-Based Access", [
            c("Inboxes 最多支持 6 组，可自定义名称和颜色，并选择显示哪些组。", "O6", "Enhanced System Highlights"),
            c("另有按角色配置的班次访问限制：开启后，成员只在排班时段内可以访问账号。", "O4", "Role-Based Access"),
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
        title: "用可追溯事实做培训、排班与结算",
        problem: "主管只看总销售排名，无法区分资源差异、操作质量和归属争议。",
        mechanism: "把经营结果连到执行过程，缩短定位问题的时间，并使用一致口径比较。",
        example: "员工销售下降：先看是否少了机会，再看回复和报价过程，最后讨论培训或排班。",
        owner: "主管 + 财务 / 人力",
        solutions: [
          s("infloww", "Employee Reports + Message Dashboard", [
            c("员工报表包含销售、消息、解锁率、排班／打卡工时和响应时间等指标。", "I4", "Key metrics explained"),
            c("Message Dashboard 展示员工消息、购买状态、收入和响应时间。", "I3", "How to monitor employee messages"),
          ]),
          s("supercreator", "Chatter Analytics · 员工与会话明细", [
            c("Team Overview 汇总员工销售、消息、估算工时和薪酬。", "S5", "Team Overview"),
            c("Messages Breakdown 可通过 View Chat 查看具体对话。", "S5", "Messages Breakdown"),
          ], [
            c("Activity 的工时按有发信活动的 30 分钟区间估算，不等同于精确打卡时长。", "S5", "Activity"),
          ]),
          s("onlymonster", "Message Tracker · 发信过程追溯", [
            c("消息记录区分手输、粘贴、AI 助手和模板等输入来源，并显示发送者、价格及购买状态。", "O5", "Table Columns"),
            c("可将筛选后的消息记录导出为 CSV 或 XLSX。", "O5", "Export"),
          ]),
          s("creatorhero", "Chatter Tracking + Sales Assignment", [
            c("Chatter Tracking 的员工表展示收入、响应时间、消息和 PPV 发送／购买情况，并可进入个人详情。", "C4", "All Chatters Table"),
            c("在 Notifications 找到交易后，可手动重新指定销售归属的员工。", "C3", "Reassigning a Sale"),
          ]),
        ],
      },
    ],
  },
  {
    id: "acquisition",
    short: "获客回报",
    title: "提高获客投入的回报",
    thesis: "把渠道带来的访问，追到后续消费与成本，让投放选择有依据。",
    scope: "经营对象是渠道与获客批次。客户长期价值回答“怎样养好人”，这里回答“从哪里获取人、值得花多少”。",
    points: [
      {
        id: "source-cost",
        title: "先让来源与成本可以对账",
        problem: "只看粉丝增长，不知道哪次合作或投放带来了谁，也漏记推广成本。",
        mechanism: "统一链接、活动和费用口径，让获客选择从曝光量进入成本与收入比较。",
        example: "两位推广伙伴各带来 100 个粉丝，用独立链接和真实费用区分是否值得继续合作。",
        owner: "增长运营 + 财务",
        solutions: [
          s("infloww", "Tracking Links · 推广费用与收入", [
            c("追踪链接支持手工录入推广费用，并据此计算 ROI。", "V-I1", "Promo costs"),
          ], [
            c("收入采用滚动归因：粉丝通过新链接重新订阅后，未来收入转归最近的链接。", "V-I1", "Attribution"),
          ]),
          s("supercreator", "Creator Analytics · Campaigns", [
            c("Campaigns 展示推广活动的点击、领取订阅和收入；可录入活动成本并计算 ROI。", "V-S1", "Campaigns"),
          ]),
          s("creatorhero", "Detailed Tracking Links · 成本与利润", [
            c("单条链接详情中可填写推广费用，查看利润和 ROI。", "V-C2", "Promotion Costs & ROI Calculation"),
          ]),
        ],
      },
      {
        id: "cohort",
        title: "比较渠道带来的人，后来是否付费",
        problem: "便宜的粉丝可能从不购买；旧渠道累计时间长，看起来总比新渠道赚钱。",
        mechanism: "把来源与后续消费联系起来；比较时需要区分累计收入、固定观察期和不同归因口径。",
        example: "渠道 A 首周增长快，渠道 B 粉丝少但持续购买；统一获客周和后续 30 天再比较。",
        owner: "增长分析 + 经营负责人",
        solutions: [
          s("infloww", "Tracking Link Details · 来源粉丝消费", [
            c("进入链接详情可查看各粉丝在订阅、帖子、消息、直播和打赏上的消费明细。", "V-I1", "Tracking link detail page"),
          ], [
            c("追踪链接总览的时间过滤按链接创建时间筛选。", "V-I1", "Dashboard overview"),
          ]),
          s("onlymonster", "Traffic Metrics · 订阅批次与收入期间", [
            c("Detailed 模式可分别筛选链接创建日期、粉丝订阅日期和收入日期；后两项最多选择 180 天范围。", "V-O1", "Filter System"),
            c("收入归因可选择 Rolling 或 Double；前者把后续收入移到最新来源，后者保留早期来源的累计归因。", "V-O1", "Earnings Attribution"),
          ]),
          s("creatorhero", "Detailed Tracking Links · 渠道粉丝构成", [
            c("链接详情展示总收入、最近 30 天收入、平均消费和续订活跃粉丝。", "V-C2", "Performance Metrics"),
            c("Fan Engagement Graph 区分仅订阅、曾回复、购买一次和购买多次等人群。", "V-C2", "Fan Engagement Graph"),
          ]),
        ],
      },
      {
        id: "channel-action",
        title: "把来源人群带入接待工作流",
        problem: "发现某渠道表现不好，却不清楚是人群质量差、接待不足，还是内容不匹配。",
        mechanism: "将链接来源转成可使用的粉丝名单，为差异化接待准备受众。",
        example: "从某个推广链接带来的新粉生成名单，在接待时使用与该渠道内容相匹配的介绍。",
        owner: "增长运营 + 生命周期运营",
        solutions: [
          s("infloww", "Tracking Links · 来源自动入名单", [
            c("为追踪链接选择或新建名单后，经该链接订阅的粉丝会自动加入指定名单。", "V-I1", "Organize fans by source using lists"),
          ]),
          s("onlymonster", "Dynamic Fan Lists · 来源筛选与名单同步", [
            c("Subscribed from link 条件纳入经指定追踪链接在最近 90 天订阅的粉丝。", "O2", "Available Filters"),
            c("名单支持同步到 OnlyFans Collections，用于 OnlyFans 原生消息及 OnlyMonster 群发。", "O2", "Dynamic Fan Lists"),
          ], [
            c("Subscribed from link 不能与其他筛选条件组合。", "O2", "Important Notes"),
          ]),
          s("creatorhero", "Tracking Links · 生成来源名单", [
            c("点击 Create OnlyFans List，把通过该链接订阅的粉丝生成一个可自定义名称的 OnlyFans 名单。", "V-C1", "Create OnlyFans List"),
          ], [
            c("这是创建当时的名单快照；之后从同一链接加入的粉丝不会自动追加。", "V-C1", "Create OnlyFans List"),
          ]),
        ],
      },
    ],
  },
]

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
    '# 五类经营价值：四家 Creator CRM 的当前实现',
    `资料核查截至 ${auditedAt}。5 类价值、${pointCount} 个落地点、${solutionCount} 项平台实现，引用 ${sources.length} 份官方资料。`,
    '每条当前实现及资料限定均附官方文章和章节。仅列有直接依据的条目；未列出的平台不代表不支持。问题、作用与场景是本页分析，不代表官方承诺或实测效果。',
    '',
  ]
  values.forEach((value, index) => {
    lines.push(`## ${index + 1}. ${value.title}`, value.thesis, '', `分析范围：${value.scope}`, '')
    value.points.forEach((point, pointIndex) => {
      lines.push(`### ${index + 1}.${pointIndex + 1} ${point.title}`, `问题（分析）：${point.problem}`, `作用（分析）：${point.mechanism}`, `示例情境：${point.example}`, `主要使用者：${point.owner}`, '')
      point.solutions.forEach(solution => {
        const platform = platforms.find(item => item.id === solution.platform)!
        lines.push(`#### ${platform.name} · ${solution.feature}`, '当前实现：', ...solution.claims.map(claim => `- ${claimMarkdown(claim)}`))
        if (solution.limits.length) lines.push('资料限定：', ...solution.limits.map(claim => `- ${claimMarkdown(claim)}`))
        lines.push('')
      })
    })
  })
  lines.push('## 跨价值的共同基础（分析）', '在动作发生处提供相关信息；用反馈修正下一轮运营。这两项贯穿五类价值。', '', '## 资料说明', `依据截至 ${auditedAt} 核查的官方帮助中心与产品文档。每个引用标明原文章节，区分人工操作与自动执行；不将独立功能推演成官方已实现的联动流程。未登录四家真实账号验收，套餐及开放范围以现行产品为准。`, '', '## 官方资料索引', ...sources.map(source => `- ${source.platform} · [${source.title}](${source.url})`))
  return lines.join('\n\n')
}
