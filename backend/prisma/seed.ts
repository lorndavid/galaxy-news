import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { ArticleStatus, CommentStatus, Role } from "../src/constants";

const prisma = new PrismaClient();

// ------------------------------------------------------------------
// Copy existing site images into the local uploads dir so seeded
// articles have working featured images without Cloudinary.
// ------------------------------------------------------------------
const uploadsDir = path.resolve(process.cwd(), "uploads");
const seedDir = path.join(uploadsDir, "seed");
fs.mkdirSync(seedDir, { recursive: true });

const sourceImages: Record<string, string> = {
  "kh.jpg": path.resolve(__dirname, "..", "..", "assets", "img", "news", "KH.jpg"),
  "kh1.jpg": path.resolve(__dirname, "..", "..", "assets", "img", "news", "Kh1.jpg"),
  "kh2.jpg": path.resolve(__dirname, "..", "..", "assets", "img", "news", "kh2.jpg"),
  "elon.jpg": path.resolve(__dirname, "..", "..", "assets", "img", "news", "ELON.jpg"),
  "trump.jpg": path.resolve(__dirname, "..", "..", "assets", "img", "news", "Trump.jpg"),
  "banner4.png": path.resolve(__dirname, "..", "..", "assets", "img", "hero", "banner4.png"),
};

for (const [name, src] of Object.entries(sourceImages)) {
  const dest = path.join(seedDir, name);
  if (!fs.existsSync(dest) && fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

const img = (name: string) => `/uploads/seed/${name}`;

// ------------------------------------------------------------------
// Users
// ------------------------------------------------------------------
async function seedUsers() {
  const users = [
    { name: "Super Admin", email: "superadmin@navatra.tv", password: "admin123", role: Role.SUPER_ADMIN },
    { name: "Admin", email: "admin@navatra.tv", password: "admin123", role: Role.ADMIN },
    { name: "Editor", email: "editor@navatra.tv", password: "editor123", role: Role.EDITOR },
    { name: "Author", email: "author@navatra.tv", password: "author123", role: Role.AUTHOR },
  ];
  const created: Record<string, { id: number }> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, isActive: true },
      create: {
        name: u.name,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
      },
    });
    created[u.email] = user;
  }
  return created;
}

// ------------------------------------------------------------------
// Categories & tags
// ------------------------------------------------------------------
async function seedCategories() {
  const categories = [
    { name: "ព័ត៌មានជាតិ", nameEn: "National News", slug: "national-news", color: "#0d3fa9", description: "ព័ត៌មានជាតិកម្ពុជាប្រចាំថ្ងៃ", descriptionEn: "Daily Cambodian national news", sortOrder: 1 },
    { name: "នយោបាយ", nameEn: "Politics", slug: "politics", color: "#e74c3c", description: "ព័ត៌មាននយោបាយក្នុងស្រុក និងក្រៅស្រុក", descriptionEn: "Local and international politics", sortOrder: 2 },
    { name: "អន្តរជាតិ", nameEn: "International", slug: "international", color: "#16a085", description: "ព័ត៌មានអន្តរជាតិជុំវិញពិភពលោក", descriptionEn: "World news", sortOrder: 3 },
    { name: "បច្ចេកវិទ្យា", nameEn: "Technology", slug: "technology", color: "#8e44ad", description: "បច្ចេកវិទ្យាថ្មីៗ និងឌីជីថល", descriptionEn: "New technology and digital", sortOrder: 4 },
    { name: "សុខភាព", nameEn: "Health", slug: "health", color: "#27ae60", description: "ព័ត៌មានសុខភាព និងវេជ្ជសាស្ត្រ", descriptionEn: "Health and medical news", sortOrder: 5 },
    { name: "កម្សាន្ត", nameEn: "Entertainment", slug: "entertainment", color: "#f39c12", description: "ព័ត៌មានកម្សាន្ត និងសិល្បៈ", descriptionEn: "Entertainment and arts", sortOrder: 6 },
    { name: "កីឡា", nameEn: "Sports", slug: "sports", color: "#2980b9", description: "ព័ត៌មានកីឡាក្នុងស្រុក និងអន្តរជាតិ", descriptionEn: "Local and international sports", sortOrder: 7 },
  ];
  const map: Record<string, { id: number }> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameEn: c.nameEn, color: c.color, description: c.description, descriptionEn: c.descriptionEn, sortOrder: c.sortOrder, isActive: true },
      create: c,
    });
    map[c.slug] = cat;
  }
  return map;
}

async function seedTags() {
  const tags = [
    { name: "យោធា", nameEn: "Military", slug: "military" },
    { name: "សេដ្ឋកិច្ច", nameEn: "Economy", slug: "economy" },
    { name: "បច្ចេកវិទ្យា", nameEn: "Technology", slug: "tech" },
    { name: "សុខភាព", nameEn: "Health", slug: "health" },
    { name: "អប់រំ", nameEn: "Education", slug: "education" },
    { name: "បរិស្ថាន", nameEn: "Environment", slug: "environment" },
    { name: "វប្បធម៌", nameEn: "Culture", slug: "culture" },
  ];
  const map: Record<string, { id: number }> = {};
  for (const t of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name, nameEn: t.nameEn },
      create: t,
    });
    map[t.slug] = tag;
  }
  return map;
}

// ------------------------------------------------------------------
// Articles
// ------------------------------------------------------------------
function now(daysAgo: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 30, 0, 0);
  return d;
}

interface SeedArticle {
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  content: string;
  contentEn?: string;
  image: string;
  category: string;
  tags: string[];
  author: string;
  status: ArticleStatus;
  featured?: boolean;
  breaking?: boolean;
  views: number;
  publishedDaysAgo: number;
}

const paragraphs = (...ps: string[]) =>
  ps.map((p) => `<p>${p}</p>`).join("\n");

const articles: SeedArticle[] = [
  {
    slug: "aot-inspects-preah-vihear-homes",
    title: "ក្រុម AOT ចុះពិនិត្យផ្ទាល់ទីតាំងផ្ទះពលរដ្ឋរងការខូចខាតនៅខេត្តព្រះវិហារ",
    titleEn: "AOT team inspects damaged homes in Preah Vihear province",
    excerpt: "ក្រុមអ្នកសង្កេតការណ៍អាស៊ានប្រចាំកម្ពុជា (AOT-KH) បានចុះពិនិត្យផ្ទាល់ទីតាំងលំនៅឋានពលរដ្ឋចំនួន ១១៤ខ្នង ដែលរងការខូចខាត នៅខេត្តព្រះវិហារ។",
    excerptEn: "The ASEAN observation team in Cambodia (AOT-KH) inspected 114 homes damaged along the border area in Preah Vihear province.",
    content:
      paragraphs(
        "ព្រះវិហារ៖ ក្រុមអ្នកសម្របសម្រួល (CLG) នៃកម្ពុជា បានសម្របសម្រួលជូនក្រុមអ្នកសង្កេតការណ៍អាស៊ានប្រចាំកម្ពុជា (AOT-KH) ចុះសង្កេតការណ៍ និងផ្ទៀងផ្ទាត់ស្ថានភាពជាក់ស្តែងនៅតាមបណ្តោយព្រំដែនកម្ពុជា-ថៃ ស្ថិតក្នុងភូមិតេជោមរកត ឃុំមរកត ស្រុកជាំក្សាន្ត ខេត្តព្រះវិហារ។",
        "យោងតាមសេចក្តីប្រកាសព័ត៌មានរបស់ក្រសួងការពារជាតិ ការចុះបេសកកម្មនេះធ្វើឡើងដើម្បីពិនិត្យមើលផ្ទះសម្បែងប្រជាពលរដ្ឋស៊ីវិលចំនួន ១១៤ខ្នង ដែលរងផលប៉ះពាល់ទាំងស្រុង និងធ្វើឱ្យពលរដ្ឋសរុបចំនួន ៥១១នាក់ (ស្រី ២៦៨នាក់) នៅមិនទាន់អាចត្រឡប់ទៅលំនៅឋានវិញបាន។",
        "ក្រសួងការពារជាតិបានគូសបញ្ជាក់ថា កម្ពុជាតែងតែផ្តល់ការគាំទ្រពេញទំហឹងដល់ក្រុម AOT និងបានសង្កត់ធ្ងន់លើសារៈសំខាន់ក្នុងការពង្រឹងតួនាទី និងអាណត្តិរបស់ក្រុមអ្នកសង្កេតការណ៍នេះ ដើម្បីធានាការអនុវត្តបទឈប់បាញ់ឱ្យបានពេញលេញ ព្រមទាំងលើកកម្ពស់តម្លាភាព គណនេយ្យភាព និងការជឿទុកចិត្តគ្នាទៅវិញទៅមក៕"
      ) +
        "\n<blockquote><p>ការចុះពិនិត្យផ្ទាល់នេះ គឺជាជំហានដ៏សំខាន់មួយ ដើម្បីធានានូវសុវត្ថិភាព និងសិទ្ធិរបស់ប្រជាពលរដ្ឋនៅតំបន់ព្រំដែន។</p></blockquote>",
    contentEn:
      paragraphs(
        "Preah Vihear: The Cambodian Coordination Group (CLG) facilitated a field mission for the ASEAN observation team (AOT-KH) to verify the situation along the Cambodia-Thailand border in Techo Morkat village, Preah Vihear province.",
        "According to the Ministry of National Defence, the mission inspected 114 civilian homes fully affected by the conflict, leaving 511 residents (268 women) unable to return to their homes.",
        "The Ministry stressed that Cambodia fully supports the AOT team and emphasized the importance of strengthening the observers' role and mandate to ensure the full implementation of the ceasefire, transparency, accountability and mutual trust."
      ),
    image: img("kh.jpg"),
    category: "national-news",
    tags: ["military"],
    author: "editor@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    featured: true,
    breaking: true,
    views: 12840,
    publishedDaysAgo: 1,
  },
  {
    slug: "military-service-monthly-allowance",
    title: "កាតព្វកិច្ចយោធា៖ យោធិននឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀល",
    titleEn: "Military service: conscripts to receive 400,000 riel monthly allowance",
    excerpt: "យោធិនក្នុងការបំពេញកាតព្វកិច្ចយោធា នឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀលក្នុងមួយខែ និងគោលរបបដូចយោធិនអាជីព។",
    excerptEn: "Conscripts fulfilling military service will receive a 400,000 riel monthly allowance and the same benefits as professional soldiers.",
    contentEn:
      paragraphs(
        "Phnom Penh: The Royal Government announced a new policy for conscripts fulfilling military service, who will receive a 400,000 riel monthly allowance plus social security and health benefits equal to professional soldiers.",
        "The Ministry of National Defence said the policy aims to improve living standards and encourage youth to fulfil their national duty.",
        "<h2>Benefits include:</h2><ul><li>400,000 riel monthly allowance</li><li>Health insurance coverage</li><li>Social security benefits</li><li>Scholarships for continued study after service</li></ul>"
      ),
    content:
      paragraphs(
        "ភ្នំពេញ៖ រាជរដ្ឋាភិបាលបានប្រកាសពីគោលនយោបាយថ្មីសម្រាប់យោធិនដែលបំពេញកាតព្វកិច្ចយោធា ដោយនឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀលក្នុងមួយខែ ព្រមទាំងគោលរបបសន្តិសុខសង្គម និងសុខាភិបាលដូចយោធិនអាជីពដែរ។",
        "នេះបើតាមការប្រកាសរបស់ក្រសួងការពារជាតិ ដែលបានគូសបញ្ជាក់ថា ការអនុវត្តនេះធ្វើឡើងដើម្បីលើកកម្ពស់ជីវភាព និងការលើកទឹកចិត្តដល់យុវជនក្នុងការបំពេញកាតព្វកិច្ចជាតិ។",
        "<h2>អត្ថប្រយោជន៍រួមមាន៖</h2><ul><li>ប្រាក់ឧបត្ថម្ភ ៤០០,០០០ រៀលក្នុងមួយខែ</li><li>ការធានារ៉ាប់រងសុខភាព</li><li>គោលរបបសន្តិសុខសង្គម</li><li>អាហារូបករណ៍បន្តការសិក្សាក្រោយបញ្ចប់កាតព្វកិច្ច</li></ul>"
      ),
    image: img("kh1.jpg"),
    category: "national-news",
    tags: ["military"],
    author: "editor@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    featured: true,
    views: 9840,
    publishedDaysAgo: 2,
  },
  {
    slug: "hun-manet-boosts-cambodia-us-ties",
    title: "សម្តេចធិបតី ហ៊ុន ម៉ាណែត ប្តេជ្ញាជំរុញទំនាក់ទំនងទ្វេភាគីជាមួយសហរដ្ឋអាម៉េរិក",
    titleEn: "PM Hun Manet pledges to boost Cambodia-US bilateral ties",
    excerpt: "សម្តេចធិបតី ហ៊ុន ម៉ាណែត បានប្តេជ្ញាជំរុញការពង្រឹងទំនាក់ទំនងទ្វេភាគីកម្ពុជា-សហរដ្ឋអាម៉េរិក ក្នុងគ្រប់វិស័យ។",
    excerptEn: "Prime Minister Hun Manet pledged to strengthen and expand Cambodia-US bilateral ties across all sectors.",
    contentEn:
      paragraphs(
        "Phnom Penh: Prime Minister Hun Manet announced Cambodia's commitment to strengthening and expanding bilateral ties with the United States across all sectors, including trade, investment, education and defence cooperation.",
        "During his meeting with the US side, the Prime Minister stressed that Cambodia is ready to promote mutual cooperation based on mutual respect and shared interests.",
        "The Cambodia-US relationship has continued to progress steadily following the resumption of dialogue between the two sides this year."
      ),
    content:
      paragraphs(
        "ភ្នំពេញ៖ សម្តេចធិបតី ហ៊ុន ម៉ាណែត នាយករដ្ឋមន្ត្រីកម្ពុជា បានប្រកាសប្តេជ្ញាជំរុញការពង្រឹង និងពង្រីកទំនាក់ទំនងទ្វេភាគីជាមួយសហរដ្ឋអាម៉េរិក លើគ្រប់វិស័យ រួមមានពាណិជ្ជកម្ម វិនិយោគ ការអប់រំ និងកិច្ចសហប្រតិបត្តិការយោធា។",
        "ក្នុងឱកាសជួបពិភាក្សាការងារជាមួយភាគីអាម៉េរិក សម្តេចធិបតីបានគូសបញ្ជាក់ថា កម្ពុជាត្រៀមខ្លួនរួចជាស្រេចក្នុងការជំរុញកិច្ចសហប្រតិបត្តិការទៅវិញទៅមក ដោយផ្អែកលើគោលការណ៍នៃការគោរពគ្នាទៅវិញទៅមក និងផលប្រយោជន៍រួម។",
        "គួរបញ្ជាក់ថា ទំនាក់ទំនងកម្ពុជា-សហរដ្ឋអាម៉េរិក កំពុងមានការរីកចម្រើនជាបន្តបន្ទាប់ បន្ទាប់ពីភាគីទាំងពីរបានបើកកិច្ចសន្ទនាឡើងវិញនៅឆ្នាំនេះ៕"
      ),
    image: img("kh2.jpg"),
    category: "politics",
    tags: [],
    author: "superadmin@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    featured: true,
    views: 7450,
    publishedDaysAgo: 3,
  },
  {
    slug: "poland-warns-elon-musk",
    title: "ប៉ូឡូញដាក់ឱសានវាទ ៥០លានដុល្លារ ព្រមាន Elon Musk",
    titleEn: "Poland issues $50M ultimatum, warns Elon Musk over Starlink",
    excerpt: "រដ្ឋមន្ត្រីការបរទេសប៉ូឡូញបានដាក់ឱសានវាទ ៥០លានដុល្លារអាម៉េរិក ព្រមានលោក Elon Musk ទាក់ទងនឹងសេវាកម្ម Starlink។",
    excerptEn: "Poland's foreign minister issued a $50 million ultimatum warning Elon Musk over the reliability of Starlink services.",
    contentEn:
      paragraphs(
        "Warsaw: Poland's Foreign Minister Radoslaw Sikorski said that if Elon Musk's Starlink satellite internet service cannot be trusted for Ukraine, Poland will consider other providers — and the $50 million annual cost currently paid by the Polish government would be reviewed.",
        "Sikorski said relying on an unpredictable provider is a high risk for regional security, especially amid the war in Ukraine.",
        "Elon Musk denied the allegations, stating Starlink continues to provide services to Ukraine as before."
      ),
    content:
      paragraphs(
        "វ៉ារស្សូ៖ រដ្ឋមន្ត្រីការបរទេសប៉ូឡូញ លោក Radosław Sikorski បានប្រកាសថា ប្រសិនបើសេវាកម្មអ៊ីនធឺណិតផ្កាយរណប Starlink របស់លោក Elon Musk មិនអាចទុកចិត្តបានសម្រាប់អ៊ុយក្រែនទេ ប៉ូឡូញនឹងពិចារណារកអ្នកផ្តល់សេវាផ្សេងទៀត ហើយថ្លៃសេវាប្រចាំឆ្នាំ ៥០លានដុល្លារអាម៉េរិក ដែលរដ្ឋាភិបាលប៉ូឡូញចេញថ្លៃ នឹងត្រូវពិនិត្យឡើងវិញ។",
        "លោក Sikorski បានលើកឡើងថា ការពឹងផ្អែកលើអ្នកផ្តល់សេវាដែលមិនអាចទស្សន៍ទាយបាន គឺជាហានិភ័យខ្ពស់សម្រាប់សន្តិសុខតំបន់ ជាពិសេសក្នុងបរិបទសង្គ្រាមនៅអ៊ុយក្រែន។",
        "ជុំវិញបញ្ហានេះ លោក Elon Musk បានបដិសេធរាល់ការចោទប្រកាន់ ដោយបញ្ជាក់ថា Starlink នៅតែបន្តផ្តល់សេវាកម្មដល់អ៊ុយក្រែនដដែល៕"
      ),
    image: img("elon.jpg"),
    category: "international",
    tags: ["tech"],
    author: "editor@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    views: 6120,
    publishedDaysAgo: 4,
  },
  {
    slug: "trump-mmr-vaccine-plan-stalls",
    title: "ផែនការបំបែកវ៉ាក់សាំង MMR របស់លោក Trump ប្រឈមនឹងផ្លូវទាល់",
    titleEn: "Trump's MMR vaccine split plan hits a dead end",
    excerpt: "ផែនការរបស់រដ្ឋបាលលោក Trump ក្នុងការបំបែកវ៉ាក់សាំង MMR ជាវ៉ាក់សាំងនីមួយៗ កំពុងប្រឈមនឹងឧបសគ្គផ្នែកវិទ្យាសាស្ត្រ និងច្បាប់។",
    excerptEn: "The Trump administration's plan to split the MMR vaccine into separate shots faces scientific and legal obstacles.",
    contentEn:
      paragraphs(
        "Washington: The Trump administration's plan to split the combined MMR vaccine (measles-mumps-rubella) into separate vaccines faces a dead end due to a lack of supporting scientific evidence and concerns from public health experts.",
        "Experts warn that splitting the vaccine could require children to receive more injections and increase the risk of missed doses, potentially leading to measles outbreaks.",
        "The MMR vaccine has been used widely for over 50 years and is considered safe and highly effective."
      ),
    content:
      paragraphs(
        "វ៉ាស៊ីនតោន៖ ផែនការរបស់រដ្ឋបាលសហរដ្ឋអាម៉េរិក ក្នុងការបំបែកវ៉ាក់សាំងផ្សំ MMR (កញ្ជ្រឹល-ស្រឡទែន-ស្អូច) ទៅជាវ៉ាក់សាំងដាច់ដោយឡែក កំពុងប្រឈមនឹងផ្លូវទាល់ ដោយសារកង្វះភស្តុតាងវិទ្យាសាស្ត្រគាំទ្រ និងការព្រួយបារម្ភពីអ្នកជំនាញសុខាភិបាលសាធារណៈ។",
        "អ្នកជំនាញបានព្រមានថា ការបំបែកវ៉ាក់សាំងអាចធ្វើឱ្យកុមារត្រូវចាក់ថ្នាំច្រើនដង និងបង្កើនហានិភ័យនៃការខកខានទទួលថ្នាំ ដែលអាចនាំឱ្យមានការផ្ទុះឡើងវិញនៃជំងឺកញ្ជ្រឹល។",
        "គួរបញ្ជាក់ថា វ៉ាក់សាំង MMR ត្រូវបានប្រើប្រាស់យ៉ាងទូលំទូលាយអស់រយៈពេលជាង ៥០ឆ្នាំមកហើយ ហើយត្រូវបានចាត់ទុកថាមានសុវត្ថិភាព និងប្រសិទ្ធភាពខ្ពស់៕"
      ),
    image: img("trump.jpg"),
    category: "health",
    tags: ["health"],
    author: "editor@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    breaking: true,
    views: 5280,
    publishedDaysAgo: 5,
  },
  {
    slug: "khmer-ai-transformation-2026",
    title: "AI កំពុងផ្លាស់ប្តូរវិស័យបច្ចេកវិទ្យាកម្ពុជា",
    titleEn: "AI is transforming Cambodia's technology sector",
    excerpt: "ភាពជឿនលឿននៃបញ្ញាសិប្បនិម្មិត (AI) កំពុងផ្លាស់ប្តូរវិស័យបច្ចេកវិទ្យានៅកម្ពុជា ពីការអប់រំ រហូតដល់ធនាគារ និងសុខាភិបាល។",
    excerptEn: "Advances in artificial intelligence (AI) are transforming Cambodia's technology sector, from education to banking and health.",
    contentEn:
      paragraphs(
        "Phnom Penh: Artificial intelligence (AI) is becoming a key driver of digital transformation in Cambodia, with many educational institutions, banks and hospitals adopting AI tools in their daily work.",
        "Tech experts estimate that AI adoption in Cambodia will double by 2027, especially in financial services and public service delivery.",
        "<blockquote><p>Digital and AI are no longer an option — they are a necessity for development.</p></blockquote>",
        "The Royal Government has also launched a digital policy to support the development of technology skills among Cambodian youth."
      ),
    content:
      paragraphs(
        "ភ្នំពេញ៖ បញ្ញាសិប្បនិម្មិត (AI) កំពុងក្លាយជាកម្លាំងជំរុញដ៏សំខាន់ក្នុងការផ្លាស់ប្តូរឌីជីថលនៅកម្ពុជា ដោយស្ថាប័នអប់រំ ធនាគារ និងមន្ទីរពេទ្យជាច្រើនបានចាប់ផ្តើមប្រើប្រាស់ឧបករណ៍ AI ក្នុងការងារប្រចាំថ្ងៃ។",
        "អ្នកជំនាញផ្នែកបច្ចេកវិទ្យាបានប៉ាន់ស្មានថា នៅឆ្នាំ២០២៧ ការប្រើប្រាស់ AI នៅកម្ពុជានឹងកើនឡើងទ្វេដង ជាពិសេសក្នុងវិស័យសេវាកម្មហិរញ្ញវត្ថុ និងការផ្តល់សេវាសាធារណៈ។",
        "<blockquote><p>ឌីជីថល និង AI មិនមែនជាជម្រើសទៀតទេ តែជាភាពចាំបាច់សម្រាប់ការអភិវឌ្ឍ។</p></blockquote>",
        "ទន្ទឹមនឹងនេះ រាជរដ្ឋាភិបាលក៏បានដាក់ចេញគោលនយោបាយឌីជីថល ដើម្បីគាំទ្រការអភិវឌ្ឍជំនាញបច្ចេកវិទ្យារបស់យុវជនកម្ពុជាផងដែរ៕"
      ),
    image: img("kh1.jpg"),
    category: "technology",
    tags: ["tech"],
    author: "author@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    views: 3210,
    publishedDaysAgo: 6,
  },
  {
    slug: "cambodian-football-league-final",
    title: "ខេមបូឌាន លីគ រដូវកាលថ្មី បើកឆាកដ៏រំភើប",
    titleEn: "Cambodian League opens an exciting new season",
    excerpt: "រដូវកាលថ្មីនៃពានរង្វាន់ខេមបូឌាន លីគ បានបើកឆាកឡើង ជាមួយការប្រកួតប្រជែងដ៏ខ្លាំងក្លារវាងក្លឹបឈានមុខទាំងអស់។",
    excerptEn: "The new Cambodian League season kicked off with intense competition between all the leading clubs.",
    contentEn:
      paragraphs(
        "Phnom Penh: The new Cambodian League season officially opened with 10 clubs competing for the country's top football trophy.",
        "The opening drew huge fan interest, especially with all leading clubs strengthening their squads ahead of international competitions as well.",
        "The Football Federation of Cambodia announced that the season will be broadcast live on television and digital platforms so fans nationwide can watch from anywhere."
      ),
    content:
      paragraphs(
        "ភ្នំពេញ៖ ពានរង្វាន់ខេមបូឌាន លីគ រដូវកាលថ្មីបានបើកឆាកជាផ្លូវការ ដោយមានក្លឹបចំនួន ១០ ចូលរួមប្រកួតប្រជែងដណ្តើមពានរង្វាន់កំពូលនៃបាល់ទាត់កម្ពុជា។",
        "ការបើកឆាកនេះ ទទួលបានការចាប់អារម្មណ៍ពីអ្នកគាំទ្រយ៉ាងច្រើន ជាពិសេសការពង្រឹងក្រុមរបស់ក្លឹបឈានមុខទាំងអស់ ក្នុងការត្រៀមខ្លួនសម្រាប់ការប្រកួតអន្តរជាតិផងដែរ។",
        "សហព័ន្ធកីឡាបាល់ទាត់កម្ពុជា បានប្រកាសថា រដូវកាលនេះនឹងមានការផ្សាយបន្តផ្ទាល់តាមទូរទស្សន៍ និងឌីជីថល ដើម្បីឱ្យអ្នកគាំទ្រទូទាំងប្រទេសអាចទស្សនាបានគ្រប់ទីកន្លែង៕"
      ),
    image: img("kh2.jpg"),
    category: "sports",
    tags: ["culture"],
    author: "author@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    views: 2150,
    publishedDaysAgo: 7,
  },
  {
    slug: "angkor-siem-reap-tourism-booms",
    title: "វិស័យទេសចរណ៍អង្គរកំពុងងើបឡើងវិញយ៉ាងរឹងមាំ",
    titleEn: "Angkor tourism is recovering strongly",
    excerpt: "ចំនួនភ្ញៀវទេសចរអន្តរជាតិមកទស្សនាប្រាសាទអង្គរបានកើនឡើងគួរឱ្យកត់សម្គាល់ ដែលជាសញ្ញាវិជ្ជមានសម្រាប់ការងើបឡើងវិញនៃវិស័យទេសចរណ៍កម្ពុជា។",
    excerptEn: "International tourist arrivals at Angkor temples have risen noticeably, a positive sign for the recovery of Cambodia's tourism sector.",
    contentEn:
      paragraphs(
        "Siem Reap: Tourism in Siem Reap province continues to recover strongly, with international arrivals at Angkor temples steadily increasing over the past few months.",
        "Figures from Angkor Enterprise show tens of thousands of foreign tourists bought temple entry tickets last month — a notable rise compared to previous years.",
        "Siem Reap authorities have prepared cultural and entertainment events to attract visitors and extend their average length of stay."
      ),
    content:
      paragraphs(
        "សៀមរាប៖ វិស័យទេសចរណ៍នៅខេត្តសៀមរាប កំពុងបន្តងើបឡើងវិញយ៉ាងរឹងមាំ បន្ទាប់ពីចំនួនភ្ញៀវទេសចរអន្តរជាតិមកទស្សនាប្រាសាទអង្គរមានការកើនឡើងជាលំដាប់ ក្នុងរយៈពេលប៉ុន្មានខែចុងក្រោយនេះ។",
        "តួលេខពីក្រុមហ៊ុនអង្គរអន្ធករបង្ហាញថា ចំនួនភ្ញៀវទេសចរបរទេសដែលទិញសំបុត្រចូលទស្សនាប្រាសាទអង្គរ ក្នុងខែកន្លងទៅ មានរហូតដល់រាប់ម៉ឺននាក់ ដែលជាការកើនឡើងគួរឱ្យកត់សម្គាល់បើធៀបនឹងឆ្នាំមុនៗ។",
        "អាជ្ញាធរខេត្តសៀមរាប បានរៀបចំកម្មវិធីព្រឹត្តិការណ៍វប្បធម៌ និងការកម្សាន្តជាច្រើន ដើម្បីទាក់ទាញភ្ញៀវទេសចរ និងពង្រីករយៈពេលស្នាក់នៅរបស់ភ្ញៀវឱ្យកាន់តែយូរ៕"
      ),
    image: img("kh.jpg"),
    category: "entertainment",
    tags: ["culture", "economy"],
    author: "author@navatra.tv",
    status: ArticleStatus.PUBLISHED,
    views: 1875,
    publishedDaysAgo: 8,
  },
];

async function seedArticles(users: Record<string, { id: number }>, categories: Record<string, { id: number }>, tags: Record<string, { id: number }>) {
  for (const a of articles) {
    const authorId = users[a.author]?.id ?? users["editor@navatra.tv"].id;
    const categoryId = categories[a.category].id;
    const tagIds = a.tags.map((t) => tags[t]?.id).filter(Boolean);

    const data = {
      slug: a.slug,
      title: a.title,
      titleEn: a.titleEn ?? null,
      excerpt: a.excerpt,
      excerptEn: a.excerptEn ?? null,
      content: a.content,
      contentEn: a.contentEn ?? null,
      featuredImage: a.image,
      authorId,
      categoryId,
      status: a.status,
      isFeatured: a.featured ?? false,
      isBreaking: a.breaking ?? false,
      views: a.views,
      publishedAt: now(a.publishedDaysAgo),
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    };

    await prisma.article.upsert({
      where: { slug: a.slug },
      update: { slug: a.slug, ...data, tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } },
      create: data as never,
    });
  }
}

const siteSettings = {
  siteName: "Navatra 4K TV",
  siteNameEn: "Navatra 4K TV",
  logo: "/assets/img/logo/logo1.png",
  favicon: "/assets/img/favicon.ico",
  description: "មជ្ឈមណ្ឌលព័ត៌មានឌីជីថល ព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាប្រចាំថ្ងៃ",
  descriptionEn: "A digital news hub with daily breaking news, entertainment and technology",
  defaultLanguage: "kh",
  facebook: "https://www.facebook.com/karpitnews",
  telegram: "https://t.me/karpitnews",
  youtube: "https://www.youtube.com/@KarpitNews",
  tiktok: "https://www.tiktok.com/@karpitnews",
  instagram: "https://www.instagram.com/karpitnews",
  twitter: "https://twitter.com/karpitnews",
  contactEmail: "info@navatra.tv",
  contactPhone: "+855 12 345 678",
  address: "ភ្នំពេញ កម្ពុជា",
  // Live news ticker defaults
  tickerEnabled: false,
  tickerTitle: "LIVE NEWS",
  tickerSpeed: "medium",
  tickerDirection: "left",
  tickerCount: 10,
  tickerRefresh: 30,
  tickerBgColor: "#0b1c39",
  tickerTextColor: "#ffffff",
  tickerAccentColor: "#fc3f00",
  // Theme tokens — flat editorial look by default (no radius, no shadows)
  primaryColor: "#0d3fa9",
  secondaryColor: "#0b1c39",
  accentColor: "#fc3f00",
  surfaceColor: "#ffffff",
  textColor: "#0b1c39",
  mutedTextColor: "#667085",
  borderColor: "#e5e7eb",
  bodyBgColor: "#f8f7f4",
  headerBgColor: "#ffffff",
  headerTextColor: "#0b1c39",
  footerBgColor: "#0b1c39",
  footerTextColor: "#ffffff",
  layoutStyle: "boxed",
  // Social share link templates
  shareFacebook: "https://www.facebook.com/sharer/sharer.php?u={url}",
  shareTikTok: "https://www.tiktok.com/share?url={url}",
  shareTelegram: "https://t.me/share/url?url={url}&text={title}",
  shareWhatsapp: "https://wa.me/?text={title} {url}",
  fontHeading: "Noto Sans Khmer",
  fontBody: "Noto Sans Khmer",
  fontArticle: "Noto Sans Khmer",
  fontSizeHero: 36,
  fontSizeSection: 24,
  fontSizeCard: 18,
  fontSizeBody: 16,
  radiusPreset: "sharp",
  shadowPreset: "none",
};

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: siteSettings,
    create: { id: 1, ...siteSettings },
  });
}

async function seedAds() {
  await prisma.advertisement.upsert({
    where: { id: 1 },
    update: {
      name: "Navatra 4K TV sidebar promo",
      title: "ផ្សាយពាណិជ្ជកម្ម",
      image: img("banner4.png"),
      link: "/",
      target: "_self",
      device: "all",
      priority: 0,
      position: "sidebar",
      isActive: true,
    },
    create: {
      id: 1,
      name: "Navatra 4K TV sidebar promo",
      title: "ផ្សាយពាណិជ្ជកម្ម",
      image: img("banner4.png"),
      link: "/",
      target: "_self",
      device: "all",
      priority: 0,
      position: "sidebar",
      isActive: true,
    },
  });
}

// Homepage sections — the order here defines the default layout.
// `config` holds per-section layout options (columns / sidebar), stored as JSON.
const homepageSections = [
  { key: "breaking", label: "បន្ទាត់ព័ត៌មានក្តៅ", enabled: true, sortOrder: 1, config: null },
  { key: "hero", label: "ព័ត៌មានកំពូល (Hero)", enabled: true, sortOrder: 2, config: { sidebar: true } },
  { key: "weekly", label: "ព័ត៌មានប្រចាំសប្តាហ៍", enabled: true, sortOrder: 3, config: null },
  { key: "whats-new", label: "អ្វីដែលថ្មី", enabled: true, sortOrder: 4, config: { columns: 5 } },
  { key: "latest", label: "ព័ត៌មានថ្មីៗ", enabled: true, sortOrder: 5, config: null },
  { key: "video", label: "វីដេអូ", enabled: true, sortOrder: 6, config: { columns: 5 } },
  { key: "recent", label: "អត្ថបទថ្មីៗ", enabled: true, sortOrder: 7, config: null },
];

async function seedHomepageSections() {
  for (const s of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { key: s.key },
      update: {
        label: s.label,
        enabled: s.enabled,
        sortOrder: s.sortOrder,
        config: s.config ? JSON.stringify(s.config) : null,
      },
      create: { key: s.key, label: s.label, enabled: s.enabled, sortOrder: s.sortOrder, config: s.config ? JSON.stringify(s.config) : null },
    });
  }
}

// Default navigation — mirrors the header order in the original design.
const navigationItems = [
  { label: "ទំព័រដើម", labelEn: "Home", type: "home", value: "/", sortOrder: 1 },
  { label: "ព័ត៌មានជាតិ", labelEn: "National News", type: "category", value: "national-news", sortOrder: 2 },
  { label: "នយោបាយ", labelEn: "Politics", type: "category", value: "politics", sortOrder: 3 },
  { label: "អន្តរជាតិ", labelEn: "International", type: "category", value: "international", sortOrder: 4 },
  { label: "បញ្ជីព័ត៌មាន", labelEn: "News List", type: "page", value: "news", sortOrder: 5 },
  { label: "ប្រភេទ", labelEn: "Categories", type: "page", value: "categories", sortOrder: 6 },
];

async function seedNavigation() {
  for (const [i, n] of navigationItems.entries()) {
    await prisma.navigationItem.upsert({
      where: { id: i + 1 },
      update: { label: n.label, labelEn: n.labelEn ?? null, type: n.type, value: n.value, sortOrder: n.sortOrder, isActive: true },
      create: { id: i + 1, ...n, isActive: true },
    });
  }
  // Prune rows left over from previous seed versions (e.g. removed items)
  // so they never resurface in the public navigation.
  await prisma.navigationItem.deleteMany({
    where: { id: { notIn: navigationItems.map((_, i) => i + 1) } },
  });
}

/**
 * The seed writes rows with explicit ids (settings=1, ad=1, nav=1..8).
 * SQLite's INTEGER PRIMARY KEY AUTOINCREMENT is advanced automatically
 * when an explicit id is inserted (sqlite_sequence tracks the max), so
 * no sequence resync is needed. Kept as a hook for other providers.
 */
async function syncSequences() {
  // SQLite: no-op — AUTOINCREMENT stays in sync automatically.
}
// ------------------------------------------------------------------
// View logs — backfill a realistic 14-day views-over-time series so the
// dashboard chart has data. Each seeded article's view count is spread
// across the days since it was published (spikier right after publish,
// tapering off), with a little randomness so the line looks organic.
// ------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateNDaysAgo(daysAgo: number, hour: number, minute: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function seedViewLogs() {
  const seeded = await prisma.article.findMany({
    where: { slug: { in: articles.map((a) => a.slug) } },
    select: { id: true, views: true, publishedAt: true },
  });
  if (!seeded.length) return;

  const rand = mulberry32(20260817); // deterministic — re-seeds look identical
  const rows: { articleId: number; viewedAt: Date }[] = [];

  for (const a of seeded) {
    const publishedDaysAgo = Math.max(
      0,
      Math.min(
        TREND_DAYS,
        Math.ceil((Date.now() - (a.publishedAt?.getTime() ?? Date.now())) / 86_400_000)
      )
    );
    const weight = (d: number) => Math.exp(-d / 3.2) * (0.85 + rand() * 0.5);
    const weights: number[] = [];
    let total = 0;
    for (let d = publishedDaysAgo; d >= 0; d--) {
      const w = weight(d);
      weights.push(w);
      total += w;
    }
    for (let d = publishedDaysAgo; d >= 0; d--) {
      const share = weights[publishedDaysAgo - d] / total;
      const count = Math.max(1, Math.round(a.views * share * (0.75 + rand() * 0.5)));
      for (let i = 0; i < count; i++) {
        rows.push({
          articleId: a.id,
          viewedAt: dateNDaysAgo(d, 7 + Math.floor(rand() * 13), Math.floor(rand() * 60)),
        });
      }
    }
  }

  // Reset only the seeded articles' logs (fresh real views survive) so
  // re-seeding never duplicates the backfill.
  await prisma.viewLog.deleteMany({ where: { articleId: { in: seeded.map((a) => a.id) } } });
  for (let i = 0; i < rows.length; i += 2000) {
    await prisma.viewLog.createMany({ data: rows.slice(i, i + 2000) });
  }
  console.log(`   ViewLog backfill: ${rows.length} events across ${TREND_DAYS} days`);
}

const TREND_DAYS = 14;

async function seedComments() {
  const article = await prisma.article.findUnique({ where: { slug: "aot-inspects-preah-vihear-homes" } });
  if (!article) return;
  const samples = [
    { name: "សុខា", email: "sokha@example.com", content: "ជាព័ត៌មានលម្អិតល្អណាស់ សូមអរគុណចំពោះការចុះផ្សាយ។", status: CommentStatus.APPROVED },
    { name: "វិច្ឆិកា", email: "vichet@example.com", content: "សូមឱ្យប្រជាពលរដ្ឋទទួលបានការគាំទ្រទាន់ពេលវេលា។", status: CommentStatus.APPROVED },
    { name: "ដារ៉ា", email: "dara@example.com", content: "អានបន្តទៀត ដើម្បីដឹងព័ត៌មានថ្មីៗ។", status: CommentStatus.PENDING },
  ];
  for (const c of samples) {
    await prisma.comment.create({
      data: { articleId: article.id, ...c },
    });
  }
}

async function main() {
  console.log("🌱 Seeding demo data...");
  const users = await seedUsers();
  const categories = await seedCategories();
  const tags = await seedTags();
  await seedArticles(users, categories, tags);
  await seedSettings();
  await seedAds();
  await seedHomepageSections();
  await seedNavigation();
  await syncSequences();
  await seedViewLogs();
  await seedComments();
  await prisma.activityLog.create({
    data: {
      userId: users["superadmin@navatra.tv"].id,
      action: "DB_SEEDED",
      entity: "System",
      meta: JSON.stringify({ note: "Demo data seeded — this is sample content, not real news." }),
    },
  });
  console.log("✅ Seed complete.");
  console.log("   Super admin:  superadmin@navatra.tv / admin123");
  console.log("   Admin:        admin@navatra.tv / admin123");
  console.log("   Editor:       editor@navatra.tv / editor123");
  console.log("   Author:       author@navatra.tv / author123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
