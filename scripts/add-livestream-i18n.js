const fs = require('fs');
const file = 'admin/src/i18n.ts';
let content = fs.readFileSync(file, 'utf8');

if (content.includes('livestream.title')) {
  console.log('Already has livestream keys');
  process.exit(0);
}

const kmInsert = `
    // ─── Live Streams ───
    "livestream.title": "ផ្សាយផ្ទាល់ Facebook",
    "livestream.subtitle": "គ្រប់គ្រងការផ្សាយផ្ទាល់ Facebook",
    "livestream.addStream": "បន្ថែមការផ្សាយផ្ទាល់",
    "livestream.createStream": "បង្កើតការផ្សាយផ្ទាល់",
    "livestream.editStream": "កែសម្រួលការផ្សាយផ្ទាល់",
    "livestream.empty": "មិនមានការផ្សាយផ្ទាល់",
    "livestream.emptyHint": "បន្ថែមការផ្សាយផ្ទាល់ Facebook ដើម្បីចាប់ផ្តើម",
    "livestream.addFirst": "បន្ថែមការផ្សាយផ្ទាល់ដំបូង",
    "livestream.titleKh": "ចំណងជើងខ្មែរ",
    "livestream.titleEn": "ចំណងជើងអង់គ្លេស",
    "livestream.titleKhPlaceholder": "ចំណងជើងជាភាសាខ្មែរ",
    "livestream.titleEnPlaceholder": "ចំណងជើងជាភាសាអង់គ្លេស",
    "livestream.facebookUrl": "URL Facebook",
    "livestream.facebookUrlHint": "បិទភ្ជាប់ URL Facebook Live ឬ Video",
    "livestream.descKh": "ការពិពណ៌នាខ្មែរ",
    "livestream.descEn": "ការពិពណ៌នាអង់គ្លេស",
    "livestream.descKhPlaceholder": "ការពិពណ៌នាជាភាសាខ្មែរ",
    "livestream.descEnPlaceholder": "ការពិពណ៌នាជាភាសាអង់គ្លេស",
    "livestream.thumbnail": "រូបភាពតូច",
    "livestream.status": "ស្ថានភាព",
    "livestream.statusDraft": "សេចក្តីព្រាង",
    "livestream.statusScheduled": "បានកំណត់ពេល",
    "livestream.statusLive": "កំពុងផ្សាយ",
    "livestream.statusEnded": "បានបញ្ចប់",
    "livestream.statusDisabled": "បានបិទ",
    "livestream.visibility": "ការបង្ហាញ",
    "livestream.visHomepage": "ទំព័រដើម",
    "livestream.visPageOnly": "ទំព័រផ្សាយប៉ុណ្ណោះ",
    "livestream.visHidden": "លាក់",
    "livestream.startAt": "ពេលចាប់ផ្តើម",
    "livestream.endAt": "ពេលបញ្ចប់",
    "livestream.order": "លំដាប់",
    "livestream.onHomepage": "បង្ហាញនៅទំព័រដើម",
    "livestream.featured": "ពិសេស",
    "livestream.goLive": "ចាប់ផ្សាយ",
    "livestream.endStream": "បញ្ចប់ការផ្សាយ",
    "livestream.preview": "មើលជាមុន",
    "livestream.actions": "សកម្មភាព",
    "livestream.total": "សរុប",
    "livestream.created": "បានបង្កើតការផ្សាយផ្ទាល់",
    "livestream.updated": "បានកែសម្រួលការផ្សាយផ្ទាល់",
    "livestream.deleted": "បានលុបការផ្សាយផ្ទាល់",
    "livestream.nowLive": "កំពុងផ្សាយផ្ទាល់!",
    "livestream.ended": "បានបញ្ចប់ការផ្សាយ",`;

const enInsert = `
    // ─── Live Streams ───
    "livestream.title": "Facebook Live Streams",
    "livestream.subtitle": "Manage Facebook live streams",
    "livestream.addStream": "Add Live Stream",
    "livestream.createStream": "Create Live Stream",
    "livestream.editStream": "Edit Live Stream",
    "livestream.empty": "No live streams",
    "livestream.emptyHint": "Add a Facebook live stream to get started",
    "livestream.addFirst": "Add first live stream",
    "livestream.titleKh": "Khmer Title",
    "livestream.titleEn": "English Title",
    "livestream.titleKhPlaceholder": "Title in Khmer",
    "livestream.titleEnPlaceholder": "Title in English",
    "livestream.facebookUrl": "Facebook URL",
    "livestream.facebookUrlHint": "Paste a Facebook Live or Video URL",
    "livestream.descKh": "Khmer Description",
    "livestream.descEn": "English Description",
    "livestream.descKhPlaceholder": "Description in Khmer",
    "livestream.descEnPlaceholder": "Description in English",
    "livestream.thumbnail": "Thumbnail Image",
    "livestream.status": "Status",
    "livestream.statusDraft": "Draft",
    "livestream.statusScheduled": "Scheduled",
    "livestream.statusLive": "Live",
    "livestream.statusEnded": "Ended",
    "livestream.statusDisabled": "Disabled",
    "livestream.visibility": "Visibility",
    "livestream.visHomepage": "Homepage",
    "livestream.visPageOnly": "Live page only",
    "livestream.visHidden": "Hidden",
    "livestream.startAt": "Start Time",
    "livestream.endAt": "End Time",
    "livestream.order": "Order",
    "livestream.onHomepage": "Show on Homepage",
    "livestream.featured": "Featured",
    "livestream.goLive": "Go Live",
    "livestream.endStream": "End Stream",
    "livestream.preview": "Preview",
    "livestream.actions": "Actions",
    "livestream.total": "Total",
    "livestream.created": "Live stream created",
    "livestream.updated": "Live stream updated",
    "livestream.deleted": "Live stream deleted",
    "livestream.nowLive": "Now live!",
    "livestream.ended": "Stream ended",`;

// Insert km keys after cmd.hint line
const kmHintIdx = content.indexOf('"cmd.hint":', content.indexOf('km:'));
if (kmHintIdx > 0) {
  let searchFrom = kmHintIdx;
  const quoteEnd = content.indexOf('"', kmHintIdx + 13);
  const lineEnd = content.indexOf('\n', quoteEnd);
  content = content.slice(0, lineEnd + 1) + kmInsert + content.slice(lineEnd);
}

// Insert en keys after cmd.hint line  
const enHintIdx = content.indexOf('"cmd.hint":', content.indexOf('en:'));
if (enHintIdx > 0) {
  const quoteEnd = content.indexOf('"', enHintIdx + 13);
  const lineEnd = content.indexOf('\n', quoteEnd);
  content = content.slice(0, lineEnd + 1) + enInsert + content.slice(lineEnd);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done - added livestream translations');
