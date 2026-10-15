# Message Pro demo interaction coverage

Inventory inspected on 2026-10-15 for `/messages-pro/infloww/`. This covers the controls modeled in this demo's first-level workspace and its overlays. It is not a claim that every control in the current production Infloww product has been discovered or reproduced. All records and transactions are local mock state; the original page is separate.

## Header and workspace

| Control | Implemented outcome |
| --- | --- |
| Creator tabs and Add creator | Select an existing creator, close a tab, reopen from the picker, drag to reorder or use Alt + Left/Right. Per-creator workspace and per-fan drafts are retained. |
| Home and fan conversation tabs | Select, close and reorder the modeled tabs. Notification chat actions reuse a dedicated tab and retain the Home conversation. |
| SFW | Persisted switch; Ctrl/Cmd + Shift + S shortcut. |
| Language | English by default, English/Chinese configuration switch; the menu dismisses outside or with Escape. User-entered message content is retained. |
| Fullscreen and narrow layouts | Browser fullscreen toggle, mobile column navigation and a closable insights drawer. |
| Agency bell / withdrawal alert | Bell shows the page-navigation Toast. Eligible local withdrawals create an admin alert and unread badge; alert View details opens the withdrawal snapshot dialog, nested media viewer and Go to chat action. |
| Demo controls | Role/failure simulation, incoming events, time advance, pending task cancellation, feature list, and confirmed reset. These controls exist to exercise mock behavior. |
| Brand and Original page | Navigation Toast; ordinary clicks retain the current workspace. |

## Inbox

| Control | Implemented outcome |
| --- | --- |
| Search, view/list tabs, inbox selector | Search local fans/messages; filter All, Pinned, With tips, applicable priority/unread views, pinned lists and selected split inboxes. |
| Sort/filter menu and Refresh | Newest/oldest, eligible priority/unread filters, focus mode, available AI assignment filters, mark visible read, selection mode; refresh releases held focus updates. |
| Conversation row and signals | Select conversation, retained draft preview, unread/mute/timer states, signal descriptions on hover/focus. |
| Row context menu | List membership, read/unread, move inbox where enabled, hide, confirmed clear; Open in new tab shows a Toast. |
| Single/bulk clear | Local selection, select all/deselect, confirmation before clearing conversation data. |
| Online fans | Live eligible results; subscription status/duration, spend/tip minimums, list/creator/recent-contact exclusions, muted inclusion, reset and open conversation. Message all carries the filter into the campaign editor. |
| Fan notifications | Subscription/tip/purchase/platform tabs, read state, explicit fan-scoped quick reply and dedicated conversation tab. Unavailable replies are disabled. |
| Split inbox settings | Enable/disable and 2–9 inbox count, staged until confirmed redistribution; moving a fan uses a separate dialog. |
| Pinned lists and fan lists | Pin/unpin list tabs; shared searchable membership picker, immediate checkbox updates, refresh and nested New list with duplicate-name checks. |
| Campaign composer | Smart/mass/automatic mock messages, recipients/search/select all, text, price/free previews, staged Vault and creator/release tags, schedule, Save draft and Send. Invalid/empty recipients and unavailable fans are guarded. |
| Campaign result overlay | Local summary/detail rows, delivery/view/purchase states, retry, copy draft, cancel pending campaigns and confirmed eligible withdrawal. The statistics menu's full report-page entries show a Toast. |

## Chat and composer

| Control | Implemented outcome |
| --- | --- |
| Header utilities | Rename, shared lists, mute, fan notes, pinned-message overlay, filtered conversation gallery, message search with previous/next match and refresh. Fan name/profile and new-window entries show a Toast. |
| Fan More menu | Copy profile URL, rename, lists, mock discount, hide, mute, restrict/unrestrict, block/unblock and report; relevant changes use a dialog or confirmation. |
| Message actions | Like/unlike, reply and jump to quoted message, pin/unpin, copy text with clipboard fallback, copy draft, save script, forward draft, sent-message creator/release tags and sample translation. |
| Paid/failed messages | Local viewed/purchased simulations and failed-delivery retry; eligible sent/read unpurchased outbound messages can be withdrawn within 60 minutes. Withdrawal keeps an original-message/media snapshot. |
| Media surfaces | Message, draft, script-preview, forward and gallery thumbnails open the shared indexed viewer. Previous/next controls, arrow keys and closing are available. |
| Emoji picker/settings | Search/categories; choosing retains the picker. Settings stage favorite add/remove/reorder up to 40 until Save; Cancel discards. |
| Scripts / slash search | Category/search list, one-second hover detail with media carousel/status/sender information, editable message preview and nested media/tags. Cancel preserves the main draft; Send uses the preview. More scripts shows a Toast. |
| Vault / GIF | Categories, type/search/send-state filters, select all, staged selection, nested indexed viewer, sending/purchase/withdrawal history and editable local notes/tags. Add commits selected Vault media; Close discards selection. GIF uses the modeled single-GIF restrictions. |
| Co-creators / Release forms | Staged Tag user and Release form tabs, search/filter/sort, clear and Add. Unavailable mock forms cannot be selected/sent; the draft, preview and sent-message targets remain separate. |
| Upload and draft editing | Local file picker/drop for supported image/video/audio, attachment removal/free-preview state, text formatting/color, quote removal, clear draft, Enter to send and Shift + Enter newline. |
| Price and scheduling | $0 or valid paid price, history chart, paid-text/free-media controls; calendar/hour/minute schedule with past-time checks and removal. |
| Timed message/reminder | Two-mode menu; 1–60 minute duration, 12 local reminder sounds, independent timed-message draft, countdown/cancel and once-only due execution. |
| Seli and translation | Local sample generation, review/edit and applying results to the draft. No external AI or translation service is called. |

## Insights

| Control | Implemented outcome |
| --- | --- |
| Card headers and drag handles | Collapse/expand, drag reorder, Alt + Up/Down reorder and persisted section order. |
| Spending / organization / subscription | Local totals, last/highest spend, PPV/tip averages, metric tooltip and varied fixture states; active, expired or expiring dates, cost, duration and renewal. These are displays rather than editable scoring controls. |
| Profile | Required-default nickname dialog; immediate birthday/location/source/currency/cycle/pay-date pickers and local salary save on blur. Pickers reset on creator/fan changes. |
| Lists / Notes card | Shared list picker and immediate membership; debounced fan-note save; staged creator-specific note template with Cancel/Save. |
| Sales | Purchase rate, min/max prices, 75 px per-media previews, hover type counts/text, more-than-six expansion/collapse and Copy as draft without sending. |
| Sales timeline | Modal with price/media points, hover/focus details and horizontal dragging across the local history. The composer price history reuses the chart with maximum/average summary. |
| Creator Notes | Separate creator-scoped debounced editor; edits do not replace fan notes or note templates. |

## Boundaries and evidence

- **Page navigation is intentionally Toast-only:** brand/original page, full report pages, profile page, new tab/window, More scripts and agency notification center. Local tab selection, result overlays and alert details continue within the workspace. Full management pages and a native independent chat window are outside this pass.
- **Mock-only:** no product API, real account authentication, payment, platform delivery, cross-user notification service, release-form signing/validation, AI generation or live translation. State persists in this browser; user uploads use local browser storage. Timers are evaluated while running or when state is restored, not by a server while the app is closed. A subscription month is approximated as 30 days; metric/risk values are fixtures rather than inferred production scores.
- **Evidence:** `POPUP_PARITY.md` records supplied screenshots, the desktop injection source, the separately identified `message-pro2` source and official guide references. Verified behaviors include staged Scripts/Vault/tags, the 40-emoji limit, countdown constraints, nickname requirements, profile pickers, Sales media behavior and withdrawal snapshots. The desktop nickname editor is 480 px without a top close button; native Sales tiles are 75 px with a 164 px collapsed region.
- **Exact visuals remain unverified** for native OF rename/notes/gallery/pinned-message, discount/block/restrict/report, scheduling/translation/forwarding overlays; the online-filter geometry, newer timed-message editor, note-template geometry and Seli overlay also lack complete matching captures. Working local interactions and passing checks do not establish pixel parity or exhaustive production coverage.

Implementation entry points: `main.tsx`, `InboxPanel.tsx`, `ChatPanel.tsx`, `InsightsPanel.tsx`, the shared dialogs, `engine.ts`, `mediaActivity.ts` and the bilingual text catalogs. Browser and reducer checks are recorded separately; this inventory is a source inspection, not an additional browser test result.
