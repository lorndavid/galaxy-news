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
    { name: "ព័ត៌មានជាតិ", slug: "national-news", color: "#0d3fa9", description: "ព័ត៌មានជាតិកម្ពុជាប្រចាំថ្ងៃ", sortOrder: 1 },
    { name: "នយោបាយ", slug: "politics", color: "#e74c3c", description: "ព័ត៌មាននយោបាយក្នុងស្រុក និងក្រៅស្រុក", sortOrder: 2 },
    { name: "អន្តរជាតិ", slug: "international", color: "#16a085", description: "ព័ត៌មានអន្តរជាតិជុំវិញពិភពលោក", sortOrder: 3 },
    { name: "បច្ចេកវិទ្យា", slug: "technology", color: "#8e44ad", description: "បច្ចេកវិទ្យាថ្មីៗ និងឌីជីថល", sortOrder: 4 },
    { name: "សុខភាព", slug: "health", color: "#27ae60", description: "ព័ត៌មានសុខភាព និងវេជ្ជសាស្ត្រ", sortOrder: 5 },
    { name: "កម្សាន្ត", slug: "entertainment", color: "#f39c12", description: "ព័ត៌មានកម្សាន្ត និងសិល្បៈ", sortOrder: 6 },
    { name: "កីឡា", slug: "sports", color: "#2980b9", description: "ព័ត៌មានកីឡាក្នុងស្រុក និងអន្តរជាតិ", sortOrder: 7 },
  ];
  const map: Record<string, { id: number }> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, color: c.color, description: c.description, sortOrder: c.sortOrder, isActive: true },
      create: c,
    });
    map[c.slug] = cat;
  }
  return map;
}

async function seedTags() {
  const tags = [
    { name: "យោធា", slug: "military" },
    { name: "សេដ្ឋកិច្ច", slug: "economy" },
    { name: "បច្ចេកវិទ្យា", slug: "tech" },
    { name: "សុខភាព", slug: "health" },
    { name: "អប់រំ", slug: "education" },
    { name: "បរិស្ថាន", slug: "environment" },
    { name: "វប្បធម៌", slug: "culture" },
  ];
  const map: Record<string, { id: number }> = {};
  for (const t of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name },
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
  excerpt: string;
  content: string;
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
    excerpt: "ក្រុមអ្នកសង្កេតការណ៍អាស៊ានប្រចាំកម្ពុជា (AOT-KH) បានចុះពិនិត្យផ្ទាល់ទីតាំងលំនៅឋានពលរដ្ឋចំនួន ១១៤ខ្នង ដែលរងការខូចខាត នៅខេត្តព្រះវិហារ។",
    content:
      paragraphs(
        "ព្រះវិហារ៖ ក្រុមអ្នកសម្របសម្រួល (CLG) នៃកម្ពុជា បានសម្របសម្រួលជូនក្រុមអ្នកសង្កេតការណ៍អាស៊ានប្រចាំកម្ពុជា (AOT-KH) ចុះសង្កេតការណ៍ និងផ្ទៀងផ្ទាត់ស្ថានភាពជាក់ស្តែងនៅតាមបណ្តោយព្រំដែនកម្ពុជា-ថៃ ស្ថិតក្នុងភូមិតេជោមរកត ឃុំមរកត ស្រុកជាំក្សាន្ត ខេត្តព្រះវិហារ។",
        "យោងតាមសេចក្តីប្រកាសព័ត៌មានរបស់ក្រសួងការពារជាតិ ការចុះបេសកកម្មនេះធ្វើឡើងដើម្បីពិនិត្យមើលផ្ទះសម្បែងប្រជាពលរដ្ឋស៊ីវិលចំនួន ១១៤ខ្នង ដែលរងផលប៉ះពាល់ទាំងស្រុង និងធ្វើឱ្យពលរដ្ឋសរុបចំនួន ៥១១នាក់ (ស្រី ២៦៨នាក់) នៅមិនទាន់អាចត្រឡប់ទៅលំនៅឋានវិញបាន។",
        "ក្រសួងការពារជាតិបានគូសបញ្ជាក់ថា កម្ពុជាតែងតែផ្តល់ការគាំទ្រពេញទំហឹងដល់ក្រុម AOT និងបានសង្កត់ធ្ងន់លើសារៈសំខាន់ក្នុងការពង្រឹងតួនាទី និងអាណត្តិរបស់ក្រុមអ្នកសង្កេតការណ៍នេះ ដើម្បីធានាការអនុវត្តបទឈប់បាញ់ឱ្យបានពេញលេញ ព្រមទាំងលើកកម្ពស់តម្លាភាព គណនេយ្យភាព និងការជឿទុកចិត្តគ្នាទៅវិញទៅមក៕"
      ) +
        "\n<blockquote><p>ការចុះពិនិត្យផ្ទាល់នេះ គឺជាជំហានដ៏សំខាន់មួយ ដើម្បីធានានូវសុវត្ថិភាព និងសិទ្ធិរបស់ប្រជាពលរដ្ឋនៅតំបន់ព្រំដែន។</p></blockquote>",
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
    excerpt: "យោធិនក្នុងការបំពេញកាតព្វកិច្ចយោធា នឹងទទួលបានប្រាក់ឧបត្ថម្ភ ៤សែនរៀលក្នុងមួយខែ និងគោលរបបដូចយោធិនអាជីព។",
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
    excerpt: "សម្តេចធិបតី ហ៊ុន ម៉ាណែត បានប្តេជ្ញាជំរុញការពង្រឹងទំនាក់ទំនងទ្វេភាគីកម្ពុជា-សហរដ្ឋអាម៉េរិក ក្នុងគ្រប់វិស័យ។",
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
    excerpt: "រដ្ឋមន្ត្រីការបរទេសប៉ូឡូញបានដាក់ឱសានវាទ ៥០លានដុល្លារអាម៉េរិក ព្រមានលោក Elon Musk ទាក់ទងនឹងសេវាកម្ម Starlink។",
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
    excerpt: "ផែនការរបស់រដ្ឋបាលលោក Trump ក្នុងការបំបែកវ៉ាក់សាំង MMR ជាវ៉ាក់សាំងនីមួយៗ កំពុងប្រឈមនឹងឧបសគ្គផ្នែកវិទ្យាសាស្ត្រ និងច្បាប់។",
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
    excerpt: "ភាពជឿនលឿននៃបញ្ញាសិប្បនិម្មិត (AI) កំពុងផ្លាស់ប្តូរវិស័យបច្ចេកវិទ្យានៅកម្ពុជា ពីការអប់រំ រហូតដល់ធនាគារ និងសុខាភិបាល។",
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
    excerpt: "រដូវកាលថ្មីនៃពានរង្វាន់ខេមបូឌាន លីគ បានបើកឆាកឡើង ជាមួយការប្រកួតប្រជែងដ៏ខ្លាំងក្លារវាងក្លឹបឈានមុខទាំងអស់។",
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
    excerpt: "ចំនួនភ្ញៀវទេសចរអន្តរជាតិមកទស្សនាប្រាសាទអង្គរបានកើនឡើងគួរឱ្យកត់សម្គាល់ ដែលជាសញ្ញាវិជ្ជមានសម្រាប់ការងើបឡើងវិញនៃវិស័យទេសចរណ៍កម្ពុជា។",
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
      excerpt: a.excerpt,
      content: a.content,
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

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "Navatra 4K TV",
      logo: "/assets/img/logo/Logo%20galaxy%20navatra%204k%20TV.ai%202026-06.png",
      favicon: "/assets/img/favicon.ico",
      description: "មជ្ឈមណ្ឌលព័ត៌មានឌីជីថល ព័ត៌មានក្តៅៗ កម្សាន្ត និងបច្ចេកវិទ្យាប្រចាំថ្ងៃ",
      facebook: "https://www.facebook.com/karpitnews",
      telegram: "https://t.me/karpitnews",
      youtube: "https://www.youtube.com/@KarpitNews",
      tiktok: "https://www.tiktok.com/@karpitnews",
      instagram: "https://www.instagram.com/karpitnews",
      twitter: "https://twitter.com/karpitnews",
      contactEmail: "info@navatra.tv",
      contactPhone: "+855 12 345 678",
      address: "ភ្នំពេញ កម្ពុជា",
    },
  });
}

async function seedAds() {
  await prisma.advertisement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Navatra 4K TV sidebar promo",
      image: img("banner4.png"),
      link: "/",
      position: "sidebar",
      isActive: true,
    },
  });
}

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
