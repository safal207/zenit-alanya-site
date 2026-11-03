# Site quality gates

Development requirements: Node.js 24, Python 3 and `npm ci --ignore-scripts`. The deployed site has no npm runtime dependency or build step.

| Level | Automated evidence |
| --- | --- |
| Unit / contracts | 31 tests of shared calendar, translations, chess rules, lessons and media contracts |
| Integration | Real Stockfish UCI reply; 10 Babylon NullEngine / Havok WASM / GLB game scenarios |
| HTTP integration | 10 checks of five routes, WASM MIME, MP4 byte ranges, 404/method handling and traversal containment and negotiated gzip on the test server |
| System / regression | Browser journeys in Chromium, Firefox and WebKit: enquiry validation/copy/fallback, contacts, locales, theme persistence, journal, calendar export/persistence, checklist, media and chess |
| Accessibility | axe WCAG 2 A/AA and 2.1 A/AA rules on five pages in both themes, plus open enquiry and active 3D arena; keyboard/focus scenarios |
| Responsive layout | 320/390/768/1280 CSS-pixel bounds on four pages; enquiry at 320/390/1280 in both themes |
| Rendered 3D | Chromium with software GPU: start, moving clock, pause/resume, shooting; explicit missing-WebGL fallback; in-game contrast and control separation in both themes at 320/390/640/1280 CSS pixels, including header bounds and non-overlapping help |
| Performance | Lighthouse, three-run medians for home/stories/journal in mobile and desktop simulation |
| Security | Pinned workflow actions, bounded authored-source checks, npm dependency advisories, input-injection regression |
| Release integrity | Static references/licences/size budgets and exact SHA-256 manifest; public bundle is verified before testing and deployment |

The browser suite contains 100 scheduled cases. Two clipboard-permission cases are explicitly skipped in Firefox/WebKit because that permission automation is Chromium-specific; denied-copy fallback runs in all engines. A scheduled case is not evidence of passing: inspect its actual run result.

Generated files: after editing stylesheet sources, run `node qa/build-css.cjs`; after changing film data, run `node qa/build-stories.cjs`; after changing the inline theme bootstrap, run `node qa/build-theme-head.cjs`. CI rejects stale generated bundles/feed.

## Commands

```sh
npm ci --ignore-scripts
npm test
npm run test:http
npm run test:security
npm audit --audit-level=high
npx playwright install --with-deps
npm run test:browser
PERF_PROFILE=mobile CHROME_PATH=/path/to/chrome npm run test:performance
PERF_PROFILE=desktop CHROME_PATH=/path/to/chrome npm run test:performance
```

Use the supported computer-use interface for interactive local QA. The Playwright and Lighthouse commands above describe the GitHub runner workflow and a developer's own environment.

## CI and deployment

`.github/workflows/quality.yml` is reusable from the source CI and the public Pages workflow. It runs core checks, three browser jobs and two performance jobs. `All quality gates` requires every job to succeed. Pages publication depends on that result; pull requests test without publishing. Actions are pinned to full commit SHAs and the test jobs have read-only repository permissions. HTML, JSON, JUnit, failure traces and screenshots are retained as run artifacts for 14 days.

Performance gates: median performance >=80 mobile / >=90 desktop; LCP <=4000 ms mobile / <=2500 ms desktop; CLS <=0.1; TBT <=300 ms; accessibility >=95; best practices >=90. Three runs reduce noise. These are lab budgets, not field Core Web Vitals.

The public repository holds `site.zip` as the verified base for large unchanged media/vendor assets, reviewed source overrides under `site/`, the complete final file/hash manifest and this test harness. `qa/unpack-site.py` verifies the archive hash, exact file set, safe paths, each final file (including source overrides) and aggregate artifact digest before assembling a fresh `dist/`. The deployment uploads only `dist/`, never the test harness or dependency tree. A post-deployment smoke then compares public HTML and authored CSS/JS/JSON to that exact manifest and checks media/WOFF2/WASM availability.

The automated source CI tests its checked-out commit directly and does not depend on a stale manual report for another artifact. For the private Sites channel, run `node qa/verify-release.cjs` after updating the bounded manual audit to the exact artifact. The native source helper packages the exact pushed commit. CI reports complement that audit; they do not manufacture manual evidence.

## Limits

- Browser engines run on Linux CI. WebKit is not a physical iPhone/Safari test; viewports are CSS dimensions. Native Android/iOS, assistive-technology review, real touch and GPU/FPS validation remain separate.
- NullEngine physics and Chromium software rendering cover different things. Neither proves physical-device performance.
- HTTP checks validate the fixture server. The post-deployment smoke validates the public GitHub Pages responses separately.
- Automated accessibility checks cannot establish complete WCAG conformance. The static security scan and npm audit are not a penetration test.
- No stress/load test is sent to production. No calls, messages, bookings or external calendar saves are made. Only link destinations and local drafts/exports are exercised.
- Third-party Instagram/Telegram content and delivery to administrators depend on those services; a correct link does not prove account availability or message receipt.

References: [Playwright CI](https://playwright.dev/docs/ci), [accessibility testing](https://playwright.dev/docs/accessibility-testing), [Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md).
