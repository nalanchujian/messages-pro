# Onlyfans CRM 产品价值分析

平台能力对比与 Infloww 优化方向

报告更新于 2026-10-26。5 类核心产品价值、15 个落地点、52 项同维度平台实现，引用 49 份官方资料。

研究范围：聚焦团队运营多个 OnlyFans 创作者账号的场景，围绕聊天销售、粉丝关系、内容复用、团队协作与权限管理，对比四家平台的公开官方资料。

## 报告思路（五步分析路径）

界定经营场景 → 建立价值框架 → 拆解具体落地点 → 对照平台实现 → 评估优化方向。

## 管理摘要（本报告分析）

核心判断：Onlyfans CRM 的核心价值，是持续经营客户与内容、复制有效销售能力，并让多人、多账号的业务始终可控。

**促进收入增长**：让高意向机会及时得到处理，让内容与报价匹配需求，并通过持续跟进和关系维护，争取更多成交与复购。

**扩大可复用的经营能力**：让已有内容充分参与销售，让成熟经验被更多员工使用，在有限时间内承接更多有效工作。

**保持规模化经营可控**：业务交给团队后，仍能限定账号访问和操作权限，并通过执行记录核对发信责任。


每条当前实现及适用边界均附官方文章和章节。仅列有直接依据的条目；未列出的平台不代表不支持。问题、作用与场景是本页分析，不代表官方承诺或实测效果。



## 1. 提高销售机会的有效转化

减少机会遗漏，让更多销售机会转化为收入。



分析范围：经营对象是一轮销售机会，包含首次购买和再次购买。重点是先处理谁、提供什么、何时再跟进；跨周期的关系维护归入“客户持续经营”。



### 1.1 让值得处理的机会先被看见

问题（分析）：消息按时间挤在一起，新买家、老高价值粉丝和普通闲聊争抢同一份注意力。

作用（分析）：把消费与行为信号转为可操作的队列，缩短高意向粉丝的等待时间。

示例情境：同一班次同时进来 30 条消息：优先处理刚购买后追问、近期活跃且有消费记录的会话。

主要使用者：班次主管 + 聊天员工

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：收件箱按最新／最早排序，支持 Priority 筛选；官方 Fan Insights 另列消费力分层，但不是会话排序。借鉴方向：评估 Supercreator 的行为优先级排序。待确认：Priority 的判定规则和新排序的实际效果。

核实依据：[Infloww · Navigating Infloww’s OF manager](https://help.infloww.com/en/articles/262112-navigating-infloww-s-of-manager)；[Infloww · Fan Insights](https://help.infloww.com/en/articles/523936-fan-insights)；[Supercreator · Inbox Copilot](https://help.supercreator.app/en/articles/6317610-inbox-copilot)



#### Infloww · Messages Pro · 会话筛选与时间排序

当前实现：

- 收件箱展示粉丝标签与消费总额；近期购买 PPV 的粉丝也有对应标签，便于员工辨认。（[Messages Pro · About Fan tags](https://help.infloww.com/en/articles/262067-getting-started-with-onlyfans-messages-pro)）

- 会话列表提供“最新优先／最早优先”排序，并可按 Priority、Unread、Unread with tips 等条件筛选。（[OF manager · Viewing and creating messages](https://help.infloww.com/en/articles/262112-navigating-infloww-s-of-manager)）

适用边界：

- 官方资料列出的是筛选和时间排序，未说明收件箱会按消费与行为信号自动排列会话。（[OF manager · Viewing and creating messages](https://help.infloww.com/en/articles/262112-navigating-infloww-s-of-manager)）

- Smart Lists 是另一项粉丝分层能力：可按消费建立定向触达名单，名单约每 6 小时更新。（[Smart Lists · What are Smart Lists?](https://help.infloww.com/en/articles/262064-smart-lists)）



#### Supercreator · Inbox Copilot · 优先级与标签

当前实现：

- 根据近期消费、消息和订阅等信息展示粉丝优先级；Hot Buyer 标记过去 48 小时购买过的粉丝，New 标记过去 7 天加入的粉丝。（[Inbox Copilot · How it works](https://help.supercreator.app/en/articles/6317610-inbox-copilot)）

- 收件箱可按优先级、消费和订阅时长筛选，并隐藏已过期粉丝或创作者账号。（[Inbox Copilot · Filter your inbox](https://help.supercreator.app/en/articles/6317610-inbox-copilot)）



#### OnlyMonster · Buying Power · 会话购买潜力

当前实现：

- 打开会话可查看粉丝 0–5 分的 Buying Power，以及消费额、平均 PPV 和近期购买。（[Advanced Fan Information · Buying Power section](https://docs.onlymonster.ai/members-features/advanced-fan-information)）

- 官方更新记录说明 Buying Power 分数也展示在聊天列表中，便于先辨认潜在高价值会话。（[Changelog 2025 · 14 November - Version 3.35.0](https://docs.onlymonster.ai/changelog/changelog-2025)）



#### CreatorHero · Fan Spend Colors · 收件箱消费提示

当前实现：

- 可按粉丝消费门槛设置颜色，在消息收件箱突出高、低消费粉丝。（[Display Settings · Fan Spend Colors](https://help.creatorhero.com/en/articles/10434184-display-settings)）

适用边界：

- 文档说明的是消费颜色提示，未说明会自动改变会话排序。（[Display Settings · Fan Spend Colors](https://help.creatorhero.com/en/articles/10434184-display-settings)）



### 1.2 让内容、价格与当前需求匹配

问题（分析）：统一报价容易向低预算粉丝报高价，也可能低估高意向粉丝对特定内容的接受度。

作用（分析）：在报价时提供购买历史与内容信息，减少盲猜，让推荐更贴近粉丝的需求与预算。

示例情境：粉丝询问一套新内容：先检查是否买过、通常买什么价格，再决定推荐哪个组合。

主要使用者：内容运营 + 聊天员工

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：聊天侧可看粉丝 PPV 均价等消费数据，素材建议价由员工设置。借鉴方向：参考 Supercreator，按粉丝购买历史提示报价区间与价格偏差。待确认：当前版本有无同类提示，需求判断仍需结合对话。

核实依据：[Infloww · Fan Insights](https://help.infloww.com/en/articles/523936-fan-insights)；[Infloww · Vault Pro](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)；[Supercreator · Pricing Copilot](https://help.supercreator.app/en/articles/6317627-pricing-copilot)



#### Infloww · Fan Insights + Vault Pro

当前实现：

- 聊天侧展示 PPV 消费总额、平均值和打赏信息，供员工查看粉丝历史消费。（[Fan Insights · Spending behavior](https://help.infloww.com/en/articles/523936-fan-insights)）

- 素材可维护备注、标签和建议价格；这些字段由员工在媒体详情中编辑。（[Vault Pro · Viewing and editing media details](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)）



#### Supercreator · Pricing Copilot + PriceGuard

当前实现：

- 展示建议价格区间及原因；输入价格时，PriceGuard 提示可能偏低或偏高的报价。（[Pricing Copilot · Pricing Insights & PriceGuard](https://help.supercreator.app/en/articles/6317627-pricing-copilot)）

- 同时提供最高、平均 PPV 价格和购买记录图；可显示未购买的 PPV，并查看关联内容。（[Pricing Copilot · Pricing Metrics](https://help.supercreator.app/en/articles/6317627-pricing-copilot)）



#### OnlyMonster · Fan Information + Vault

当前实现：

- Buying Power 区域可切换账号与机构视角，查看平均 PPV、平均打赏和近期购买，并进入 PPV 时间线。（[Advanced Fan Information · Buying Power section](https://docs.onlymonster.ai/members-features/advanced-fan-information)）

- 自定义文件夹内的素材可维护描述、标签和 Recommended Price，为团队提供内容信息及参考价。（[Vault management · Media Organization](https://docs.onlymonster.ai/members-features/vault-management)）



#### CreatorHero · Fan Info · PPV 价格历史

当前实现：

- 粉丝资料展示 PPV 平均价、最高价、购买率和最近购买时间。（[Fan Info · PPV Stats](https://help.creatorhero.com/en/articles/10500000-fan-info)）

- PPV 时间线区分已购与未购，并呈现发送日期、价格等记录。（[Fan Info · View PPV Timeline](https://help.creatorhero.com/en/articles/10500000-fan-info)）



### 1.3 把未成交机会接着处理

问题（分析）：PPV 发出以后无人回看：未读、看过未买、已经购买被混在一起。

作用（分析）：把交易状态变成下一步行动，减少遗漏，并避免继续催促已购买者。

示例情境：一条付费消息已发出一段时间仍未购买：先区分没看见与不感兴趣，再决定是否提醒。

主要使用者：聊天员工 + 自动化配置人

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：可从未购直聊 PPV 报表返回会话；购买后自动触达不等于未购跟进。借鉴方向：评估 CreatorHero 的单条 PPV 延时提醒。待确认：Infloww 当前是否已有未购触发。

核实依据：[Infloww · Message Dashboard](https://help.infloww.com/en/articles/262061-message-dashboard)；[Infloww · Smart Messages](https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages)；[CreatorHero · PPV Follow-Ups](https://help.creatorhero.com/en/articles/10499966-ppv-follow-ups)



#### Infloww · Message Dashboard · 人工回到会话

当前实现：

- 消息报表可按购买状态、价格、发送者等条件筛选。（[Message Dashboard · Sorting and filtering through messages](https://help.infloww.com/en/articles/262061-message-dashboard)）

- Direct messages 记录的 Actions 可打开对应聊天，供员工继续处理。（[Message Dashboard · How to open a conversation](https://help.infloww.com/en/articles/262061-message-dashboard)）

适用边界：

- 报表约每 10 分钟更新；Direct messages 不含自动消息和群发消息，仅记录通过 Infloww 发送的员工直聊消息。（[Message Dashboard · How to monitor employee messages](https://help.infloww.com/en/articles/262061-message-dashboard)）



#### CreatorHero · PPV Overview + PPV Follow-Ups

当前实现：

- PPV Overview 区分未看、已看、未回复、已回复和已购状态，记录可直接打开聊天。（[PPV Overview · Key Features](https://help.creatorhero.com/en/articles/10526671-ppv-overview)）

- PPV Follow-Ups 可设置延迟分钟数、是否包含未看消息的粉丝和跟进文案，随后自动发送。（[PPV Follow-Ups · Page Features](https://help.creatorhero.com/en/articles/10499966-ppv-follow-ups)）

适用边界：

- 每条 PPV 对同一粉丝只跟进一次；已购买的粉丝会被排除。（[PPV Follow-Ups · FAQ](https://help.creatorhero.com/en/articles/10499966-ppv-follow-ups)）



## 2. 延续客户关系，促进持续消费

延续客户关系，促进复购、续订与回流。



分析范围：经营对象是同一位粉丝跨周期的关系。重点是记住偏好、接续服务和生命周期触达；一轮具体成交的处理归入“销售机会转化”。



### 2.1 让关系记忆跟着粉丝走

问题（分析）：换人、换班或隔几天再聊时，偏好与承诺丢失，粉丝反复被问同样的问题。

作用（分析）：在回复前恢复必要上下文，降低重复询问和不相关推荐。

示例情境：晚班接手一位老粉丝：先看偏好、最近购买与上次沟通，而不是重新从头认识。

主要使用者：每位经办员工

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：Infloww 以人工资料和备注承接关系；Supercreator 可从对话提取信息，CreatorHero 可生成聊天摘要。借鉴方向：评估自动整理能否缩短交接。待确认：Infloww 当前 AI 摘要是否可用；2026 年 5 月对比页不能证明现状。

核实依据：[Infloww · Fan Insights](https://help.infloww.com/en/articles/523936-fan-insights)；[Infloww · Infloww vs. CreatorHero（对比截至 2026 年 5 月）](https://infloww.com/infloww-vs-creatorhero)；[CreatorHero · Chat summary](https://help.creatorhero.com/en/articles/10523101-chat-summary-feature)；[Supercreator · Fans Copilot / CRM](https://help.supercreator.app/en/articles/6316422-fans-copilot-crm)

#### Infloww · Fan Insights · 资料与备注模板

当前实现：

- 聊天侧可维护昵称、生日、所在地等资料。（[Fan Insights · Profile](https://help.infloww.com/en/articles/523936-fan-insights)）

- 备注区支持自由文本和自定义模板。（[Fan Insights · Notes](https://help.infloww.com/en/articles/523936-fan-insights)）

适用边界：

- 官方对比页将 AI fan summary 标为开发中，但该表注明截至 2026 年 5 月，仅作为历史状态依据，不代表当前版本状态。（[Infloww vs. CreatorHero（对比截至 2026 年 5 月） · Platform comparison / OnlyFans](https://infloww.com/infloww-vs-creatorhero)）

#### Supercreator · Fans CRM · AI 整理与团队备注

当前实现：

- Fill with AI 从对话中提取粉丝偏好和资料，填入或更新 CRM 字段。（[Fans Copilot / CRM · Fill with AI](https://help.supercreator.app/en/articles/6316422-fans-copilot-crm)）

- Notes Template 可设置机构默认备注结构，供团队在粉丝资料中使用。（[Fans Copilot / CRM · Notes Template](https://help.supercreator.app/en/articles/6316422-fans-copilot-crm)）

#### OnlyMonster · Advanced Fan Information · 偏好与备注

当前实现：

- 粉丝资料可记录生日、时区、订阅和续订状态，并查看最近回复、最近阅读等信息。（[Advanced Fan Information · General](https://docs.onlymonster.ai/members-features/advanced-fan-information)）

- Preferences 可手工记录和编辑粉丝偏好。（[Advanced Fan Information · Preferences](https://docs.onlymonster.ai/members-features/advanced-fan-information)）

#### CreatorHero · Fan Notes + Chat Summary

当前实现：

- Fan Notes 支持备注模板和聊天界面内编辑，资料随当前粉丝展示。（[Fan Info · Fan Notes](https://help.creatorhero.com/en/articles/10500000-fan-info)）

- Summarize Chat 弹窗可选择时间范围并生成摘要，也可刷新或导出。（[Chat summary · Summarizing a Chat](https://help.creatorhero.com/en/articles/10523101-chat-summary-feature)）



### 2.2 在关键生命周期节点主动经营

问题（分析）：新订阅没被欢迎、即将到期未联系、买完后没有后续，关系自然冷却。

作用（分析）：让时间或状态触发合适动作，把重复检查交给系统，把语境判断留给人员。

示例情境：对新粉先介绍，对临期付费粉解释后续内容，对已到期老买家开展一次有理由的唤回。

主要使用者：生命周期运营

Infloww 能力评估与优化方向（Infloww 已覆盖核心能力）：现状：Smart Messages 已有生命周期触发与排除规则，过期触达可设多步序列并在粉丝回复后停止；Supercreator 另有跨阶段可视化分支。优化方向：先评估续订与回流效果，再判断是否需要跨场景流程。

核实依据：[Infloww · Smart Messages](https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages)；[Infloww · Message fans after their subscription expires](https://help.infloww.com/en/articles/262048-message-fans-after-their-subscription-expires)；[Supercreator · Message Flow](https://help.supercreator.app/en/articles/12278471-message-flow)



#### Infloww · Smart Messages · 生命周期触发

当前实现：

- 提供延迟欢迎、即将到期、已过期、生日、购买及重新订阅等消息类型；生日触发使用粉丝资料中的生日。（[Smart Messages · Smart Messages Types](https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages)）

- 已过期粉丝触达可配置后续消息序列，并根据粉丝是否回复决定下一条消息。（[Message fans after their subscription expires · Build the message or sequence](https://help.infloww.com/en/articles/262048-message-fans-after-their-subscription-expires)）

适用边界：

- 一个粉丝同时符合多个类型时，只发送优先级最高的一类；官方文档给出了类型优先顺序。（[Smart Messages · FAQs](https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages)）



#### Supercreator · Message Flow · 分阶段自动触达

当前实现：

- 可按回复与否设置条件分支和时间延迟，自动发送后续消息或 PPV。（[Message Flow · How it works, step by step](https://help.supercreator.app/en/articles/12278471-message-flow)）

- 新粉丝与订阅三个月的粉丝可进入不同阶段，按所处阶段接收内容。（[Message Flow · How it works, step by step](https://help.supercreator.app/en/articles/12278471-message-flow)）



#### OnlyMonster · Auto Messages · 状态触发

当前实现：

- 提供欢迎、上线、已过期和即将过期四类触发；即将过期触达适用于关闭自动续订的粉丝。（[Auto Messages · Available Triggers / Send Message In](https://docs.onlymonster.ai/members-features/auto-messages)）

- 触发后的动作可选择发送消息，或启动 Mimic AI 会话。（[Auto Messages · Action Type](https://docs.onlymonster.ai/members-features/auto-messages)）

#### CreatorHero · Expiring Fans · 到期前自动消息

当前实现：

- 可针对即将到期的粉丝自动发送消息，并配置发送时机与内容。（[Expiring Fans · Settings Overview](https://help.creatorhero.com/en/articles/11102180-expiring-fans)）



### 2.3 持续查看粉丝增长与留存

问题（分析）：只看当期收入，很难知道粉丝基盘是在积累，还是在流失。

作用（分析）：持续呈现新增、活跃、保留和流失情况，为关系经营提供背景。

示例情境：经营负责人查看老粉的订阅状态与购买历史，区分仍在互动、持续购买和已经沉默的人。

主要使用者：经营负责人

Infloww 能力评估与优化方向（关键差异待验证）：现状：Fan Reports 有增长和消费数据；官方介绍留存表，本地前端却未启用该组件。待验证方向：确认实际入口和留存指标，再判断能否开展订阅批次分析。

核实依据：[Infloww · Fan reports](https://help.infloww.com/en/articles/276167-fan-reports)；[Supercreator · Creator Analytics](https://help.supercreator.app/en/articles/8118590-creator-analytics)



#### Infloww · Fan Reports · 新增、流失与保留

当前实现：

- 报告呈现新增、流失、保留和活跃粉丝，以及自动续订开启／关闭情况；导出时可选日期范围与指标。（[Fan reports · 文章开篇](https://help.infloww.com/en/articles/276167-fan-reports)）

- 官方资料介绍留存表，用于查看粉丝在一段时间内维持订阅的情况；本地前端页面当前未启用该表。（[Fan reports · Understanding Fan Retention](https://help.infloww.com/en/articles/276167-fan-reports)）



#### Supercreator · Creator Analytics · 订阅增长

当前实现：

- 订阅分析展示新增、流失和活跃订阅者及其消费，并提供与上一周期的比较。（[Creator Analytics · Subscribers and growth](https://help.supercreator.app/en/articles/8118590-creator-analytics)）



## 3. 提高内容资产的经营回报

提高内容复用效率，让已有素材持续创造收益。



分析范围：经营对象是内容及内容组合。与销售转化共享报价动作，但这里关注跨粉丝、跨周期的内容收益。



### 3.1 找到适合内容，并避免重复售卖

问题（分析）：素材越来越多，员工找不到对应内容，或把粉丝已经买过的内容再次推荐。

作用（分析）：把可查找性和单个粉丝的购买记忆放在选材环节，降低操作损耗与重复销售。

示例情境：粉丝想看旅行主题内容：员工按主题找素材，再核对免费发送和购买历史。

主要使用者：素材管理员 + 聊天员工

Infloww 能力评估与优化方向（Infloww 已覆盖核心能力）：现状：Vault Pro 可搜索素材，并过滤当前粉丝已看或已解锁的内容；Supercreator 也提供逐粉丝素材状态。优化方向：验证过滤能否减少重复推荐，不把可选过滤写成强制拦截。

核实依据：[Infloww · Vault Pro](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)；[Supercreator · Vault Copilot](https://help.supercreator.app/en/articles/6317586-vault-copilot)



#### Infloww · Vault Pro · 搜索与已看过滤

当前实现：

- 可按备注、标签或历史 PPV 文案搜索素材。（[Vault Pro · Filtering the vault by media details](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)）

- 提供隐藏粉丝已看、已解锁或已在创作者动态中发布内容的过滤开关。（[Vault Pro · Filtering the vault by content seen type](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)）



#### Supercreator · Vault Copilot · 单粉丝素材状态

当前实现：

- 素材库标出对当前粉丝已发送、已购买、免费发送或发布在动态中的素材。（[Vault Copilot · What can you find in the Super Vault?](https://help.supercreator.app/en/articles/6317586-vault-copilot)）

适用边界：

- 重复上传的素材按不同实例记录；系统不会扫描文件内容来识别重复，Super Mass 也不提供这种逐粉丝发送状态跟踪。（[Vault Copilot · FAQs](https://help.supercreator.app/en/articles/6317586-vault-copilot)）



#### OnlyMonster · Vault Labeling + PPV History

当前实现：

- 素材用标签区分免费发送、已付费、未付费和已发布状态。（[Vault management · Vault Labeling](https://docs.onlymonster.ai/members-features/vault-management)）

- PPV History 可查看发送内容、日期、价格及购买情况。（[Vault management · PPV History](https://docs.onlymonster.ai/members-features/vault-management)）

适用边界：

- 重新上传的相同文件会生成独立记录，不会继承原素材的发送或购买标签。（[Vault management · Vault Labeling](https://docs.onlymonster.ai/members-features/vault-management)）



#### CreatorHero · Vault · 搜索与分类

当前实现：

- 通过搜索、分类及照片／视频／GIF 类型筛选查找素材；分类可创建、重命名和删除。（[Vault · Search and Filter](https://help.creatorhero.com/en/articles/10461326-vault)）

- 可按最近、点赞或打赏等方式排序。（[Vault · Sort Options](https://help.creatorhero.com/en/articles/10461326-vault)）

适用边界：

- 该文档只证实素材查找与分类，未说明会在当前粉丝选材时提示其已购内容。（[Vault · Search and Filter](https://help.creatorhero.com/en/articles/10461326-vault)）



### 3.2 把散落素材变成可复用的销售组合

问题（分析）：好内容需要反复找图、写介绍、配价格；经验留在个别员工手里。

作用（分析）：一次整理文本、素材和使用条件，多次在合适场景复用，减少内容上架与销售准备成本。

示例情境：把一个旅行系列整理为“介绍 → 预览 → 付费组合”，员工按对话阶段调用。

主要使用者：内容运营 + 资深销售

Infloww 能力评估与优化方向（Infloww 已覆盖核心能力）：现状：Scripts 可复用图文序列、提示下一条，并查看发送与购买表现；发送由员工决定，竞品模板也用于复用。优化方向：评估序列使用效果，不把 Scripts 当作自动销售流程。

核实依据：[Infloww · Scripts](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)；[Supercreator · Message Copilot / Library](https://help.supercreator.app/en/articles/6317851-message-copilot)；[OnlyMonster · Message Templates](https://docs.onlymonster.ai/members-features/message-templates)；[CreatorHero · Scripts](https://help.creatorhero.com/en/articles/10514438-scripts)

#### Infloww · Scripts · 消息序列

当前实现：

- 可创建话术序列，并在条件步骤内配置最多 3 个选项，发送时由员工选择。（[Scripts · Creating a script sequence](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)）

- 聊天输入“/”后按名称、序列、标签或正文关键词查找话术；发送序列中的话术后，会提示下一条。（[Scripts · Using Scripts in Messages Pro](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)）

- 脚本可查看发送、购买及收入统计，供团队复盘其使用表现。（[Scripts · Optimize your messaging strategies with key statistics](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)）

#### Supercreator · Message Library · 消息与媒体模板

当前实现：

- 消息库可预先保存文案、媒体、价格、标题和文件夹，也可设置个性化定价后重复调用。（[Message Copilot / Library · How to use your Message Library](https://help.supercreator.app/en/articles/6317851-message-copilot)）

#### OnlyMonster · Message Templates · 内容与价格模板

当前实现：

- 模板支持保存消息内容，并配置付费文字或付费媒体的价格。（[Message Templates · Message Pricing](https://docs.onlymonster.ai/members-features/message-templates)）

- Insert 将模板放入编辑区继续修改；Send 按模板当前配置直接发送。（[Message Templates · Inserting and Sending Templates](https://docs.onlymonster.ai/members-features/message-templates)）

#### CreatorHero · Scripts · 文本与媒体组合

当前实现：

- 创建脚本时可保存标题、正文、姓名变量和媒体，并放入指定文件夹。（[Scripts · Creating a Script](https://help.creatorhero.com/en/articles/10514438-scripts)）

- 脚本支持导入和导出，方便批量保存与恢复。（[Scripts · Export & Import Scripts](https://help.creatorhero.com/en/articles/10514438-scripts)）



### 3.3 用销售反馈决定复用与制作方向

问题（分析）：只知道总销售额，不知道哪些内容适合继续卖，哪些只是曝光多。

作用（分析）：把内容、发送与购买结果关联，区分“卖得多”和“单位机会贡献高”。

示例情境：内容负责人打开旅行系列文件夹，查看哪些素材被发送、被购买，以及对应的销售消息。

主要使用者：内容负责人 + 经营分析

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：Vault Pro 已有素材和文件夹统计；CreatorHero 可沿文件夹、PPV、发送记录下钻。借鉴方向：核实 Infloww 能否贯通同一查看路径。待确认：实际分析需求；打包收入不可按素材求和。

核实依据：[Infloww · Media statistics](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)；[Infloww · Message Dashboard](https://help.infloww.com/en/articles/262061-message-dashboard)；[CreatorHero · PPV tracking](https://help.creatorhero.com/en/articles/10492637-ppv-tracking)

#### Infloww · Vault Pro · 素材统计

当前实现：

- 素材层展示发送次数、解锁次数／比例与毛收入。（[Media statistics · Viewing statistics in Grid and Table views](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)）

- 非默认文件夹和分类汇总发送数、收入，并以合计解锁数除以合计发送数计算整体解锁率。（[Media statistics · Understanding folder and category summaries](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)）

适用边界：

- 素材统计从 2026 年 8 月 27 日开始提供，不包含此前数据；直接从 OnlyFans 或其他流程发送的内容可能造成统计差异。（[Media statistics · Important information about statistics](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)）

- OnlyFans Mass Messages（OFMM）的发送、解锁及收入不计入；解锁次数与毛收入不扣除拒付（chargeback）。（[Media statistics · 文章开篇 / Vault Pro provides the following statistics](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)）

- 多素材打包销售时，每个素材都会记入整笔消息价格；不能把这些素材的收入直接相加当作独立交易收入。（[Media statistics · Important information about statistics](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)）

#### CreatorHero · PPV Tracking · 文件夹到消息

当前实现：

- 在文件夹层查看收入、购买率和购买数，进入后查看具体 PPV 的发送数、购买数、净收入及平均净价。（[PPV tracking · Detailed PPV Tracking](https://help.creatorhero.com/en/articles/10492637-ppv-tracking)）

- 进一步进入单条消息可查看各次发送及购买记录，并通过 View in Chat 回到原会话。（[PPV tracking · Message Table](https://help.creatorhero.com/en/articles/10492637-ppv-tracking)）



## 4. 扩大经营产能，复制有效经验

扩大有效工作量，降低对个别员工的依赖。



分析范围：经营对象是人员、经验与执行流程，关注分工、培训和可承担的工作量。账号访问、敏感操作和责任追溯归入“经营可控性”。



### 4.1 划分工作范围，减少多人协作冲突

问题（分析）：多人看到同一收件箱，容易重复回复，也容易都以为别人会处理。

作用（分析）：通过分组与范围过滤减少交叉处理；人员责任和班次权限需要分别明确。

示例情境：早晚班交替：明确每组由谁处理、未完事项交给谁，并检查超时会话。

主要使用者：班次主管

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：Infloww 可分组过滤，但不能把员工绑定到组，员工仍可看完整收件箱；Supercreator 按聊天员建立颜色组。借鉴方向：评估组与负责人的明确映射。待确认：颜色组不等于强制隔离或交接闭环。

核实依据：[Infloww · Split Inbox](https://help.infloww.com/en/articles/262029-split-inbox)；[Supercreator · Split Inbox](https://help.supercreator.app/en/articles/7953655-split-inbox-assign-fans-to-chatters)



#### Infloww · Split Inbox · 分组与范围过滤

当前实现：

- 收件箱最多拆成 9 组；员工按负责的组过滤，新订阅者的自动分配以长期工作量平衡为目标。（[Split Inbox · How to use Split Inbox](https://help.infloww.com/en/articles/262029-split-inbox)）

- 可手动把粉丝移到其他组；修改组数也会重新分配粉丝。（[Split Inbox · Moving fans to other groups](https://help.infloww.com/en/articles/262029-split-inbox)）

适用边界：

- 当前版本不能把员工直接绑定到分组，官方建议另行告知员工负责哪些组。（[Split Inbox · FAQs](https://help.infloww.com/en/articles/262029-split-inbox)）



#### Supercreator · Split Inbox · 固定颜色分组

当前实现：

- 按聊天员工设置颜色组，随机把粉丝分入各组；粉丝通常保持在原组。（[Split Inbox · How does it work?](https://help.supercreator.app/en/articles/7953655-split-inbox-assign-fans-to-chatters)）

- 最多设置 3 个颜色组；改变组数会重新生成分组，部分粉丝会换组。（[Split Inbox · How to use it?](https://help.supercreator.app/en/articles/7953655-split-inbox-assign-fans-to-chatters)）



#### OnlyMonster · Inboxes · 分组与显示范围

当前实现：

- Inboxes 最多支持 6 组，可自定义名称和颜色，并选择显示哪些组。（[Inboxes · Enhanced System Highlights](https://docs.onlymonster.ai/members-features/inboxes-advanced-group-chat-splitting)）



### 4.2 把优秀员工的经验交给整个团队

问题（分析）：新人从零摸索，优秀员工离开后，常用话术和内容推荐经验也难以延续。

作用（分析）：把成熟员工的消息与内容组合沉淀为共享模板，减少重复准备和新人摸索。

示例情境：把欢迎、需求确认和内容推荐整理成话术序列，供不同员工按场景调用。

主要使用者：培训负责人 + 资深员工

Infloww 能力评估与优化方向（Infloww 已覆盖核心能力）：现状：Scripts 已支持跨创作者共享、从聊天保存话术；竞品也有跨账号复制和模板复用。优化方向：明确适用场景与维护人，验证新人能否稳定调用，而非重复建设共享功能。

核实依据：[Infloww · Scripts](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)；[CreatorHero · Scripts](https://help.creatorhero.com/en/articles/10514438-scripts)；[Supercreator · Message Copilot / Library](https://help.supercreator.app/en/articles/6317851-message-copilot)

#### Infloww · Scripts · 跨创作者共享话术

当前实现：

- 话术和序列可在不同创作者之间共享，团队可复用同一套已整理内容。（[Scripts · Sharing among creators](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)）

- 聊天中的消息可直接另存为新话术，再用于后续会话。（[Scripts · Quick adding a new script](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)）

#### Supercreator · Message Library · 模板匹配

当前实现：

- 输入文字时会匹配消息库并提供自动补全；已向当前粉丝发过的模板会以划线方式提示。（[Message Copilot / Library · How to use your Message Library](https://help.supercreator.app/en/articles/6317851-message-copilot)）

#### OnlyMonster · Message Templates · 下一步提示

当前实现：

- 模板发送后会提供下一条模板的导航提示。（[Message Templates · Navigation Assistance](https://docs.onlymonster.ai/members-features/message-templates)）

#### CreatorHero · Scripts · 跨账号复制

当前实现：

- 通过文件夹旁的复选框，可将脚本复制到其他创作者账号。（[Scripts · FAQ](https://help.creatorhero.com/en/articles/10514438-scripts)）



### 4.3 根据工作负荷安排人员与培训

问题（分析）：主管只看总销售排名，难以区分人员投入、工作负荷与能力差异。

作用（分析）：结合工时、消息与响应情况了解工作分布，为排班和培训提供依据。

示例情境：员工销售下降：先看是否少了机会，再看回复和报价过程，最后讨论培训或排班。

主要使用者：主管 + 培训负责人

Infloww 能力评估与优化方向（Infloww 提供管理数据）：现状：Infloww 有销售、直聊、排班及打卡工时；Supercreator 工时按发信活动估算，CreatorHero 也统计活跃时间。优化方向：主管结合数据和会话样本安排排班、培训，不称为系统自动诊断。

核实依据：[Infloww · Employee Reports](https://help.infloww.com/en/articles/262078-employee-reports)；[Infloww · Message Dashboard](https://help.infloww.com/en/articles/262061-message-dashboard)；[Supercreator · Chatter Analytics](https://help.supercreator.app/en/articles/8118589-chatter-analytics)；[CreatorHero · Chatter Tracking](https://help.creatorhero.com/en/articles/10426384-chatter-tracking)

#### Infloww · Employee Reports · 人员投入与工作量

当前实现：

- 员工报表包含销售、消息、解锁率、排班／打卡工时和响应时间等指标。（[Employee Reports · Key metrics explained](https://help.infloww.com/en/articles/262078-employee-reports)）

#### Supercreator · Chatter Analytics · 员工与会话明细

当前实现：

- Team Overview 汇总员工销售、消息、估算工时和薪酬。（[Chatter Analytics · Team Overview](https://help.supercreator.app/en/articles/8118589-chatter-analytics)）

- Messages Breakdown 可通过 View Chat 查看具体对话。（[Chatter Analytics · Messages Breakdown](https://help.supercreator.app/en/articles/8118589-chatter-analytics)）

适用边界：

- Activity 的工时按有发信活动的 30 分钟区间估算，不等同于精确打卡时长。（[Chatter Analytics · Activity](https://help.supercreator.app/en/articles/8118589-chatter-analytics)）

#### CreatorHero · Chatter Tracking · 员工工作明细

当前实现：

- Chatter Tracking 的员工表展示收入、响应时间、消息和 PPV 发送／购买情况，并可进入个人详情。（[Chatter Tracking · All Chatters Table](https://help.creatorhero.com/en/articles/10426384-chatter-tracking)）



## 5. 业务交给团队，经营仍然可控

明确访问与操作边界，掌握执行过程和责任。



分析范围：经营对象是账号、操作权限与责任。关注谁能进入、能做什么、执行后如何核对；工作速度与经验复用归入“经营产能与能力复制”。



### 5.1 按工作需要授予账号访问

问题（分析）：多人共用创作者账号，容易把登录凭据与长期访问权一起交给员工。

作用（分析）：将账号访问配置为可授予、可限制的工作权限，减少凭据共享和非工作时段访问。

示例情境：新员工只获得所负责账号的访问；启用班次限制后，下班时段无法再打开账号。

主要使用者：账号负责人 + 管理员

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：Infloww 可按员工分配创作者并停用员工账号，证实的是平台数据访问；OnlyMonster 可限制非班次账号访问。借鉴方向：评估时段控制。待确认：Infloww 是否已有同类限制，以及 OnlyFans 会话的访问边界。

核实依据：[Infloww · Team management](https://help.infloww.com/en/articles/262104-team-management-a-guide-to-managing-employees-in-infloww)；[OnlyMonster · Shift-Based Access Control](https://docs.onlymonster.ai/management-system/shift-based-access-control)；[Supercreator · SharedLogin](https://help.supercreator.app/en/articles/8557225-supercreator-s-sharedlogin)

#### Infloww · Team Management · 员工账号与创作者授权

当前实现：

- 员工通过一次性邀请链接验证账号并设置密码；管理员随后可为员工分配创作者，员工只能查看获分配创作者的数据与表现。（[Team management · How to manage employees on Infloww](https://help.infloww.com/en/articles/262104-team-management-a-guide-to-managing-employees-in-infloww)）

- 停用员工会撤销其对 Infloww 及相关数据的访问，同时保留非活跃的员工账号记录。（[Team management · How to delete or deactivate employees on Infloww](https://help.infloww.com/en/articles/262104-team-management-a-guide-to-managing-employees-in-infloww)）

#### Supercreator · SharedLogin · 共享会话与访问控制

当前实现：

- 通过共享已登录会话，让员工访问获授权的账号，无需共享账号密码；管理员可随时允许或阻止账号访问。（[SharedLogin · Why use SharedLogin™?](https://help.supercreator.app/en/articles/8557225-supercreator-s-sharedlogin)）

适用边界：

- 新成员默认没有任何 OnlyFans 账号权限，需要在 Team Members 页面配置。（[SharedLogin · Permissions](https://help.supercreator.app/en/articles/8557225-supercreator-s-sharedlogin)）

#### OnlyMonster · Shift-Based Access · 班次访问限制

当前实现：

- 可按角色启用班次访问限制；开启后，该角色的成员只能在排班时段访问账号。（[Shift-Based Access Control · Role-Based Access](https://docs.onlymonster.ai/management-system/shift-based-access-control)）

适用边界：

- 具备 View Shifts 权限的成员可在班次临近结束时延长 15 分钟。（[Shift-Based Access Control · Shift Extension](https://docs.onlymonster.ai/management-system/shift-based-access-control)）

#### CreatorHero · Creators · 员工账号范围

当前实现：

- 管理员可为每位创作者设置团队成员访问范围。（[Creators · Access](https://help.creatorhero.com/en/articles/10408614-creators)）



### 5.2 限定岗位可见数据与操作

问题（分析）：聊天员工需要接待粉丝，但不一定需要查看全部收入、修改账号设置或删除内容。

作用（分析）：把工作所需功能、敏感操作和数据范围分别授权，让权限与岗位责任相符。

示例情境：聊天员工使用消息与素材；主管查看下属业务数据，管理员保留敏感设置权限。

主要使用者：经营负责人 + 管理员

Infloww 能力评估与优化方向（关键差异待验证）：现状：Infloww 官方证实页面与数据权限，本地前端另有媒体删除和移除创作者记录权限；CreatorHero 列出 OnlyFans 细粒度操作权限。待验证方向：核对 Infloww 权限的实际生效范围，勿把创作者记录移除等同于删除 OnlyFans 账号。

核实依据：[Infloww · Role permissions](https://help.infloww.com/en/articles/262098-role-permissions)；[Infloww · Navigating Infloww’s OF manager](https://help.infloww.com/en/articles/262112-navigating-infloww-s-of-manager)；[CreatorHero · Roles](https://help.creatorhero.com/en/articles/10398444-roles)

#### Infloww · Role Permissions · 功能与数据范围

当前实现：

- 可按角色授予或限制功能页面，并设置本人、本人和下属、全部数据三类数据范围。（[Role permissions · Adjust permissions](https://help.infloww.com/en/articles/262098-role-permissions)）

- Owner 和 Admin 可直接访问银行菜单，其他角色需要获得对应权限后才能访问。（[Navigating Infloww’s OF manager · 文章开篇](https://help.infloww.com/en/articles/262112-navigating-infloww-s-of-manager)）

#### Supercreator · Roles and Permissions · 岗位权限

当前实现：

- 提供 Chatter、Account Manager、Supervisor、Owner 和 Analyst 五类角色，分配后可进一步调整成员权限。（[Setting Roles and Permissions · Setting Roles and Permissions](https://help.supercreator.app/en/articles/9064920-setting-roles-and-permissions)）

- 可限制员工查看银行信息和账号敏感设置；启用限制后，相应功能对员工隐藏。（[Setting Roles and Permissions · Sensitive Information on OnlyFans](https://help.supercreator.app/en/articles/9064920-setting-roles-and-permissions)）

#### OnlyMonster · Roles & Permissions · 敏感操作权限

当前实现：

- 可按角色配置功能和敏感操作的访问权限。（[Roles & Permissions · General Permissions](https://docs.onlymonster.ai/team-and-security-management/roles-and-permissions)）

#### CreatorHero · Roles · 操作权限配置

当前实现：

- 可创建自定义角色，分别选择 OnlyFans 和 CreatorHero 后台权限，再分配给团队成员。（[Roles · Create Custom Roles / Assign and Update Roles](https://help.creatorhero.com/en/articles/10398444-roles)）

- OnlyFans 权限包括消息处理、媒体删除、银行信息访问和删除 OnlyFans 账号等操作。（[Roles · OnlyFans Permissions](https://help.creatorhero.com/en/articles/10398444-roles)）



### 5.3 追溯消息执行，核对发信责任

问题（分析）：业务由多人接续，管理者需要了解谁发了什么，以及消息如何产生。

作用（分析）：通过可查询的消息记录核对发送者、内容与来源，减少只凭口头说明处理问题。

示例情境：出现回复争议时，先按发送者和时间查消息，再回到原会话核对上下文。

主要使用者：主管 + 经营负责人

Infloww 能力评估与优化方向（竞品有可借鉴增量）：现状：Infloww 可追溯员工直聊消息，报表约 10 分钟更新；Supercreator 覆盖多类消息，OnlyMonster 的记录数秒内可见。借鉴方向：优先评估跨消息类型与近实时质检。待确认：输入方式细分是否另有管理价值。

核实依据：[Infloww · Message Dashboard](https://help.infloww.com/en/articles/262061-message-dashboard)；[Supercreator · Chatter Analytics](https://help.supercreator.app/en/articles/8118589-chatter-analytics)；[OnlyMonster · Message Tracker](https://docs.onlymonster.ai/management-system/message-tracker)

#### Infloww · Message Dashboard · 消息记录

当前实现：

- 可查看员工发送或撤回的消息，以及购买状态、收入和响应时间；可从记录打开会话了解上下文。（[Message Dashboard · How to monitor employee messages](https://help.infloww.com/en/articles/262061-message-dashboard)）

适用边界：

- 消息报表约每 10 分钟更新；Direct messages 不含自动和群发消息，仅包含通过 Infloww 发送的员工直聊消息。（[Message Dashboard · How to monitor employee messages](https://help.infloww.com/en/articles/262061-message-dashboard)）

#### Supercreator · Chatter Analytics · 多类消息记录

当前实现：

- Chatter Messages 可查询工作区收发消息，并按消息类别、方向、类型、购买状态和时间筛选。（[Chatter Analytics · Chatter Messages](https://help.supercreator.app/en/articles/8118589-chatter-analytics)）

- 类别包括聊天员工直聊、群发、自动生成及系列消息等。（[Chatter Analytics · Chatter Messages](https://help.supercreator.app/en/articles/8118589-chatter-analytics)）

#### OnlyMonster · Message Tracker · 发信过程追溯

当前实现：

- 消息记录区分手输、粘贴、AI 助手和模板等输入来源，并显示发送者、价格及购买状态。（[Message Tracker · Table Columns](https://docs.onlymonster.ai/management-system/message-tracker)）

- 可将筛选后的消息记录导出为 CSV 或 XLSX。（[Message Tracker · Export](https://docs.onlymonster.ai/management-system/message-tracker)）

适用边界：

- Message Tracker 中的消息自发送日起保存 3 个月。（[Message Tracker · How It Works](https://docs.onlymonster.ai/management-system/message-tracker)）

#### CreatorHero · Message History · 消息历史

当前实现：

- 可按消息类型和发送者筛选历史记录，查看发送者、粉丝、日期，并跳转到原消息。（[Message History · Page Features](https://help.creatorhero.com/en/articles/10498134-message-history)）



## 官方资料索引

- Infloww · [Navigating Infloww’s OF manager](https://help.infloww.com/en/articles/262112-navigating-infloww-s-of-manager)

- Infloww · [Infloww vs. CreatorHero（对比截至 2026 年 5 月）](https://infloww.com/infloww-vs-creatorhero)

- Infloww · [Getting started with OnlyFans Messages Pro](https://help.infloww.com/en/articles/262067-getting-started-with-onlyfans-messages-pro)

- Infloww · [Message fans after their subscription expires](https://help.infloww.com/en/articles/262048-message-fans-after-their-subscription-expires)

- Infloww · [Team management](https://help.infloww.com/en/articles/262104-team-management-a-guide-to-managing-employees-in-infloww)

- Supercreator · [Message Flow](https://help.supercreator.app/en/articles/12278471-message-flow)

- OnlyMonster · [Changelog 2025](https://docs.onlymonster.ai/changelog/changelog-2025)

- OnlyMonster · [Roles & Permissions](https://docs.onlymonster.ai/team-and-security-management/roles-and-permissions)

- CreatorHero · [Display Settings](https://help.creatorhero.com/en/articles/10434184-display-settings)

- CreatorHero · [Expiring Fans](https://help.creatorhero.com/en/articles/11102180-expiring-fans)

- CreatorHero · [Creators](https://help.creatorhero.com/en/articles/10408614-creators)

- CreatorHero · [Message History](https://help.creatorhero.com/en/articles/10498134-message-history)

- Infloww · [Role permissions](https://help.infloww.com/en/articles/262098-role-permissions)

- Supercreator · [SharedLogin](https://help.supercreator.app/en/articles/8557225-supercreator-s-sharedlogin)

- Supercreator · [Setting Roles and Permissions](https://help.supercreator.app/en/articles/9064920-setting-roles-and-permissions)

- CreatorHero · [Roles](https://help.creatorhero.com/en/articles/10398444-roles)

- Infloww · [Split Inbox](https://help.infloww.com/en/articles/262029-split-inbox)

- Infloww · [Scripts](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)

- Infloww · [Message Dashboard](https://help.infloww.com/en/articles/262061-message-dashboard)

- Infloww · [Employee Reports](https://help.infloww.com/en/articles/262078-employee-reports)

- Infloww · [Smart Lists](https://help.infloww.com/en/articles/262064-smart-lists)

- Supercreator · [Inbox Copilot](https://help.supercreator.app/en/articles/6317610-inbox-copilot)

- Supercreator · [Pricing Copilot](https://help.supercreator.app/en/articles/6317627-pricing-copilot)

- Supercreator · [Chatter Analytics](https://help.supercreator.app/en/articles/8118589-chatter-analytics)

- Supercreator · [Split Inbox](https://help.supercreator.app/en/articles/7953655-split-inbox-assign-fans-to-chatters)

- OnlyMonster · [Shift-Based Access Control](https://docs.onlymonster.ai/management-system/shift-based-access-control)

- OnlyMonster · [Message Tracker](https://docs.onlymonster.ai/management-system/message-tracker)

- OnlyMonster · [Inboxes](https://docs.onlymonster.ai/members-features/inboxes-advanced-group-chat-splitting)

- OnlyMonster · [Advanced Fan Information](https://docs.onlymonster.ai/members-features/advanced-fan-information)

- CreatorHero · [PPV Overview](https://help.creatorhero.com/en/articles/10526671-ppv-overview)

- CreatorHero · [PPV Follow-Ups](https://help.creatorhero.com/en/articles/10499966-ppv-follow-ups)

- CreatorHero · [Chatter Tracking](https://help.creatorhero.com/en/articles/10426384-chatter-tracking)

- Infloww · [Fan Insights](https://help.infloww.com/en/articles/523936-fan-insights)

- Infloww · [Smart Messages](https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages)

- Supercreator · [Fans Copilot / CRM](https://help.supercreator.app/en/articles/6316422-fans-copilot-crm)

- Supercreator · [Message Copilot / Library](https://help.supercreator.app/en/articles/6317851-message-copilot)

- OnlyMonster · [Message Templates](https://docs.onlymonster.ai/members-features/message-templates)

- OnlyMonster · [Auto Messages](https://docs.onlymonster.ai/members-features/auto-messages)

- CreatorHero · [Fan Info](https://help.creatorhero.com/en/articles/10500000-fan-info)

- CreatorHero · [Scripts](https://help.creatorhero.com/en/articles/10514438-scripts)

- Infloww · [Vault Pro](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)

- Infloww · [Media statistics](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)

- Supercreator · [Vault Copilot](https://help.supercreator.app/en/articles/6317586-vault-copilot)

- OnlyMonster · [Vault management](https://docs.onlymonster.ai/members-features/vault-management)

- CreatorHero · [Vault](https://help.creatorhero.com/en/articles/10461326-vault)

- CreatorHero · [PPV tracking](https://help.creatorhero.com/en/articles/10492637-ppv-tracking)

- CreatorHero · [Chat summary](https://help.creatorhero.com/en/articles/10523101-chat-summary-feature)

- Infloww · [Fan reports](https://help.infloww.com/en/articles/276167-fan-reports)

- Supercreator · [Creator Analytics](https://help.supercreator.app/en/articles/8118590-creator-analytics)
