/**
 * Migrate admin views to use prefs.t() for i18n.
 * Fixed version: properly adds import and const after existing patterns.
 */
const fs = require('fs');
const path = require('path');

const VIEWS_DIR = path.join(__dirname, '../admin/src/views');

function addPrefsImport(content) {
  if (content.includes('usePreferencesStore')) return content;

  // Check if it's a <script setup> file
  if (!content.includes('<script setup')) return content;

  // Add import AFTER the last import line before </script>
  const importLines = content.match(/^.+from ["'].+["'];$/gm);
  if (!importLines || importLines.length === 0) return content;

  const lastImport = importLines[importLines.length - 1];
  content = content.replace(
    lastImport,
    lastImport + '\nimport { usePreferencesStore } from "@/stores/preferences";'
  );

  // Add const prefs after the first store/const declaration
  // Look for patterns like: const toast = useToastStore(), const auth = useAuthStore(), const stats = ref(...)
  const constPattern = /const (toast|auth|stats|items|loading|error|saving|articles|categories|media|tags|users) = (useToastStore|useAuthStore|ref|reactive)/;
  const constMatch = content.match(constPattern);
  if (constMatch) {
    const idx = content.indexOf(constMatch[0]);
    const lineEnd = content.indexOf('\n', idx);
    content = content.slice(0, lineEnd + 1) +
      'const prefs = usePreferencesStore();\n' +
      content.slice(lineEnd + 1);
  }

  return content;
}

// Template replacements: Khmer string → template expression
const TEMPLATE_MAP = [
  // ═══ ArticlesView ═══
  ['placeholder="ស្វែងរកអត្ថបទ..."', 'placeholder="prefs.t(\'articles.search\')"'],
  ['<option value="">ស្ថានភាពទាំងអស់</option>', '<option value="">{{ prefs.t(\'articles.allStatus\') }}</option>'],
  ['<option value="">ប្រភេទទាំងអស់</option>', '<option value="">{{ prefs.t(\'articles.allCategories\') }}</option>'],
  ['<Plus class="h-4 w-4" /> អត្ថបទថ្មី', '<Plus class="h-4 w-4" /> {{ prefs.t(\'articles.new\') }}'],
  ['<th>អត្ថបទ</th>', '<th>{{ prefs.t(\'articles.colArticle\') }}</th>'],
  ['<th>ស្ថានភាព</th>', '<th>{{ prefs.t(\'articles.colStatus\') }}</th>'],
  ['<th class="hidden md:table-cell">ប្រភេទ</th>', '<th class="hidden md:table-cell">{{ prefs.t(\'articles.colCategory\') }}</th>'],
  ['<th class="hidden lg:table-cell">អ្នកនិពន្ធ</th>', '<th class="hidden lg:table-cell">{{ prefs.t(\'articles.colAuthor\') }}</th>'],
  ['<th class="hidden lg:table-cell">ការមើល</th>', '<th class="hidden lg:table-cell">{{ prefs.t(\'articles.colViews\') }}</th>'],
  ['<th class="hidden xl:table-cell">ផ្សាយនៅ</th>', '<th class="hidden xl:table-cell">{{ prefs.t(\'articles.colPublished\') }}</th>'],
  ['<th class="text-right">សកម្មភាព</th>', '<th class="text-right">{{ prefs.t(\'articles.colActions\') }}</th>'],
  ['>ពិសេស</span>', '>{{ prefs.t(\'articles.featured\') }}</span>'],
  ['>ក្តៅ</span>', '>{{ prefs.t(\'articles.breaking\') }}</span>'],
  ['title="កែសម្រួល"', 'title="prefs.t(\'common.edit\')"'],
  ['title="មើលជាសាធារណៈ"', 'title="prefs.t(\'top.previewSite\')"'],
  ['title="លុប"', 'title="prefs.t(\'common.delete\')"'],
  ['បានជ្រើសរើស {{ selected.size }} អត្ថបទ', '{{ prefs.t(\'articles.bulkSelected\') }} {{ selected.size }} {{ prefs.t(\'nav.articles\') }}'],
  ['<Send class="h-3.5 w-3.5" /> ផ្សាយ', '<Send class="h-3.5 w-3.5" /> {{ prefs.t(\'articles.bulkPublish\') }}'],
  ['<Archive class="h-3.5 w-3.5" /> ឈប់ផ្សាយ', '<Archive class="h-3.5 w-3.5" /> {{ prefs.t(\'articles.bulkUnpublish\') }}'],
  ['<Trash2 class="h-3.5 w-3.5" /> លុប', '<Trash2 class="h-3.5 w-3.5" /> {{ prefs.t(\'articles.bulkDelete\') }}'],
  ['ឈប់ជ្រើសរើស', 'prefs.t(\'common.deselect\')'],

  // ═══ CategoriesView ═══
  ['>ប្រភេទ ({{ items.length }})', '>{{ prefs.t(\'categories.title\') }} ({{ items.length }})'],
  ['<Plus class="h-3.5 w-3.5" /> បន្ថែម', '<Plus class="h-3.5 w-3.5" /> {{ prefs.t(\'categories.add\') }}'],
  ['{{ c.isActive ? "សកម្ម" : "អសកម្ម" }}', '{{ c.isActive ? prefs.t(\'common.active\') : prefs.t(\'common.inactive\') }}'],

  // ═══ TagsView ═══
  ['>ស្លាក ({{ items.length }})', '>{{ prefs.t(\'tags.title\') }} ({{ items.length }})'],

  // ═══ MediaView ═══
  ['<h2>បណ្ណាល័យមេឌា</h2>', '<h2>{{ prefs.t(\'media.title\') }}</h2>'],
  ['<p>ផ្ទុក គ្រប់គ្រង និងជ្រើសរើសរូបភាពសម្រាប់អត្ថបទ</p>', '<p>{{ prefs.t(\'media.subtitle\') }}</p>'],
  ['placeholder="ស្វែងរកមេឌា..."', 'placeholder="prefs.t(\'media.search\')"'],
  ['<option value="all">គ្រប់ថតទាំងអស់</option>', '<option value="all">{{ prefs.t(\'media.allFolders\') }}</option>'],
  ['<option value="articles">អត្ថបទ</option>', '<option value="articles">{{ prefs.t(\'media.folderArticles\') }}</option>'],
  ['<option value="categories">ប្រភេទ</option>', '<option value="categories">{{ prefs.t(\'media.folderCategories\') }}</option>'],
  ['<option value="authors">អ្នកនិពន្ធ</option>', '<option value="authors">{{ prefs.t(\'media.folderAuthors\') }}</option>'],
  ['<option value="ads">ផ្សាយពាណិជ្ជកម្ម</option>', '<option value="ads">{{ prefs.t(\'media.folderAds\') }}</option>'],
  ['<option value="gallery">វិចិត្រសាល</option>', '<option value="gallery">{{ prefs.t(\'media.folderGallery\') }}</option>'],
  ['<option value="site">គេហទំព័រ</option>', '<option value="site">{{ prefs.t(\'media.folderSite\') }}</option>'],
  ['ជ្រើសរើសទាំងអស់', 'prefs.t(\'common.selectAll\')'],
  ['>អូសរូបភាពមកទីនេះ ឬចុចដើម្បីផ្ទុក</p>', '>{{ prefs.t(\'media.dropzone\') }}</p>'],
  ['>JPG, PNG, WebP, GIF · អតិបរមា 8MB</p>', '>{{ prefs.t(\'media.formats\') }}</p>'],
  ['title="ចម្លង URL"', 'title="prefs.t(\'common.copyUrl\')"'],

  // ═══ UsersView ═══
  ['placeholder="ស្វែងរកអ្នកប្រើប្រាស់..."', 'placeholder="prefs.t(\'users.search\')"'],
  ['<Plus class="h-3.5 w-3.5" /> បន្ថែមអ្នកប្រើប្រាស់', '<Plus class="h-3.5 w-3.5" /> {{ prefs.t(\'users.add\') }}'],
  ['>អ្នកប្រើប្រាស់</th>', '>{{ prefs.t(\'users.colUser\') }}</th>'],
  ['>តួនាទី</th>', '>{{ prefs.t(\'users.colRole\') }}</th>'],
  ['<th class="px-4 py-3">ស្ថានភាព</th>', '<th class="px-4 py-3">{{ prefs.t(\'users.colStatus\') }}</th>'],
  ['<th class="px-4 py-3 text-right">សកម្មភាព</th>', '<th class="px-4 py-3 text-right">{{ prefs.t(\'users.colActions\') }}</th>'],

  // ═══ CommentsView ═══
  ['>អត្ថបទ៖', '>{{ prefs.t(\'comments.article\') }}'],

  // ═══ AdsView ═══
  ['>ការផ្សាយពាណិជ្ជកម្ម / Banner Ads</h3>', '>{{ prefs.t(\'ads.title\') }}</h3>'],

  // ═══ NewsletterView ═══
  ['>អតិថិជនព្រឹត្តិបត្រ', '>{{ prefs.t(\'newsletter.title\') }}'],
  ['>មិនទាន់មានអ្នកចុះឈ្មោះទេ</div>', '>{{ prefs.t(\'newsletter.empty\') }}</div>'],

  // ═══ MessagesView ═══
  ['>សារទំនាក់ទំនង ({{ total }})', '>{{ prefs.t(\'messages.title\') }} ({{ total }})'],
  ['<h3>មិនមានសារទេ</h3>', '<h3>{{ prefs.t(\'messages.emptyTitle\') }}</h3>'],

  // ═══ ActivityView ═══
  ['>ប្រវត្តិសកម្មភាព</h3>', '>{{ prefs.t(\'activity.title\') }}</h3>'],
  ['<h3>មិនមានសកម្មភាពទេ</h3>', '<h3>{{ prefs.t(\'activity.emptyTitle\') }}</h3>'],

  // ═══ LoginView ═══
  ['>ប្រព័ន្ធគ្រប់គ្រងមាតិកា</p>', '>{{ prefs.t(\'settings.siteInfo\') }}</p>'],
  ['>អ៊ីមែល</label>', '>{{ prefs.t(\'login.email\') }}</label>'],
  ['>ពាក្យសម្ងាត់</label>', '>{{ prefs.t(\'login.password\') }}</label>'],

  // ═══ ProfileView ═══
  ['>ប្រវត្តិរូប</h3>', '>{{ prefs.t(\'profile.title\') }}</h3>'],
  ['>ឈ្មោះ</label>', '>{{ prefs.t(\'profile.name\') }}</label>'],

  // ═══ SystemHealthView ═══
  ['>សុខភាពប្រព័ន្ធ</h3>', '>{{ prefs.t(\'health.title\') }}</h3>'],

  // ═══ SettingsView ═══
  ['>ព័ត៌មានគេហទំព័រ</h3>', '>{{ prefs.t(\'settings.siteInfo\') }}</h3>'],

  // ═══ Common buttons ═══
  ['>ព្យាយាមម្តងទៀត</button>', '>{{ prefs.t(\'common.retry\') }}</button>'],
  ['>រក្សាទុក</button>', '>{{ prefs.t(\'common.save\') }}</button>'],

  // ═══ Toast messages (script) ═══
  ['toast.success("បានលុបអត្ថបទ")', 'toast.success(prefs.t(\'toast.articleDeleted\'))'],
  ['toast.error(e instanceof Error ? e.message : "លុបបរាជ័យ")', 'toast.error(e instanceof Error ? e.message : prefs.t(\'toast.deleteError\'))'],
  ['toast.success("បានបង្កើតប្រភេទ")', 'toast.success(prefs.t(\'toast.categoryCreated\'))'],
  ['toast.success("បានកែសម្រួលប្រភេទ")', 'toast.success(prefs.t(\'toast.categoryUpdated\'))'],
  ['toast.success("បានលុបប្រភេទ")', 'toast.success(prefs.t(\'toast.categoryDeleted\'))'],
  ['toast.error(e instanceof Error ? e.message : "រក្សាទុកបរាជ័យ")', 'toast.error(e instanceof Error ? e.message : prefs.t(\'toast.saveError\'))'],
  ['toast.success("បានបង្កើតស្លាក")', 'toast.success(prefs.t(\'toast.tagCreated\'))'],
  ['toast.success("បានកែសម្រួលស្លាក")', 'toast.success(prefs.t(\'toast.tagUpdated\'))'],
  ['toast.success("បានលុបស្លាក")', 'toast.success(prefs.t(\'toast.tagDeleted\'))'],
  ['toast.error(e instanceof Error ? e.message : "ផ្ទុកទិន្នន័យបរាជ័យ")', 'toast.error(e instanceof Error ? e.message : prefs.t(\'toast.loadError\'))'],
  ['toast.success("បានផ្ទុកមេឌាទៅ MinIO")', 'toast.success(prefs.t(\'toast.mediaUploaded\'))'],
  ['toast.success("បានលុបមេឌា")', 'toast.success(prefs.t(\'toast.mediaDeleted\'))'],
  ['toast.success("បានចម្លង URL")', 'toast.success(prefs.t(\'toast.mediaCopied\'))'],
  ['toast.success("បានរក្សាទុកការកំណត់")', 'toast.success(prefs.t(\'toast.settingsSaved\'))'],
  ['toast.success("បានបង្កើតអ្នកប្រើប្រាស់")', 'toast.success(prefs.t(\'toast.userCreated\'))'],
  ['toast.success("បានកែសម្រួលអ្នកប្រើប្រាស់")', 'toast.success(prefs.t(\'toast.userUpdated\'))'],
  ['toast.success("បានលុបអ្នកប្រើប្រាស់")', 'toast.success(prefs.t(\'toast.userDeleted\'))'],
  ['toast.success("បានរក្សាទុកប្រវត្តិរូប")', 'toast.success(prefs.t(\'toast.profileSaved\'))'],
];

// Process all .vue files
const files = fs.readdirSync(VIEWS_DIR).filter(f => f.endsWith('.vue'));
let totalChanges = 0;

for (const file of files) {
  if (file === 'DashboardView.vue') continue; // already done
  const filePath = path.join(VIEWS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Step 1: Add import and const
  content = addPrefsImport(content);

  // Step 2: Apply all replacements
  for (const [from, to] of TEMPLATE_MAP) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }

  if (content !== original) {
    const changes = (content.match(/prefs\.t\(/g) || []).length;
    totalChanges += changes;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}: ${changes} prefs.t() calls`);
  }
}

console.log(`\nDone! ${totalChanges} total prefs.t() calls across ${files.length - 1} views`);
