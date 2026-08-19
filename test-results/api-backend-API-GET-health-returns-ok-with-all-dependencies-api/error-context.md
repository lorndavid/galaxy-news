# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> backend API >> GET /health returns ok with all dependencies
- Location: e2e\api.spec.ts:26:7

# Error details

```
TimeoutError: page.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('#email')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "រំលងទៅកាន់មាតិកា" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e5]:
    - generic [ref=e7]:
      - paragraph [ref=e8]: ថ្ងៃពុធ ទី១៩ ខែសីហា ឆ្នាំ២០២៦
      - generic [ref=e10]:
        - group "ភាសា / Language" [ref=e11]:
          - button "ខ្មែរ" [pressed] [ref=e12] [cursor=pointer]
          - button "EN" [ref=e14] [cursor=pointer]
        - list "បណ្តាញសង្គម" [ref=e15]:
          - listitem [ref=e16]:
            - link "Facebook" [ref=e17] [cursor=pointer]:
              - /url: https://www.facebook.com/karpitnews
              - generic [ref=e18]: 
          - listitem [ref=e19]:
            - link "YouTube" [ref=e20] [cursor=pointer]:
              - /url: https://www.youtube.com/@KarpitNews
              - generic [ref=e21]: 
          - listitem:
            - link "TikTok":
              - /url: https://www.tiktok.com/@karpitnews
          - listitem [ref=e22]:
            - link "Instagram" [ref=e23] [cursor=pointer]:
              - /url: https://www.instagram.com/karpitnews
              - generic [ref=e24]: 
          - listitem [ref=e25]:
            - link "Telegram" [ref=e26] [cursor=pointer]:
              - /url: https://t.me/karpitnews
              - generic [ref=e27]: 
    - generic [ref=e29]:
      - link "Navatra 4K TV — ទំព័រដើម" [ref=e30] [cursor=pointer]:
        - /url: /
        - img "Navatra 4K TV" [ref=e31]
      - link [ref=e34] [cursor=pointer]:
        - /url: /
        - img "Navatra 4K TV sidebar promo" [ref=e35]
    - generic [ref=e37]:
      - navigation "ម៉ឺនុយចម្បង" [ref=e38]:
        - list [ref=e39]:
          - listitem [ref=e40]:
            - link "ទំព័រដើម" [ref=e41] [cursor=pointer]:
              - /url: /
          - listitem [ref=e42]:
            - link "ព័ត៌មានជាតិ" [ref=e43] [cursor=pointer]:
              - /url: /category/national-news
          - listitem [ref=e44]:
            - link "នយោបាយ" [ref=e45] [cursor=pointer]:
              - /url: /category/politics
          - listitem [ref=e46]:
            - link "អន្តរជាតិ" [ref=e47] [cursor=pointer]:
              - /url: /category/international
          - listitem [ref=e48]:
            - link "បញ្ជីព័ត៌មាន" [ref=e49] [cursor=pointer]:
              - /url: /news
          - listitem [ref=e50]:
            - link "ប្រភេទ" [ref=e51] [cursor=pointer]:
              - /url: /news
      - button "ស្វែងរកព័ត៌មាន" [ref=e52] [cursor=pointer]:
        - generic [ref=e53]: 
  - marquee "Live news ticker" [ref=e55]:
    - generic [ref=e56]: LIVE NEWS
    - generic [ref=e60]:
      - link "ធនាគារជាតិនៃកម្ពុជា៖ គ្រឹះស្ថានធនាគារ និងហិរញ្ញវត្ថុត្រូវអនុវត្តដោយផ្ទាល់នូវបទបញ្ជារបស់អាជ្ញាធរមានសមត្ថកិច្ចពាក់ព័ន្ធនឹងការបង្កកគណនីអតិថិជន" [ref=e61] [cursor=pointer]:
        - /url: /article/article-msyy6o5h
      - link "ក្រុម AOT ចុះពិនិត្យផ្ទាល់ទីតាំងផ្ទះពលរដ្ឋរងការខូចខាតនៅខេត្តព្រះវិហារ" [ref=e62] [cursor=pointer]:
        - /url: /article/aot-inspects-preah-vihear-homes
      - link "កាតព្វកិច្ចយោធា៖ យោធិននឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀល" [ref=e63] [cursor=pointer]:
        - /url: /article/military-service-monthly-allowance
      - link "សម្តេចធិបតី ហ៊ុន ម៉ាណែត ប្តេជ្ញាជំរុញទំនាក់ទំនងទ្វេភាគីជាមួយសហរដ្ឋអាម៉េរិក" [ref=e64] [cursor=pointer]:
        - /url: /article/hun-manet-boosts-cambodia-us-ties
      - link "ប៉ូឡូញដាក់ឱសានវាទ ៥០លានដុល្លារ ព្រមាន Elon Musk" [ref=e65] [cursor=pointer]:
        - /url: /article/poland-warns-elon-musk
      - link "ផែនការបំបែកវ៉ាក់សាំង MMR របស់លោក Trump ប្រឈមនឹងផ្លូវទាល់" [ref=e66] [cursor=pointer]:
        - /url: /article/trump-mmr-vaccine-plan-stalls
      - link "AI កំពុងផ្លាស់ប្តូរវិស័យបច្ចេកវិទ្យាកម្ពុជា" [ref=e67] [cursor=pointer]:
        - /url: /article/khmer-ai-transformation-2026
      - link "ខេមបូឌាន លីគ រដូវកាលថ្មី បើកឆាកដ៏រំភើប" [ref=e68] [cursor=pointer]:
        - /url: /article/cambodian-football-league-final
      - link "វិស័យទេសចរណ៍អង្គរកំពុងងើបឡើងវិញយ៉ាងរឹងមាំ" [ref=e69] [cursor=pointer]:
        - /url: /article/angkor-siem-reap-tourism-booms
      - link "ធនាគារជាតិនៃកម្ពុជា៖ គ្រឹះស្ថានធនាគារ និងហិរញ្ញវត្ថុត្រូវអនុវត្តដោយផ្ទាល់នូវបទបញ្ជារបស់អាជ្ញាធរមានសមត្ថកិច្ចពាក់ព័ន្ធនឹងការបង្កកគណនីអតិថិជន" [ref=e70] [cursor=pointer]:
        - /url: /article/article-msyy6o5h
      - link "ក្រុម AOT ចុះពិនិត្យផ្ទាល់ទីតាំងផ្ទះពលរដ្ឋរងការខូចខាតនៅខេត្តព្រះវិហារ" [ref=e71] [cursor=pointer]:
        - /url: /article/aot-inspects-preah-vihear-homes
      - link "កាតព្វកិច្ចយោធា៖ យោធិននឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀល" [ref=e72] [cursor=pointer]:
        - /url: /article/military-service-monthly-allowance
      - link "សម្តេចធិបតី ហ៊ុន ម៉ាណែត ប្តេជ្ញាជំរុញទំនាក់ទំនងទ្វេភាគីជាមួយសហរដ្ឋអាម៉េរិក" [ref=e73] [cursor=pointer]:
        - /url: /article/hun-manet-boosts-cambodia-us-ties
      - link "ប៉ូឡូញដាក់ឱសានវាទ ៥០លានដុល្លារ ព្រមាន Elon Musk" [ref=e74] [cursor=pointer]:
        - /url: /article/poland-warns-elon-musk
      - link "ផែនការបំបែកវ៉ាក់សាំង MMR របស់លោក Trump ប្រឈមនឹងផ្លូវទាល់" [ref=e75] [cursor=pointer]:
        - /url: /article/trump-mmr-vaccine-plan-stalls
      - link "AI កំពុងផ្លាស់ប្តូរវិស័យបច្ចេកវិទ្យាកម្ពុជា" [ref=e76] [cursor=pointer]:
        - /url: /article/khmer-ai-transformation-2026
      - link "ខេមបូឌាន លីគ រដូវកាលថ្មី បើកឆាកដ៏រំភើប" [ref=e77] [cursor=pointer]:
        - /url: /article/cambodian-football-league-final
      - link "វិស័យទេសចរណ៍អង្គរកំពុងងើបឡើងវិញយ៉ាងរឹងមាំ" [ref=e78] [cursor=pointer]:
        - /url: /article/angkor-siem-reap-tourism-booms
  - main [ref=e79]:
    - generic [ref=e81]:
      - generic [ref=e82]: "404"
      - heading "រកមិនឃើញទំព័រ" [level=1] [ref=e83]
      - paragraph [ref=e84]: សូមទោស ទំព័រដែលអ្នកកំពុងស្វែងរកមិនមានទេ។
      - link "ត្រឡប់ទៅទំព័រដើម" [ref=e85] [cursor=pointer]:
        - /url: /
  - contentinfo [ref=e86]:
    - generic [ref=e87]:
      - generic [ref=e88]:
        - link [ref=e89] [cursor=pointer]:
          - /url: /
          - img "Navatra 4K TV" [ref=e90]
        - paragraph [ref=e91]: មជ្ឈមណ្ឌលព័ត៌មានឌីជីថល ព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាប្រចាំថ្ងៃ
        - list "បណ្តាញសង្គម" [ref=e92]:
          - listitem [ref=e93]:
            - link "Facebook" [ref=e94] [cursor=pointer]:
              - /url: https://www.facebook.com/karpitnews
              - generic [ref=e95]: 
          - listitem [ref=e96]:
            - link "YouTube" [ref=e97] [cursor=pointer]:
              - /url: https://www.youtube.com/@KarpitNews
              - generic [ref=e98]: 
          - listitem [ref=e99]:
            - link "TikTok" [ref=e100] [cursor=pointer]:
              - /url: https://www.tiktok.com/@karpitnews
          - listitem [ref=e101]:
            - link "Instagram" [ref=e102] [cursor=pointer]:
              - /url: https://www.instagram.com/karpitnews
              - generic [ref=e103]: 
          - listitem [ref=e104]:
            - link "Telegram" [ref=e105] [cursor=pointer]:
              - /url: https://t.me/karpitnews
              - generic [ref=e106]: 
      - generic [ref=e107]:
        - heading "ព័ត៌មានថ្មីៗ" [level=4] [ref=e108]:
          - generic [ref=e109]: 
          - text: ព័ត៌មានថ្មីៗ
        - list [ref=e110]:
          - listitem [ref=e111]:
            - link "ធនាគារជាតិនៃកម្ពុជា៖ គ្រឹះស្ថានធនាគារ និងហិរញ្ញវត្ថុត្រូវអនុវត្តដោយផ្ទាល់នូវបទបញ្ជារបស់អាជ្ញាធរមានសមត្ថកិច្ចពាក់ព័ន្ធនឹងការបង្កកគណនីអតិថិជន" [ref=e112] [cursor=pointer]:
              - /url: /article/article-msyy6o5h
              - generic [ref=e113]: 
              - text: ធនាគារជាតិនៃកម្ពុជា៖ គ្រឹះស្ថានធនាគារ និងហិរញ្ញវត្ថុត្រូវអនុវត្តដោយផ្ទាល់នូវបទបញ្ជារបស់អាជ្ញាធរមានសមត្ថកិច្ចពាក់ព័ន្ធនឹងការបង្កកគណនីអតិថិជន
          - listitem [ref=e114]:
            - link "ក្រុម AOT ចុះពិនិត្យផ្ទាល់ទីតាំងផ្ទះពលរដ្ឋរងការខូចខាតនៅខេត្តព្រះវិហារ" [ref=e115] [cursor=pointer]:
              - /url: /article/aot-inspects-preah-vihear-homes
              - generic [ref=e116]: 
              - text: ក្រុម AOT ចុះពិនិត្យផ្ទាល់ទីតាំងផ្ទះពលរដ្ឋរងការខូចខាតនៅខេត្តព្រះវិហារ
          - listitem [ref=e117]:
            - link "កាតព្វកិច្ចយោធា៖ យោធិននឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀល" [ref=e118] [cursor=pointer]:
              - /url: /article/military-service-monthly-allowance
              - generic [ref=e119]: 
              - text: កាតព្វកិច្ចយោធា៖ យោធិននឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀល
          - listitem [ref=e120]:
            - link "សម្តេចធិបតី ហ៊ុន ម៉ាណែត ប្តេជ្ញាជំរុញទំនាក់ទំនងទ្វេភាគីជាមួយសហរដ្ឋអាម៉េរិក" [ref=e121] [cursor=pointer]:
              - /url: /article/hun-manet-boosts-cambodia-us-ties
              - generic [ref=e122]: 
              - text: សម្តេចធិបតី ហ៊ុន ម៉ាណែត ប្តេជ្ញាជំរុញទំនាក់ទំនងទ្វេភាគីជាមួយសហរដ្ឋអាម៉េរិក
      - generic [ref=e123]:
        - heading "ប្រភេទ" [level=4] [ref=e124]:
          - generic [ref=e125]: 
          - text: ប្រភេទ
        - list [ref=e126]:
          - listitem [ref=e127]:
            - link "ព័ត៌មានជាតិ" [ref=e128] [cursor=pointer]:
              - /url: /category/national-news
              - generic [ref=e129]: 
              - text: ព័ត៌មានជាតិ
          - listitem [ref=e130]:
            - link "នយោបាយ" [ref=e131] [cursor=pointer]:
              - /url: /category/politics
              - generic [ref=e132]: 
              - text: នយោបាយ
          - listitem [ref=e133]:
            - link "អន្តរជាតិ" [ref=e134] [cursor=pointer]:
              - /url: /category/international
              - generic [ref=e135]: 
              - text: អន្តរជាតិ
          - listitem [ref=e136]:
            - link "បច្ចេកវិទ្យា" [ref=e137] [cursor=pointer]:
              - /url: /category/technology
              - generic [ref=e138]: 
              - text: បច្ចេកវិទ្យា
          - listitem [ref=e139]:
            - link "សុខភាព" [ref=e140] [cursor=pointer]:
              - /url: /category/health
              - generic [ref=e141]: 
              - text: សុខភាព
          - listitem [ref=e142]:
            - link "កម្សាន្ត" [ref=e143] [cursor=pointer]:
              - /url: /category/entertainment
              - generic [ref=e144]: 
              - text: កម្សាន្ត
      - generic [ref=e145]:
        - heading "ព្រឹត្តិបត្រ" [level=4] [ref=e146]
        - paragraph [ref=e147]: សូមចុះឈ្មោះដើម្បីទទួលបានព័ត៌មានថ្មីៗប្រចាំថ្ងៃ
        - generic [ref=e148]:
          - textbox "អាសយដ្ឋានអ៊ីមែល" [ref=e149]
          - button "ចុះឈ្មោះ" [ref=e150] [cursor=pointer]:
            - generic [ref=e151]: 
    - generic [ref=e153]:
      - paragraph [ref=e154]: © ២០២៦ Navatra 4K TV · រក្សាសិទ្ធិគ្រប់យ៉ាង
      - list [ref=e155]:
        - listitem [ref=e156]:
          - link "លក្ខខណ្ឌប្រើប្រាស់" [ref=e157] [cursor=pointer]:
            - /url: /about
            - generic [ref=e158]: 
            - text: លក្ខខណ្ឌប្រើប្រាស់
        - listitem [ref=e159]:
          - link "គោលការណ៍ឯកជនភាព" [ref=e160] [cursor=pointer]:
            - /url: /about
            - generic [ref=e161]: 
            - text: គោលការណ៍ឯកជនភាព
        - listitem [ref=e162]:
          - link "ទំនាក់ទំនង" [ref=e163] [cursor=pointer]:
            - /url: /contact
            - generic [ref=e164]: 
            - text: ទំនាក់ទំនង
```

# Test source

```ts
  1  | import { expect, type Page, type APIRequestContext } from "@playwright/test";
  2  | import { ADMIN_URL, API_URL } from "../playwright.config";
  3  | 
  4  | export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "superadmin@navatra.tv";
  5  | export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
  6  | 
  7  | /** Sign in through the real admin UI and wait for the dashboard. */
  8  | export async function loginAsAdmin(page: Page): Promise<void> {
  9  |   await page.goto(`${ADMIN_URL}/login`);
> 10 |   await page.fill("#email", ADMIN_EMAIL);
     |              ^ TimeoutError: page.fill: Timeout 15000ms exceeded.
  11 |   await page.fill("#password", ADMIN_PASSWORD);
  12 |   await page.click('button[type="submit"]');
  13 |   await expect(page).toHaveURL(new RegExp(`^${ADMIN_URL}/?$`), { timeout: 20_000 });
  14 |   // Dashboard is rendered once the API fetch resolves.
  15 |   await expect(page.locator("h2").first()).toBeVisible({ timeout: 20_000 });
  16 | }
  17 | 
  18 | /** Read the JWT the admin SPA stored in localStorage after login. */
  19 | export function getAdminToken(page: Page): string | null {
  20 |   return page.evaluate(() => localStorage.getItem("navatra_admin_token"));
  21 | }
  22 | 
  23 | /** Small typed wrapper around the backend API (relative to /api/v1). */
  24 | export async function api(
  25 |   request: APIRequestContext,
  26 |   path: string,
  27 |   token: string | null,
  28 |   init: { method?: string; body?: unknown } = {}
  29 | ) {
  30 |   const res = await request.fetch(`${API_URL}/api/v1${path}`, {
  31 |     method: init.method ?? "GET",
  32 |     headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  33 |     data: init.body,
  34 |   });
  35 |   const json = (await res.json().catch(() => null)) as
  36 |     | { data?: unknown; message?: string }
  37 |     | null;
  38 |   return { status: res.status(), data: json?.data, message: json?.message };
  39 | }
  40 | 
  41 | /** Create an article via the admin API (used to fetch the generated slug). */
  42 | export async function getArticleSlug(
  43 |   request: APIRequestContext,
  44 |   id: number,
  45 |   token: string
  46 | ): Promise<string> {
  47 |   const { status, data } = await api(request, `/admin/articles/${id}`, token);
  48 |   expect(status, "fetch article detail").toBe(200);
  49 |   return (data as { slug: string }).slug;
  50 | }
  51 | 
```