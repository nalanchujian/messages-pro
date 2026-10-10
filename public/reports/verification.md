# 四平台八模块报告：事实核查记录

核查日期：2026-10-10。核查对象为[主报告](./index.html)中的 32 张平台/模块卡片，以及跨平台比较结论。证据优先级：平台当前官方帮助中心与产品文档 > 官方交互教程/视频 > 用户提供的界面截图。官方营销文案中的效果数字不作为实测结论。本次没有四家付费账号，因而只能确认“官方明确介绍该功能”，不能确认具体租户的开通状态、实际准确率、稳定性或增收效果。

## 核查后的重要修正

1. **机构级粉丝指标并非 OnlyMonster 独有。** [Infloww Fan Insights](https://help.infloww.com/en/articles/523936-fan-insights)也有机构内近 30 天消费相对分层和终身拒付率标签，但指标约每天更新且受角色权限控制。OnlyMonster 的区别是[账号/机构消费切换与 0–5 Buying Power](https://docs.onlymonster.ai/members-features/advanced-fan-information)。因此已重写“粉丝洞察”的关键差异。
2. **不能把 CreatorHero 的 AI 概括为只有后台 Copilot。** 它还提供[会话摘要](https://help.creatorhero.com/en/articles/10523101-chat-summary-feature)和[聊天翻译](https://help.creatorhero.com/en/articles/10500007-ai-translator)。[Hero Copilot](https://help.creatorhero.com/en/articles/17059054-hero-copilot)本身仍偏机构数据和经审批的后台动作，不会代发粉丝消息。
3. **OnlyMonster 也有辅助写作，Mimic AI 不是其唯一 AI。** [AI Assistant 设置](https://docs.onlymonster.ai/ai-magic-assistant/ai-settings-button-configurations-guide)可配置写作模式；[Mimic AI](https://docs.onlymonster.ai/mimic-ai/mimic-ai-in-chats)会在付款意向、内容请求、事实核对等节点交回人工。
4. **素材重复发送提示并非 Supercreator 独有。** [Infloww Vault Pro](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)和[OnlyMonster Vault](https://docs.onlymonster.ai/members-features/vault-management)也显示已发送/已购状态。Supercreator 的特别限制是[同一媒体重复上传会被当成不同实例，且 Super Mass 不支持逐粉丝媒体状态](https://help.supercreator.app/en/articles/6317586-vault-copilot)。
5. **团队分析不能简单判定 Infloww 最细。** [Supercreator Chatter Analytics](https://help.supercreator.app/en/articles/8118589-chatter-analytics)也提供销售、盈利、活跃区间估算工时和逐条消息日志。其 Analytics 限 CRM Premium / Super AI。Infloww 的[员工报表](https://help.infloww.com/en/articles/262078-employee-reports)另有排班/打卡工时等口径。
6. **CreatorHero Vault“同步 OnlyFans 素材”原说法过宽。** [官方说明](https://help.creatorhero.com/en/articles/10461326-vault)明确的是从 CreatorHero 新上传的素材会出现在对应 OnlyFans Vault，未证明双向或全量历史同步。

## 逐模块核查矩阵

表中“确认”仅指有对应官方功能说明；“条件”表示套餐、权限、数据时效或使用范围限制，不是已登录实测。

| 模块 | 平台 | 核查结果 | 关键证据与边界 |
|---|---|---|---|
| Chat Workspace | Infloww | 确认 | [Messages Pro](https://help.infloww.com/en/articles/262067-getting-started-with-onlyfans-messages-pro)：多创作者收件箱、粉丝标签页、通知、在线粉丝与 Focus mode；[Multi-Window](https://help.infloww.com/en/articles/545992-multi-window)单独确认多窗口。 |
| Chat Workspace | Supercreator | 确认 | [Inbox Copilot](https://help.supercreator.app/en/articles/6317610-inbox-copilot)：用行为、近期消费、消息和订阅史设优先级；优先级模型效果未经独立验证。 |
| Chat Workspace | OnlyMonster | 条件 | [ChatSpace](https://docs.onlymonster.ai/onlymonster-browser/chatspace)：独立聊天窗口、跨创作者切换；目前只支持 OnlyFans，使用受角色权限控制。 |
| Chat Workspace | CreatorHero | 确认 | 用户提供界面显示三栏布局；[Chatting Features](https://help.creatorhero.com/en/collections/12037232-chatting-features)列出聊天工具。具体布局会随版本变化。 |
| Fan Insights | Infloww | 条件 | [Fan Insights](https://help.infloww.com/en/articles/523936-fan-insights)：消费、订阅、机构分层、拒付风险等；大部分指标每日更新、消费起点为接入后；[PPV 时间线](https://help.infloww.com/en/articles/418759-fan-insights-panel)单独确认。 |
| Fan Insights | Supercreator | 确认 | [Fans Copilot CRM](https://help.supercreator.app/en/articles/6316422-fans-copilot-crm)：AI 填写画像、自动标签、PPV 记录和 Fan Hints；并非每位粉丝都会出现建议。 |
| Fan Insights | OnlyMonster | 确认 | [Advanced Fan Information](https://docs.onlymonster.ai/members-features/advanced-fan-information)：账号/机构消费、Buying Power 0–5、拒付提示、偏好、已读与回复时间。评分准确率未验证。 |
| Fan Insights | CreatorHero | 确认 | [Fan Info](https://help.creatorhero.com/en/articles/10500000-fan-info)：时区、订阅、消费、PPV 平均/最高价、购买率和时间线。 |
| Fan Management | Infloww | 条件 | [Smart Lists](https://help.infloww.com/en/articles/262064-smart-lists)：消费档位或新粉丝天数；仅一组消费分档，初始采集约 30 分钟，约每 6 小时更新。 |
| Fan Management | Supercreator | 条件 | [Super Mass](https://help.supercreator.app/en/articles/6306457-super-mass)：预设受众和四档个性化价格；限 Super AI，较大粉丝群的初始扫描可达数日至数周。 |
| Fan Management | OnlyMonster | 条件 | [Dynamic Fan Lists](https://docs.onlymonster.ai/members-features/dynamic-fan-lists)：账号/机构消费与交易、聊天、来源等过滤及 OnlyFans Collections 同步；通常 6 小时、活跃聊天 15 分钟更新，部分过滤器不可组合。 |
| Fan Management | CreatorHero | 条件 | [Custom Lists](https://help.creatorhero.com/en/articles/10523129-custom-lists)多条件 AND，最新结果需手动刷新；[Fan Spend Lists](https://help.creatorhero.com/en/articles/11101979-fan-spend-lists)数分钟更新但限 Professional；另有[近期消费列表](https://help.creatorhero.com/en/articles/10522981-recent-spend-list)。 |
| Sales & PPV | Infloww | 条件 | [Message Dashboard](https://help.infloww.com/en/articles/262061-message-dashboard)：消息购买状态/收入/发送人，约 10 分钟更新且只含 Infloww 发送消息；[Smart Messages](https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages)为规则触发。 |
| Sales & PPV | Supercreator | 条件 | [Pricing Copilot](https://help.supercreator.app/en/articles/6317627-pricing-copilot)给价格区间和 PriceGuard；[Super Mass](https://help.supercreator.app/en/articles/6306457-super-mass)按受众分四档价格，限 Super AI。增收宣称未实测。 |
| Sales & PPV | OnlyMonster | 确认 | [Auto Messages](https://docs.onlymonster.ai/members-features/auto-messages)：欢迎、上线、到期相关触发，含付费消息、购买率、收入；也能触发 Mimic。 |
| Sales & PPV | CreatorHero | 确认 | [PPV Overview](https://help.creatorhero.com/en/articles/10526671-ppv-overview)只在 Chatting UI；[PPV Follow-Ups](https://help.creatorhero.com/en/articles/10499966-ppv-follow-ups)自动向未购粉丝发一次跟进；[Sales Assignment](https://help.creatorhero.com/en/articles/10518553-sales-assignment)可重指派但无重指派历史。 |
| Vault & Content | Infloww | 条件 | [Vault Pro](https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro)：批量上传、元数据、已发送/已购提示；[统计口径](https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro)从 2026-08-27 起、排除部分外部流程。 |
| Vault & Content | Supercreator | 条件 | [Vault Copilot](https://help.supercreator.app/en/articles/6317586-vault-copilot)：发送/购买状态；重复上传视为不同实例，Super Mass 不做逐粉丝状态检查。官方[交互教程](https://app.arcade.software/share/De4HXa0yWvccdZl4eHQE)可核对界面。 |
| Vault & Content | OnlyMonster | 条件 | [Vault Management](https://docs.onlymonster.ai/members-features/vault-management)：媒体标签、建议价、已发送/已购状态；重复上传也会产生状态不一致。 |
| Vault & Content | CreatorHero | 条件 | [Vault](https://help.creatorhero.com/en/articles/10461326-vault)：分类、标签、价格；仅确认新上传媒体进入对应 OnlyFans Vault；[PPV Tracking](https://help.creatorhero.com/en/articles/10492637-ppv-tracking)统计内容销售。 |
| Scripts & Messaging | Infloww | 确认 | [Scripts](https://help.infloww.com/en/articles/262042-getting-started-with-scripts)：序列、最多三条人工可选条件脚本、跨创作者共享、发送与购买统计。 |
| Scripts & Messaging | Supercreator | 确认 | [Message Copilot](https://help.supercreator.app/en/articles/6317851-message-copilot)：消息库、输入补全、PPV 媒体/价格及已发提醒；此模块不等于自动生成。 |
| Scripts & Messaging | OnlyMonster | 条件 | [Message Templates V2](https://docs.onlymonster.ai/members-features/message-templates)：文本/媒体/价格/名字变量、内部备注、后续模板提示；管理与使用受角色权限控制。 |
| Scripts & Messaging | CreatorHero | 确认 | [Scripts](https://help.creatorhero.com/en/articles/10514438-scripts)：文件夹、变量、媒体、导入导出及复制至其他创作者。 |
| AI & Smart Engine | Infloww | 条件 | [AI Copilot](https://help.infloww.com/en/articles/262036-using-ai-copilot-in-messages-pro)：仍标 Beta，三条建议由人工选、编辑、发送；[额度设置](https://help.infloww.com/en/articles/262040-getting-started-with-ai-copilot)另见官方说明。 |
| AI & Smart Engine | Supercreator | 条件 | [Izzy](https://help.supercreator.app/en/articles/11385335-izzy-ai)可自动聊天和销售，需配置创作者资料与产品目录；[AI Pricing](https://help.supercreator.app/en/articles/11993412-ai-pricing)规定套餐与消息额度。 |
| AI & Smart Engine | OnlyMonster | 条件 | [Mimic AI](https://docs.onlymonster.ai/mimic-ai/mimic-ai-in-chats)有会话阶段、停止原因及人工交接；[AI Assistant](https://docs.onlymonster.ai/ai-magic-assistant/ai-settings-button-configurations-guide)是另一套辅助写作功能。 |
| AI & Smart Engine | CreatorHero | 条件 | [Chat Summary](https://help.creatorhero.com/en/articles/10523101-chat-summary-feature)、[AI Translator](https://help.creatorhero.com/en/articles/10500007-ai-translator)用于聊天；[Hero Copilot](https://help.creatorhero.com/en/articles/17059054-hero-copilot)早期开放给 Owner/Admin、按用量计费，后台改动须审批，不向粉丝发送消息。 |
| Team & Operations | Infloww | 条件 | [Employee Reports](https://help.infloww.com/en/articles/262078-employee-reports)按员工/创作者/时间统计；[Split Inbox](https://help.infloww.com/en/articles/262029-split-inbox)最多九组，但不能在 Messages Pro 中直接把组绑定员工。 |
| Team & Operations | Supercreator | 条件 | [Split Inbox](https://help.supercreator.app/en/articles/7953655-split-inbox-assign-fans-to-chatters)最多三组，改组数会重分；[Chatter Analytics](https://help.supercreator.app/en/articles/8118589-chatter-analytics)含消息审查与盈利，限付费套餐。 |
| Team & Operations | OnlyMonster | 条件 | [Inboxes](https://docs.onlymonster.ai/members-features/inboxes-advanced-group-chat-splitting)最多六组；[Message Tracker](https://docs.onlymonster.ai/management-system/message-tracker)仅存三个月；[班次访问控制](https://docs.onlymonster.ai/management-system/shift-based-access-control)要求 3.11.0+ 且按角色启用。 |
| Team & Operations | CreatorHero | 条件 | [Chatter Tracking](https://help.creatorhero.com/en/articles/10426384-chatter-tracking)按单创作者查看表现；[Sales Assignment](https://help.creatorhero.com/en/articles/10518553-sales-assignment)将 PPV 归给发送者、Tip 归给上条消息发送者，重指派历史不留痕。 |

## 截图与资料的适用范围

32 张图对应的是该功能的界面样本，不是同一天、同套餐、同账号下的实测结果；部分来自用户提供的真实界面，部分来自官方文档或官方教程。Supercreator Vault 的原文档配图文件名包含“ChatGPT Image”，已改用[官方交互教程](https://app.arcade.software/share/De4HXa0yWvccdZl4eHQE)实际画面，不把原配图当作实界面证据。图片来源登记见[screenshot-provenance.json](./screenshot-provenance.json)。

若用于采购或对外宣称，还需要在同一时间、同一套餐下登录四家产品，逐项录屏复核功能开通、数据刷新、AI 输出质量和销售归因；这些目前都不属于“已验证”。
