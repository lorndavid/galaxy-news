<template>
  <div class="rounded-lg border border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
    <div class="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <template v-for="btn in toolbar" :key="btn.action">
        <button
          type="button"
          class="rounded p-1.5 hover:bg-slate-200"
          :class="{ 'bg-brand-100 text-brand-700': btn.active?.(editor) }"
          :title="btn.title"
          @mousedown.prevent
          @click="btn.run(editor)"
        >
          <component :is="btn.icon" class="h-4 w-4" />
        </button>
      </template>
      <button
        type="button"
        class="rounded p-1.5 hover:bg-slate-200"
        title="បន្ថែមរូបភាព"
        @mousedown.prevent
        @click="openMedia"
      >
        <ImageIcon class="h-4 w-4" />
      </button>
    </div>
    <EditorContent :editor="editor" />
  </div>

  <!-- Media picker modal -->
  <Modal v-model="mediaOpen" title="ជ្រើសរើសរូបភាព">
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="m in mediaItems"
        :key="m.id"
        class="overflow-hidden rounded-lg border-2 border-transparent hover:border-brand-500"
        @click="insertImage(m.secureUrl)"
      >
        <img :src="m.secureUrl" :alt="m.altText ?? m.fileName" class="h-20 w-full object-cover" />
      </button>
    </div>
    <button v-if="!mediaItems.length" class="btn-secondary mt-3 w-full" type="button" @click="loadMedia">
      ផ្ទុកបណ្ណាល័យមេឌា
    </button>
  </Modal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-vue-next";
import { adminService } from "@/services/admin.service";
import Modal from "@/components/ui/Modal.vue";
import type { Media } from "@/types";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const mediaOpen = ref(false);
const mediaItems = ref<Media[]>([]);

const editor = new Editor({
  extensions: [
    StarterKit,
    Image,
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: "សរសេរខ្លឹមសារអត្ថបទនៅទីនេះ..." }),
  ],
  content: props.modelValue,
  onUpdate: ({ editor: e }) => {
    emit("update:modelValue", e.getHTML());
  },
});

const toolbar = [
  { action: "bold", title: "ដិត", icon: Bold, active: (e: Editor) => e.isActive("bold"), run: (e: Editor) => e.chain().focus().toggleBold().run() },
  { action: "italic", title: "ទ្រេត", icon: Italic, active: (e: Editor) => e.isActive("italic"), run: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { action: "h1", title: "ចំណងជើង 1", icon: Heading1, active: (e: Editor) => e.isActive("heading", { level: 1 }), run: (e: Editor) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { action: "h2", title: "ចំណងជើង 2", icon: Heading2, active: (e: Editor) => e.isActive("heading", { level: 2 }), run: (e: Editor) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { action: "ul", title: "បញ្ជី", icon: List, active: (e: Editor) => e.isActive("bulletList"), run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
  { action: "ol", title: "បញ្ជីលេខ", icon: ListOrdered, active: (e: Editor) => e.isActive("orderedList"), run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
  { action: "quote", title: "សម្រង់", icon: Quote, active: (e: Editor) => e.isActive("blockquote"), run: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  { action: "code", title: "កូដ", icon: Code, active: (e: Editor) => e.isActive("codeBlock"), run: (e: Editor) => e.chain().focus().toggleCodeBlock().run() },
  { action: "link", title: "តំណ", icon: LinkIcon, active: (e: Editor) => e.isActive("link"), run: (e: Editor) => setLink(e) },
  { action: "undo", title: "មិនធ្វើវិញ", icon: Undo2, active: () => false, run: (e: Editor) => e.chain().focus().undo().run() },
  { action: "redo", title: "ធ្វើវិញ", icon: Redo2, active: () => false, run: (e: Editor) => e.chain().focus().redo().run() },
];

function setLink(e: Editor) {
  const prev = e.getAttributes("link").href as string | undefined;
  const url = window.prompt("តំណ URL:", prev ?? "https://");
  if (url === null) return;
  if (url === "") {
    e.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

async function openMedia() {
  mediaOpen.value = true;
  loadMedia();
}

async function loadMedia() {
  try {
    const data = await adminService.media({ pageSize: 24 });
    mediaItems.value = data.items;
  } catch {
    mediaItems.value = [];
  }
}

function insertImage(url: string) {
  editor.chain().focus().setImage({ src: url }).run();
  mediaOpen.value = false;
}

onBeforeUnmount(() => {
  editor.destroy();
});
</script>
