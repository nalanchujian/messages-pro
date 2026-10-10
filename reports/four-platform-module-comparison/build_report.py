from pathlib import Path
import json, html

ROOT=Path(__file__).parent
provenance=json.loads((ROOT/'screenshot-provenance.json').read_text())
platforms=[('infloww','Infloww'),('supercreator','Supercreator'),('onlymonster','OnlyMonster'),('creatorhero','CreatorHero')]
labels={'official-image':'官方文档界面图','official-video-frame':'官方教程视频画面','official-demo-frame':'官方交互教程画面','provided-screenshot':'用户提供的实界面截图'}

modules=[
{
'id':'chat','n':'01','title':'Chat Workspace','cn':'会话工作台','question':'一线 Chatter 如何在高并发下找到、打开并完成下一段对话？',
'diff':'Infloww 强在多创作者、多会话和成熟工具入口；Supercreator 把优先级判断前置到收件箱；OnlyMonster 把高密度操作集中在独立 ChatSpace；CreatorHero 延续三栏工作流，并把 PPV 与提醒等工具贴近会话。',
'cards':{
'infloww':('多创作者与粉丝标签页、在线粉丝、通知、筛选和 Focus mode 构成日常工作台。','优势是切换成本低；工作台功能丰富，也需要把优先级和执行动作保持清楚。',['https://help.infloww.com/en/articles/262067-getting-started-with-onlyfans-messages-pro','https://help.infloww.com/en/articles/545992-multi-window']),
'supercreator':('Inbox Copilot 根据会话、消费与行为信号提示优先处理对象；聊天区和右侧 CRM 在同屏。','核心差异是先判断“聊谁”，再进入具体对话；部分 AI 能力受套餐影响。',['https://help.supercreator.app/en/articles/6317610-inbox-copilot','https://help.supercreator.app/en/articles/6306439-start-here-product-overview']),
'onlymonster':('ChatSpace 是独立聊天窗口，支持跨创作者切换、粉丝标签页、固定列表和密集快捷工具。','面向高频操作，熟练用户效率高；ChatSpace 官方目前注明仅支持 OnlyFans。',['https://docs.onlymonster.ai/onlymonster-browser/chatspace']),
'creatorhero':('左侧会话与最近浏览，中部聊天，右侧 Fan Info；顶部和输入区集成搜索、提醒及内容工具。','强调聊天、销售状态和侧栏信息同屏可达；截图只能证明当前可见入口。',['https://help.creatorhero.com/en/collections/12037232-chatting-features','https://help.creatorhero.com/en/articles/10500000-fan-info'])}
},
{
'id':'insights','n':'02','title':'Fan Insights','cn':'粉丝洞察','question':'打开一个粉丝时，能否迅速理解价值、偏好、风险与最佳沟通时机？',
'diff':'Infloww 与 OnlyMonster 都提供机构级消费和拒付风险，但口径不同：前者给机构内近 30 天相对消费分层，后者给账号/机构消费切换与 0–5 购买潜力；Supercreator 加入 AI 画像和行动提示；CreatorHero 集中展示时区与 PPV 购买轨迹。',
'cards':{
'infloww':('Fan Insights 展示消费、订阅、机构内消费分层、拒付风险、列表及备注；另有 PPV 时间线。','消费和机构指标通常每日更新；消费统计有接入 Infloww 后的时间边界，机构指标还受角色权限控制。',['https://help.infloww.com/en/articles/523936-fan-insights','https://help.infloww.com/en/articles/418759-fan-insights-panel']),
'supercreator':('Fan CRM 支持 AI 填写偏好和备注、自动标签、PPV 历史与 Fan Hints。','画像直接通向下一步建议；AI 自动填充内容仍需人工核对。',['https://help.supercreator.app/en/articles/6316422-fans-copilot-crm']),
'onlymonster':('同时看账号级和机构级消费，Buying Power 0–5、拒付风险、最近回复/已读、来源与偏好。','更适合多账号机构识别同一粉丝的总体价值；风险分值的真实准确率无法仅凭文档验证。',['https://docs.onlymonster.ai/members-features/advanced-fan-information']),
'creatorhero':('显示粉丝时区、订阅状态、消费和打赏、PPV 平均/最高价、购买率与购买时间线。','销售和回复时机的事实信息集中；画像本身更多依赖人工记录。',['https://help.creatorhero.com/en/articles/10500000-fan-info'])}
},
{
'id':'management','n':'03','title':'Fan Management','cn':'粉丝分群与管理','question':'平台如何把海量粉丝变成可操作的名单？',
'diff':'四家都能分群，但对象和刷新机制不同：Infloww 的 Smart Lists 主要用于触达；Supercreator 的预设分群直接服务 Super Mass；OnlyMonster 的 Dynamic Lists 条件更广且可同步 OnlyFans；CreatorHero 既有消费列表，也有多条件 Custom Lists。',
'cards':{
'infloww':('Smart Lists 可按累计消费档位或新粉丝天数建组，并用于优先群发及 Smart Messages。','当前文档注明消费分档仅能有一组，列表约每 6 小时更新，不宜当实时行动队列。',['https://help.infloww.com/en/articles/262064-smart-lists']),
'supercreator':('Super Mass 提供新粉丝、消费粉丝、流失消费粉丝等预设受众，并结合个性化定价。','分群更偏营销投放；Super Mass 限 Super AI 套餐，大账号的初始扫描可能需要数日至数周。',['https://help.supercreator.app/en/articles/6306457-super-mass']),
'onlymonster':('Dynamic Fan Lists 组合订阅、账号/机构消费、交易次数、购买日期、聊天活跃和来源链接，可同步 OnlyFans Collections。','普通列表约 6 小时更新，活跃聊天列表约 15 分钟；部分过滤条件不能与其他条件组合。',['https://docs.onlymonster.ai/members-features/dynamic-fan-lists']),
'creatorhero':('Custom Lists 可组合消费、近期开销、订阅时长、回复、续订、Tip 和 PPV 购买次数；另有消费与近期消费列表。','Custom Lists 查看最新结果需手动刷新；Fan Spend Lists 数分钟自动更新，限 Professional 套餐。',['https://help.creatorhero.com/en/articles/10523129-custom-lists','https://help.creatorhero.com/en/articles/11101979-fan-spend-lists','https://help.creatorhero.com/en/articles/10522981-recent-spend-list'])}
},
{
'id':'sales','n':'04','title':'Sales & PPV','cn':'销售与 PPV','question':'从价格建议、发送、购买状态到跟进，哪个环节被产品真正闭环？',
'diff':'Supercreator 将逐粉丝定价接入 PPV 与群发；CreatorHero 把 PPV 状态、自动跟进和员工归因串起；Infloww 连接消息销售与团队质检；OnlyMonster 将触发式营销和购买数据放在同一运营系统。',
'cards':{
'infloww':('Message Dashboard 可按购买状态、价格和发送人筛选，查看消息收入、回复时间并回到对话；Smart Messages 支持触发式跟进。','报表约 10 分钟更新，且该报表仅含 Infloww 发送的消息。',['https://help.infloww.com/en/articles/262061-message-dashboard','https://help.infloww.com/en/articles/262059-getting-started-with-smart-messages']),
'supercreator':('Pricing Copilot 提供粉丝价格区间和 PriceGuard；Super Mass 可按粉丝分层产生个性化价格组。','价格建议与触达耦合紧；官方宣称的增收效果不是本报告实测结论。',['https://help.supercreator.app/en/articles/6317627-pricing-copilot','https://help.supercreator.app/en/articles/6306457-super-mass']),
'onlymonster':('Auto Messages 按欢迎、上线、到期或即将到期触发，含付费消息、受众条件和发送/回复/购买/收入指标。','适合规则化持续运营；截图展示的是活动控制台，不等于逐条 PPV 会话成交分析。',['https://docs.onlymonster.ai/members-features/auto-messages']),
'creatorhero':('PPV Overview 按未看、已看、已回复、已购买等状态筛选并跳转聊天；另有未购买跟进、PPV Tracking 和销售归因。','成交后追踪与员工归因路径清楚；具体归因准确性需真实订单验证。',['https://help.creatorhero.com/en/articles/10526671-ppv-overview','https://help.creatorhero.com/en/articles/10499966-ppv-follow-ups','https://help.creatorhero.com/en/articles/10518553-sales-assignment'])}
},
{
'id':'vault','n':'05','title':'Vault & Content','cn':'素材库与内容复用','question':'销售人员能否快速找到适合当前粉丝、且尚未重复发送的素材？',
'diff':'Infloww、Supercreator 和 OnlyMonster 都能在选材时提示已发送/已购买状态，差别主要在统计口径、检索方式与媒体实例识别；CreatorHero 侧重分类和价格，再由 PPV Tracking 查看销售表现。',
'cards':{
'infloww':('Vault Pro 支持批量上传、分类/标签/备注/建议价，并在 Messages Pro 中查看素材信息和发送购买记录。','媒体统计有起算日期和来源范围限制，不能把所有历史销售都当成完整归因。',['https://help.infloww.com/en/articles/262062-getting-started-with-vault-pro','https://help.infloww.com/en/articles/766217-understanding-media-statistics-in-vault-pro']),
'supercreator':('Vault Copilot 在选材界面标识已发送、已购买和免费发送素材，减少重复推送。','仅识别同一媒体实例；重复上传的同一内容视为不同实例。Super Mass 不支持逐粉丝素材状态。',['https://help.supercreator.app/en/articles/6317586-vault-copilot']),
'onlymonster':('Vault 管理素材、标签、建议售价、已发送/购买状态和历史表现，可从聊天中直接选材。','内容资产与销售动作贴近；实际检索效率仍需带真实素材量测。',['https://docs.onlymonster.ai/members-features/vault-management']),
'creatorhero':('Vault 用分类、标签和价格组织媒体；从 CreatorHero 新上传的素材会出现在 OnlyFans Vault，PPV Tracking 单独记录内容销售。','官方资料明确的是新上传素材同步，不能据此推断双向、全量历史同步。',['https://help.creatorhero.com/en/articles/10461326-vault','https://help.creatorhero.com/en/articles/10492637-ppv-tracking'])}
},
{
'id':'scripts','n':'06','title':'Scripts & Messaging','cn':'话术与消息流程','question':'团队如何复用成熟话术，同时保留对每位粉丝的个性化？',
'diff':'Infloww 提供脚本序列与人工选择的条件分支；Supercreator 将消息库嵌入输入和搜索；OnlyMonster 的模板连接媒体、价格、内部说明与下一条提示；CreatorHero 提供文件夹、变量和跨创作者复用。',
'cards':{
'infloww':('Scripts 可按标签检索、组成序列，条件脚本最多给 3 个选择，跨创作者共享并看转化数据。','流程可标准化，但需要人工选择条件分支，避免机械套用。',['https://help.infloww.com/en/articles/262042-getting-started-with-scripts']),
'supercreator':('Message Library 与输入区快捷检索结合，支持文本、媒体、价格及补全式查找。','更贴近日常输入操作；需分清模板复用与 AI 自动生成的职责。',['https://help.supercreator.app/en/articles/6317851-message-copilot']),
'onlymonster':('Message Templates V2 保存文本/媒体/价格，支持动态名字、内部提示和下一模板建议。','更像可执行销售脚本；旧版模板文档已被新版替代。',['https://docs.onlymonster.ai/members-features/message-templates']),
'creatorhero':('Scripts 支持文件夹、粉丝名字变量、媒体和跨创作者复制/导入导出。','库管理清楚；复杂条件自动分支不是当前文档重点。',['https://help.creatorhero.com/en/articles/10514438-scripts'])}
},
{
'id':'ai','n':'07','title':'AI & Smart Engine','cn':'AI 与智能引擎','question':'AI 到底是给建议、代做流程，还是直接与粉丝交流？',
'diff':'四家都不止一种 AI 用法：Infloww 侧重人工确认的回复建议；Supercreator 的 Izzy 可自动聊天和销售；OnlyMonster 同时提供辅助写作与 Mimic 接管；CreatorHero 有会话摘要、翻译和机构后台 Hero Copilot，后者不代发粉丝消息。',
'cards':{
'infloww':('AI Copilot 分类型生成 3 条上下文回复，Chatter 可选择、编辑、再发送；按生成提示消耗额度。','官方注明仍为 beta；它是辅助写作，不是自动代聊。',['https://help.infloww.com/en/articles/262036-using-ai-copilot-in-messages-pro','https://help.infloww.com/en/articles/262040-getting-started-with-ai-copilot']),
'supercreator':('Izzy AI 可在配置范围内自动回复并销售；Inbox、Fans、Pricing、Message 和 Vault Copilot 分别辅助判断。','自动化深度高，但套餐和 AI 消息额度影响可用范围。',['https://help.supercreator.app/en/articles/11385335-izzy-ai','https://help.supercreator.app/en/articles/11993412-ai-pricing']),
'onlymonster':('Mimic AI 可接管会话，显示阶段、剩余时间和人工交接；AI Assistant 另提供可配置的辅助写作。','Mimic 更偏前段对话并在付款或异常等节点交回人工；自动接管与辅助写作不能混为一类。',['https://docs.onlymonster.ai/mimic-ai/mimic-ai-in-chats','https://docs.onlymonster.ai/ai-magic-assistant/ai-settings-button-configurations-guide']),
'creatorhero':('聊天界面有 AI 会话摘要和翻译；Hero Copilot 可查询机构数据、起草脚本并执行经审批的后台动作。','Hero Copilot 为 Owner/Admin 逐步开放、按用量收费；官方明确它不会向粉丝发送聊天、PPV 或群发。',['https://help.creatorhero.com/en/articles/10523101-chat-summary-feature','https://help.creatorhero.com/en/articles/10500007-ai-translator','https://help.creatorhero.com/en/articles/17059054-hero-copilot'])}
},
{
'id':'team','n':'08','title':'Team & Operations','cn':'团队与运营','question':'多 Chatter、多创作者时，如何避免冲突、审查质量并归因业绩？',
'diff':'Infloww 和 Supercreator 都提供较细的团队绩效与逐条消息审查，但工时与归因口径不同；OnlyMonster 强调组收件箱、班次权限和消息输入方式追踪；CreatorHero 以 Chatter 绩效和可重新指派的销售归因为重点。',
'cards':{
'infloww':('Employee Reports 按员工、创作者和时间比较聊天/营收表现；Message Dashboard 支持逐条质检。','Split Inbox 能分组，但官方说明不能在 Messages Pro 内直接把组绑定某员工。',['https://help.infloww.com/en/articles/262078-employee-reports','https://help.infloww.com/en/articles/262029-split-inbox']),
'supercreator':('Split Inbox 最多 3 个颜色组；Chatter Analytics 含销售、消息、估算工时、盈利与逐条消息日志。','改变组数会重新分组；Analytics 限 CRM Premium 与 Super AI，估算工时按消息活跃区间计算。',['https://help.supercreator.app/en/articles/7953655-split-inbox-assign-fans-to-chatters','https://help.supercreator.app/en/articles/8118589-chatter-analytics']),
'onlymonster':('高级 Inboxes 最多 6 组；Message Tracker 记录发信员工、时间和输入方式；另有按班次限制账号访问。','Message Tracker 的消息仅保留 3 个月；分组与员工责任绑定需分开理解。',['https://docs.onlymonster.ai/members-features/inboxes-advanced-group-chat-splitting','https://docs.onlymonster.ai/management-system/message-tracker','https://docs.onlymonster.ai/management-system/shift-based-access-control']),
'creatorhero':('Chatter Tracking 看收入、PPV 购买率、回复速度、活跃时间；Sales Assignment 关联成交与员工。','运营管理指标完整；其销售重新指派历史，官方文档注明不会记录。',['https://help.creatorhero.com/en/articles/10426384-chatter-tracking','https://help.creatorhero.com/en/articles/10518553-sales-assignment'])}
}
]

summary=[
('聊天重心','多账号/多会话工作效率','AI 排序与聊天辅助','高密度 ChatSpace 操作','聊天与销售状态同屏'),
('粉丝理解','机构消费分层、拒付风险与订阅事实','AI 补全画像与建议','账号/机构消费切换与购买潜力','时区、订阅及 PPV 购买轨迹'),
('销售路径','消息监测与规则触发','逐粉丝价格 + 自动售卖','触发营销 + 购买指标','PPV 状态跟进 + 归因'),
('AI 角色','人工发送前的建议','可自动聊天的代理','辅助写作 + 前段 AI 接管','聊天摘要/翻译 + 后台 Copilot'),
('团队控制','员工报表与消息质检','分组、绩效与逐条审查','组收件箱、班次、逐条追踪','Chatter 绩效与销售分配')]

css='''
:root{--ink:#182130;--muted:#667083;--line:#dfe4eb;--bg:#f4f6fa;--card:#fff;--accent:#4855b8;--soft:#eef0ff;--green:#167350}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Microsoft YaHei",sans-serif}a{color:#3e4fa7;text-decoration:none}a:hover{text-decoration:underline}.shell{max-width:1680px;margin:auto;padding:34px 38px 80px}.hero{background:linear-gradient(118deg,#182342,#334a78 65%,#425fb2);color:white;border-radius:24px;padding:40px 48px;box-shadow:0 20px 45px #202b5b1a}.eyebrow{font-size:12px;letter-spacing:.15em;font-weight:800;opacity:.7}.hero h1{font-size:36px;line-height:1.2;margin:12px 0 14px}.hero p{max-width:980px;font-size:17px;color:#e5eaff;margin:0}.meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:25px}.meta span{border:1px solid #ffffff54;border-radius:100px;padding:5px 12px;color:#eef1ff;font-size:12px}.nav{position:sticky;top:0;z-index:5;display:flex;gap:8px;overflow:auto;padding:12px 0;background:#f4f6faf2;backdrop-filter:blur(12px)}.nav a{white-space:nowrap;border:1px solid var(--line);background:white;border-radius:100px;padding:7px 12px;font-size:12px;color:#34415d}.nav a:hover{background:var(--soft)}section{scroll-margin-top:85px}.panel{background:white;border:1px solid var(--line);border-radius:20px;padding:26px 30px;margin:22px 0;box-shadow:0 4px 18px #1b274308}.panel h2{font-size:23px;line-height:1.35;margin:0 0 12px}.panel p{margin:8px 0;color:#475266}.note{border-left:3px solid #8b94d9;padding:2px 13px;color:#53607b}.table-wrap{overflow:auto}.summary{border-collapse:collapse;width:100%;min-width:950px;font-size:13px}.summary th,.summary td{text-align:left;vertical-align:top;border-bottom:1px solid var(--line);padding:10px 12px}.summary th{background:#f3f5fb;color:#2c3a5a}.module{margin-top:30px}.module-head{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px}.num{font-size:16px;font-weight:800;color:#5363ba;background:#e6eaff;border-radius:12px;padding:8px 12px}.module h2{font-size:27px;margin:0;line-height:1.2}.module h2 small{font-size:16px;color:#64708b;font-weight:500;margin-left:9px}.question{color:#5b6678;margin-top:7px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.card{background:var(--card);border:1px solid var(--line);border-radius:17px;overflow:hidden;min-width:0;box-shadow:0 3px 13px #15223c09;display:flex;flex-direction:column}.card-top{padding:16px 17px 11px}.card h3{margin:0;font-size:17px}.badge{display:inline-block;margin-top:7px;color:#526078;background:#f2f4f8;border-radius:6px;padding:2px 7px;font-size:11px}.shot{height:210px;background:#e8ebf1;border:0;padding:0;cursor:zoom-in;display:flex;align-items:center;justify-content:center;overflow:hidden;width:100%;border-top:1px solid #e6e8ef;border-bottom:1px solid #e6e8ef}.shot img{width:100%;height:100%;object-fit:contain}.shot:hover img{transform:scale(1.02)}.card-body{padding:14px 17px 16px;display:flex;flex-direction:column;flex:1}.card-body .label{font-size:11px;font-weight:800;color:#5868bd;letter-spacing:.04em}.card-body p{margin:2px 0 13px}.card-body .judgment{background:#f5f6fa;border-radius:9px;padding:9px 10px;color:#475267;font-size:13px}.sources{margin-top:auto;padding-top:10px;border-top:1px solid #edf0f4;font-size:12px;line-height:1.5}.sources a{display:inline-block;margin-right:7px}.takeaway{margin-top:13px;background:#e9edf9;border:1px solid #d7def5;border-radius:12px;padding:13px 16px;color:#2e3d68}.takeaway b{color:#2b3d86}.end-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.end-grid article{background:#f6f8fc;border:1px solid var(--line);border-radius:12px;padding:16px}.end-grid h3{margin:0 0 7px;font-size:15px}.end-grid p{margin:0;font-size:13px}.footer{font-size:12px;color:#687286;margin-top:25px}.lightbox{position:fixed;inset:0;z-index:20;background:#0b101dea;display:none;align-items:center;justify-content:center;padding:50px}.lightbox.open{display:flex}.lightbox img{max-width:96vw;max-height:91vh;object-fit:contain;box-shadow:0 12px 45px #0008}.close{position:absolute;right:20px;top:14px;border:0;color:white;background:#ffffff30;border-radius:8px;font-size:24px;padding:3px 12px;cursor:pointer}.lightbox-caption{position:absolute;bottom:8px;color:white;font-size:13px;text-align:center}
@media(max-width:1300px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.shot{height:270px}}@media(max-width:700px){.shell{padding:12px}.hero{padding:27px}.hero h1{font-size:29px}.grid,.end-grid{grid-template-columns:1fr}.panel{padding:20px}.shot{height:250px}.module h2{font-size:23px}}@media print{body{background:#fff;font-size:11px}.hero{color:#182130;background:#eef1f8}.hero p{color:#34415d}.meta span{color:#34415d;border-color:#bac3d8}.summary{min-width:0;table-layout:fixed;font-size:9px}.summary th,.summary td{padding:5px 6px;overflow-wrap:anywhere}#implications{break-before:page}.shell{padding:0;max-width:none}.hero{box-shadow:none;border-radius:0;padding:24px}.nav,.lightbox{display:none!important}.panel{box-shadow:none;margin:12px 0;padding:16px}.grid{grid-template-columns:repeat(2,1fr);gap:9px}.card{break-inside:avoid;box-shadow:none}.card-top{padding:8px 10px}.card-body{padding:8px 10px}.shot{height:150px}.module{break-before:page}.module-head{margin-bottom:8px}.takeaway{padding:8px}.sources{font-size:9px}.end-grid{grid-template-columns:repeat(3,1fr)}}
'''

h=[]
h.append('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>四平台八模块功能对比报告</title><style>'+css+'</style></head><body><div class="shell">')
h.append('<header class="hero"><div class="eyebrow">PRODUCT RESEARCH · FOUR PLATFORMS / EIGHT CAPABILITIES</div><h1>四平台八模块功能对比报告</h1><p>逐项比较 Infloww、Supercreator、OnlyMonster 与 CreatorHero 的实际能力、产品侧重点和边界。每个平台在八个能力领域各有一张对应截图，并附可核查的官方资料。</p><div class="meta"><span>研究日期：2026 年 10 月 10 日</span><span>32 张对应截图</span><span>来源：用户界面截图 + 官方帮助中心/教程</span><span>研究范围：以 OnlyFans 相关功能为主</span></div></header>')
h.append('<nav class="nav"><a href="#overview">总览</a>'+''.join(f'<a href="#{m["id"]}">{m["n"]} {m["cn"]}</a>' for m in modules)+'<a href="#implications">产品启示</a><a href="#method">研究口径</a></nav>')
h.append('<section class="panel" id="overview"><h2>先看结论</h2><p>四家并非都把八个领域做成同等深度的独立模块。它们共同覆盖聊天、粉丝、销售与运营流程，但产品中心不同：Infloww 偏成熟的多账号人工工作台；Supercreator 把 AI 判断和自动销售嵌入流程；OnlyMonster 偏机构级控制与跨账号数据；CreatorHero 偏 PPV 追踪、销售归因和 Chatter 绩效。</p><div class="table-wrap"><table class="summary"><thead><tr><th>对比轴</th>'+''.join(f'<th>{n}</th>' for _,n in platforms)+'</tr></thead><tbody>')
for row in summary:h.append('<tr>'+''.join(f'<td>{html.escape(x)}</td>' for x in row)+'</tr>')
h.append('</tbody></table></div><p class="note">“有功能”不能直接等于“在聊天界面可用”“所有套餐可用”或“AI 可自主执行”。下文把功能能力、可见界面和官方限制分开陈述。</p></section>')
for m in modules:
 h.append(f'<section class="module" id="{m["id"]}"><div class="module-head"><div class="num">{m["n"]}</div><div><h2>{m["title"]}<small>{m["cn"]}</small></h2><div class="question">{m["question"]}</div></div></div><div class="grid">')
 for slug,name in platforms:
  cap,judg,urls=m['cards'][slug]; p=provenance[f'{slug}_{m["id"]}'];img=p['path'];badge=labels[p['type']]
  links=' '.join(f'<a href="{html.escape(u,quote=True)}" target="_blank" rel="noopener">官方资料 {i+1} ↗</a>' for i,u in enumerate(urls))
  h.append(f'<article class="card"><div class="card-top"><h3>{name}</h3><span class="badge">{badge}</span></div><button class="shot" type="button" data-img="{img}" data-caption="{name} · {m["cn"]} · {badge}" aria-label="放大查看 {name} {m["cn"]} 截图"><img src="{img}" alt="{name} {m["cn"]} 对应截图" loading="lazy"></button><div class="card-body"><div class="label">主要能力</div><p>{html.escape(cap)}</p><div class="judgment"><strong>差异与边界：</strong>{html.escape(judg)}</div><div class="sources">{links}</div></div></article>')
 h.append(f'</div><div class="takeaway"><b>关键差异：</b>{html.escape(m["diff"])}</div></section>')
h.append('<section class="panel" id="implications"><h2>对三栏 Messages Pro Demo 的直接启示</h2><div class="end-grid"><article><h3>左侧：会话列表</h3><p>把“需要谁先处理”做成可解释的行动排序：回复时限、购买意向、活跃度和负责人冲突是具体信号；动态名单要显示更新时间，避免把六小时数据当实时状态。</p></article><article><h3>中间：聊天与执行</h3><p>区分 AI 建议、AI 草稿、自动触发和 AI 接管四个状态。回复、脚本、素材和 PPV 价格围绕同一段对话组织；任何自动发送都应有清晰的接管和审计记录。</p></article><article><h3>右侧：粉丝决策区</h3><p>首屏优先显示本次决策需要的消费、订阅、偏好、PPV 历史与风险；更深的资料和团队记录按需展开，并让每个建议能追溯其依据。</p></article></div></section>')
h.append('<section class="panel"><h2>建议演示的三个端到端场景</h2><div class="table-wrap"><table class="summary"><thead><tr><th>场景</th><th>左侧发现</th><th>中间执行</th><th>右侧核查</th><th>验证重点</th></tr></thead><tbody><tr><td>高并发接待</td><td>按可解释的待处理原因排序</td><td>查看上下文，生成草稿并人工发送</td><td>核对订阅、偏好和最近活动</td><td>队列刷新时效与负责人冲突</td></tr><tr><td>PPV 销售</td><td>识别有购买意向的粉丝</td><td>选话术、查素材重复、给价格并发送</td><td>看历史购买和未购状态</td><td>价格依据、重复素材、成交归因</td></tr><tr><td>AI 接管</td><td>显示 AI 正在处理和人工待接管</td><td>记录自动动作、暂停与人工恢复</td><td>展示策略依据与限制条件</td><td>控制权、审批、审计和异常回退</td></tr></tbody></table></div></section>')
h.append('<section class="panel" id="method"><h2>研究口径与截图说明</h2><p>功能事实以四个平台截至研究日可访问的官方帮助中心和产品文档为准；截图来自用户提供的实界面、官方文档内图片、官方教程视频或交互教程画面。截图为某一版本、套餐或账号状态下的样本，不代表所有用户界面一致。未登录四家付费工作区，因此不评价实际 AI 准确率、系统稳定性、销售提升幅度及功能在具体账号上的可用性。</p><p>图上的数字、粉丝资料与视频演示样本只作界面识别，不作为行业基准。点击任一截图可放大查看；每张图所在卡片下方均可进入对应官方资料核查。逐条证据、套餐限制与纠错说明见<a href="verification.md">事实核查记录 ↗</a>。</p></section>')
h.append('<div class="footer">研究整理：Messages Pro 竞品分析 · 2026-10-10。截图版权归各平台或原截图提供方，研究用途。</div></div><div class="lightbox" id="lightbox" role="dialog" aria-modal="true"><button class="close" type="button" aria-label="关闭">×</button><img alt="放大截图"><div class="lightbox-caption"></div></div><script>const box=document.getElementById("lightbox");document.querySelectorAll(".shot").forEach(b=>b.addEventListener("click",()=>{box.querySelector("img").src=b.dataset.img;box.querySelector(".lightbox-caption").textContent=b.dataset.caption;box.classList.add("open")}));box.addEventListener("click",e=>{if(e.target===box||e.target.classList.contains("close"))box.classList.remove("open")});document.addEventListener("keydown",e=>{if(e.key==="Escape")box.classList.remove("open")});</script></body></html>')
(ROOT/'index.html').write_text(''.join(h),encoding='utf-8')
print(ROOT/'index.html')
print('cards',sum(len(m['cards']) for m in modules))
