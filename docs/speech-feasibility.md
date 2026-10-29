# Hebrew (he-IL) speech recognition - feasibility findings

Date: 2026-10-28 Phase: 0 Risk: R5 ADR: 0009

## Sources checked

- MDN `SpeechRecognition` reference page (fetched 2026-10-28).
- `@mdn/browser-compat-data` 8.1.7 (published 2026-10-22), `api.SpeechRecognition` entries.
- WebKit bug 225298 and Apple Developer Forums threads on Safari / iOS speech recognition (community reports, not Apple documentation).

## API support (verified from compat data)

| Browser          | `SpeechRecognition`                                      | On-device API (`processLocally`, `available()`, `install()`) |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| Chrome desktop   | Unprefixed since 139; `webkitSpeechRecognition` since 33 | Yes, since 139                                               |
| Chrome Android   | Unprefixed since 139; prefixed since 33                  | No                                                           |
| Edge desktop     | Unprefixed since 139; prefixed since 79                  | Yes, since 139                                               |
| Safari macOS     | Prefixed (`webkitSpeechRecognition`) since 14.1          | No                                                           |
| Safari iOS       | Prefixed since 14.5                                      | No                                                           |
| Samsung Internet | Unprefixed since 30; prefixed since 2.0                  | No                                                           |
| Firefox          | Preview only (not shipped)                               | Preview only                                                 |

Compat-data note for Chromium: recognition only works when served from a web server (not `file://`). It also needs a secure context (HTTPS or localhost) for mic access.

## Cloud processing

- Chrome (desktop and Android): MDN states that on some browsers, such as Chrome, recognition uses a server-based engine - audio is sent to a web service and recognition does not work offline. On desktop Chrome / Edge 139+, `processLocally = true` can request on-device recognition if the language pack is installed; Hebrew language-pack availability is **not verified**.
- Chrome Android: no on-device API -> treat as cloud-processed, needs network.
- Safari iOS / macOS: uses Apple's speech service; community reports say it needs network and that Siri or Dictation must be enabled in system settings (otherwise the error "Siri and Dictation are disabled" / service not available). Whether Apple processes Hebrew on-device or on servers is **not verified**.

## Hebrew support

- `lang` is supported on every engine listed above. No public, authoritative per-language list exists for the Web Speech API in Chrome or Safari, so Hebrew (`he-IL`) recognition quality and availability **could not be verified from documentation** and needs a device check.
- Known: Hebrew is a supported dictation language in Google's speech services and in Apple Dictation on iOS (general product knowledge, not verified against the Web Speech API specifically).

## Conclusions

1. The API exists on all target mobile browsers (Chrome Android, Safari iOS) and desktop Chrome. Firefox has no support -> fallback path.
2. Assume cloud processing and network dependence on all mobile targets -> privacy notice + offline fallback to typing (ADR 0009).
3. Feature detection alone is not enough on iOS (constructor may exist but fail); handle `error` events.

## Manual device check for the owner

Use a test page that the Phase 5 build will provide, or a public demo page in the meantime. For each device, record: works yes/no, error shown, accuracy on the phrases below, works offline yes/no.

| Device / browser                    | Steps                                                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android phone, Chrome (latest)      | 1. Open the page over HTTPS. 2. Allow microphone. 3. Set language he-IL. 4. Say the phrases. 5. Turn on airplane mode and try again.                                                     |
| iPhone, Safari (latest iOS)         | 1. Settings -> Siri / Dictation: note whether enabled; Dictation languages include Hebrew. 2. Repeat steps 1-5 above. 3. If it fails, enable Dictation and retry; record the difference. |
| iPhone, installed PWA (home screen) | Repeat after Phase 7 (installable PWA).                                                                                                                                                  |
| Desktop Chrome                      | Repeat steps 1-5.                                                                                                                                                                        |

Test phrases: "שני ליטר חלב", "לחם אחד", "שלוש עגבניות ומלפפון", "קילו וחצי עוף", "שמפו הד אנד שולדרס".

Status: pending owner device check. Results go into this file in Phase 5.
