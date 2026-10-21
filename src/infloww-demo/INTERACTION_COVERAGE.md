# Message Pro demo interaction coverage

Inventory inspected on 2026-10-16 for `/messages-pro/infloww/`. This covers the controls modeled in this demo's first-level workspace and its overlays. It is not a claim that every control in the current production Infloww product has been discovered or reproduced. All records and transactions are local mock state; the original page is separate.

## Header and workspace

| Control | Implemented outcome |
| --- | --- |
| Creator tabs and Add creator | Select an existing creator, close a tab, reopen from the picker, drag to reorder or use Alt + Left/Right. Per-creator workspace and per-fan drafts are retained. |
| Home and fan conversation tabs | Select, close and reorder the modeled tabs. Notification chat actions reuse a dedicated tab and retain the Home conversation. |
| SFW | Persisted switch; Ctrl/Cmd + Shift + S shortcut; visible media is blurred and each item has a Media View toggle that resets when SFW is re-enabled. |
| Idle mode | Ten minutes without mouse movement or keyboard input shows a blocking idle view. Return restores the workspace and checks scheduled work; notifications continue to update. |
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
| Online fans | Live eligible results; subscription status/duration, spend/tip minimums, list/creator/recent-contact exclusions, muted inclusion, reset and open conversation. Expired fans who are not followed by the creator have a Subscribe action. Message all carries the filter into the campaign editor. |
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
| Paid/failed messages | Local viewed/purchased simulations and failed-delivery retry; eligible sent/read unpurchased outbound messages can be withdrawn within 60 minutes. Withdrawal keeps an original-message/media snapshot. An expired fan who is not followed by the creator shows a Subscribe notice and cannot receive a new message until Subscribe is used. |
| Media surfaces | Message, draft, script-preview, forward and gallery thumbnails open the shared indexed viewer. Previous/next controls, arrow keys and closing are available. |
| Emoji picker/settings | Search/categories; choosing retains the picker. Settings stage favorite add/remove/reorder up to 40 until Save; Cancel discards. |
| Scripts / slash search | Category/search list, one-second hover detail with media carousel/status/sender information, editable message preview and nested media/tags. Cancel preserves the main draft; Send uses the preview. More scripts shows a Toast. |
| Vault / GIF | Categories, type/search/send-state filters, scoped note/hashtag/PPV-caption search, duration and viewed/unlocked filter, select all, staged selection, nested indexed viewer, sending/purchase/withdrawal history, eligible PPV unsend confirmation, and staged editing of category/co-creators/hashtags/notes/suggested price. Add commits selected Vault media; Close discards selection. Add GIF opens an inline search and horizontal animated strip above the composer; Escape/Close dismiss it, arrows browse results, and selecting a GIF fills the draft without sending. Existing GIF attachments can be replaced; incompatible paid/mixed media drafts remain blocked. Vault uses the supplied sidebar/search/type-tab/four-column card layout, date and duration badges, notes/tag overlays and scoped aggregate metrics. Seed media includes images, GIFs and two playable synthetic audio fixtures with waveforms; video filter behavior uses uploaded mock video. Selection controls appear on hover/focus, and the Add bar appears only after choosing media. |
| Co-creators / Release forms | Tag user and Release form pill tabs, searchable/sortable card list, circular multi-selection and Verified status. Close commits the selection to its invoking draft, timed editor or sent message. Unavailable mock forms cannot be selected/sent; those targets remain separate. |
| Upload and draft editing | Local file picker/drop for supported image/video/audio, attachment removal/free-preview state, text formatting/color, quote removal, clear draft, Enter to send and Shift + Enter newline. |
| Price and scheduling | Screenshot-based 600 px price dialog, Free placeholder, minimum-price hint, purchased-PPV-only history with Max/Avg and illustrated empty state. Save requires a changed free or valid $3–$200 amount with up to two decimals; Cancel preserves the draft. Schedule opens a screenshot-based 520 px dialog with date/time tabs, Sunday-first six-week calendar, month/year navigation and pickers, disabled past dates, Next to time selection, future-time validation and removal of an existing schedule. Cancel leaves the draft unchanged. |
| Timed message/reminder | Clock opens one centered editor with message/reminder tabs. Default 1-minute delay; 1–60 whole minutes, independent message draft, nickname tag insertion, formatting, favorite emoji editor, nested scripts/media/creator pickers, paid-media count, 12 local reminder sounds, countdown/cancel and once-only due execution. Cancel preserves the main draft. |
| Voice emotion and shortcuts | Six supplied emotion rows, per-emotion Option/Alt letter binding with duplicate rejection and local persistence; Escape cancels rebinding. Row click and shortcuts preview the draft with a local system voice using distinct rate/pitch settings. Empty drafts or missing local voices show a Toast. Closing or switching fan stops playback. This does not create an audio attachment or call the production voice service. |
| AI assistant and translation | AI opens an inline response-type panel above the composer, matching the supplied screenshot. Casual, Tip request, Re-engage and Sexting insert editable local mock drafts; help and Close stay inline. Switching fan closes the panel. No external AI or translation service is called. |

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
