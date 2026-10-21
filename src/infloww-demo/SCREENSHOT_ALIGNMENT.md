# Messages Pro screenshot alignment — 2026-10-16

Evidence: the user supplied full-workspace reference `codex-clipboard-0867b308-4f27-4418-ab14-f166222fbf0a.png` (1720 × 1409). Earlier supplied popup screenshots remain the reference for their respective overlays. Mock records, localization controls and demo utilities intentionally differ. This is a source-level comparison and implementation pass; it has not been visually verified in a browser.

## Differences addressed in this pass

| Area | Previous difference | Change |
| --- | --- | --- |
| Three columns | Left 27.45%, right 19.25% made the conversation too narrow. | Left 23.25%, right 16.3%, with bounds for smaller/larger windows. At the reference width this is approximately 400 / 1040 / 280 px. |
| Window strip | Standalone logo occupied the window-control position. | Decorative window dots, followed by creator tabs. The dots do not pretend to close the browser. |
| Creator tab | One counter sat on the name line. | Name above separate unread-chat and notification counters beside the avatar; close remains separate. Mock counts come from local state. |
| Workspace height | Demo footer consumed another 20 px. | Utility actions live in Demo controls; the main conversation extends to the bottom. |
| Panel headers | Generic styling had enlarged them to 60 px. | Inbox and chat return to the reference's approximately 53 px header. Narrow chat columns can wrap tools. |
| Conversation date | Floating pill. | Date between two horizontal dividers. |
| Consecutive messages | Grouped any consecutive messages with the same direction. | Grouping also respects calendar date, sender and withdrawals. |
| Message footer | Sender omitted; payment status inside the bubble. | Time, delivery/read checks, outbound sender, and paid/not-paid amount below the bubble. |
| Scroll control | No way to return to the latest message. | Lower-right arrow appears away from the bottom. Clicking returns to latest; reading history does not auto-jump on a new message. Resize/media loading follows the bottom only if the reader was already there. |
| Media previews | Every attachment was an 84 px compact thumbnail. | Larger single-media preview, two-column albums, remaining-media count, video play/duration and per-item viewer entry. Audio uses its own controls, outside the preview button. |
| Incoming PPV | Same unrestricted preview path as outgoing PPV. | Locked media/text are excluded from the normal viewer; free previews remain available. The unlock CTA points to the checkout destination via Toast under the requested secondary-page scope. Outgoing creator previews remain available without recording a purchase. |
| AI/Seli | One AI-assistant entry served both positions. | Separate teal Seli and AI entries. AI retains the response-type inline panel supplied earlier. Seli reuses local deterministic suggestions; see limitation below. |
| Favorite emojis | Toolbar only showed the first ten favorites. | All configured favorites are available in the horizontal hotbar. |
| Right rail | Enlarged card headers/rows reduced visible content. | Compact 14 px titles, 12 px labels, natural-height cards, tighter profile controls and fixed bottom tabs. Insights uses the eye icon shown in the screenshot. |
| Fan row metadata | Generic robot icon and timestamp formatting. | Gray circular AI marker, small inbox label, compact amounts, localized time/date formatting. Priority unread rows use the reference's coral time/dot treatment; the priority-to-coral mapping is a demo interpretation, not source-verified. |
| Fan More | 260 px menu with shorter rows. | 240 px anchored menu and 46 px action rows, using the earlier supplied More screenshot. |

## Evidence and limits

- The supplied screenshot establishes placement, dividers, media presentation, footer sender, AI/Seli entries and bottom-right scroll arrow.
- `/Users/j/codes/infloww/message-pro2/src/features/message/ui/components/MessageFooter/index.tsx` corroborates an outbound employee name and delivery/read indicators. This newer multi-platform implementation does not establish exact geometry of native OnlyFans overlays.
- `/Users/j/codes/infloww/message-pro2/src/features/message/ui/message-list.tsx` corroborates separate message-jump/auto-scroll behavior. The exact old native OF scroll threshold is not available; 90 px is the demo threshold.
- **Seli overlay:** no matching production body was found in the inspected local preload/features directories, and no Seli popup screenshot has been supplied. Only its entry position is confirmed. The suggestions popover is an existing mock capability made accessible independently; its layout and generation behavior are not claimed as official parity.
- **Checkout:** no real purchase or revenue mutation occurs. Native payment/checkout geometry is outside the supplied evidence and the requested secondary-page reproduction scope.
- **Remaining unverified overlays:** the original `POPUP_PARITY.md` evidence limits still apply to gallery, rename, pinned-message list and block/restrict/report confirmations where a complete official body has not been supplied. Matching earlier screenshots does not establish all states of those flows.

## Verification

- TypeScript project check passed.
- 63 state/presentation tests passed, including date/sender grouping and incoming PPV access without purchase mutation.
- Both the isolated Infloww entry build and the full-project production build passed. Concurrent work on the separate research entry was preserved.
