# Homepage Editorial Layout System

## Overview

The homepage uses a **visual rhythm** approach — each category section uses a different editorial layout to create visual variety and keep readers engaged while scrolling.

## Editorial Layouts

### 1. Editorial Hero (`editorial-hero`)
```
┌───────────────────────────────┬───────────────────┐
│                               │ Small Story       │
│     LARGE FEATURE             ├───────────────────┤
│        IMAGE                  │ Small Story       │
│                               ├───────────────────┤
│       Headline                │ Small Story       │
│       Summary                 ├───────────────────┤
│                               │ Small Story       │
├───────────────────────────────┼───────────────────┤
│  Bottom stories (3 cards)                         │
└───────────────────────────────────────────────────┘
```
- **Required**: 4+ articles
- **Use for**: Most important category (e.g., National News)
- **Fallback**: Horizontal layout

### 2. Editorial Split (`editorial-split`)
```
┌───────────────────────┬───────────────────┐
│    FEATURE IMAGE      │  STORY IMAGE      │
│    Large headline     │  Headline         │
├───────────────────────┤───────────────────┤
│ STORY + headline      │ STORY + headline  │
└───────────────────────┴───────────────────┘
```
- **Required**: 4+ articles
- **Use for**: Important secondary category (e.g., Politics)
- **Fallback**: 3-column grid

### 3. Editorial Mosaic (`editorial-mosaic`)
```
┌───────────────────────┬───────────┬───────────┐
│                       │  STORY    │  STORY    │
│      FEATURE IMAGE    │  IMAGE    │  IMAGE    │
│      Headline         │  Headline │  Headline │
├───────────────────────┴───────────┴───────────┤
│ STORY + HEADLINE      │ STORY + HEADLINE       │
└───────────────────────┴───────────────────────┘
```
- **Required**: 5+ articles
- **Use for**: Creative editorial feel (e.g., International)
- **Fallback**: 3-column grid

### 4. Three-Column (`editorial-three-col`)
```
┌──────────┬──────────┬──────────┐
│  IMAGE   │  IMAGE   │  IMAGE   │
│  Title   │  Title   │  Title   │
├──────────┼──────────┼──────────┤
│  IMAGE   │  IMAGE   │  IMAGE   │
│  Title   │  Title   │  Title   │
└──────────┴──────────┴──────────┘
```
- **Required**: 3+ articles
- **Use for**: Standard category display
- **Fallback**: Compact grid

### 5. Editorial Compact (`editorial-compact`)
```
┌────────┬────────┬────────┬────────┐
│ IMAGE  │ IMAGE  │ IMAGE  │ IMAGE  │
│ Title  │ Title  │ Title  │ Title  │
├────────┼────────┼────────┼────────┤
│ IMAGE  │ IMAGE  │ IMAGE  │ IMAGE  │
│ Title  │ Title  │ Title  │ Title  │
└────────┴────────┴────────┴────────┘
```
- **Required**: 4+ articles
- **Use for**: Lower-priority sections (e.g., Business)
- **Fallback**: Horizontal layout

### 6. Editorial Horizontal (`editorial-horizontal`)
```
┌────────┬───────────────────────────┐
│ IMAGE  │ Headline                  │
│        │ Summary / metadata        │
├────────┼───────────────────────────┤
│ IMAGE  │ Headline                  │
│        │ Summary / metadata        │
└────────┴───────────────────────────┘
```
- **Required**: 3+ articles
- **Use for**: Content-rich categories (e.g., Technology)
- **Fallback**: List layout

### 7. Editorial List (`editorial-list`)
```
[IMAGE]  Category — Headline — Date / Author
──────────────────────────────────────────
[IMAGE]  Category — Headline — Date / Author
──────────────────────────────────────────
```
- **Required**: 3+ articles
- **Use for**: Clean editorial presentation
- **Fallback**: Minimal layout

### 8. Editorial Feature + Compact (`editorial-feature-compact`)
```
┌───────────────────────────────┬──────────────┐
│                               │ Story 1      │
│      FEATURE IMAGE            ├──────────────┤
│      Headline + excerpt       │ Story 2      │
│                               ├──────────────┤
│                               │ Story 3      │
│                               ├──────────────┤
│                               │ Story 4      │
└───────────────────────────────┴──────────────┘
```
- **Required**: 4+ articles
- **Use for**: Feature-driven categories (e.g., Sports)
- **Fallback**: Horizontal layout

### 9. Editorial Magazine (`editorial-magazine`)
```
┌──────────────────────────┬──────────┐
│                          │ Story 1  │
│      FEATURE IMAGE       ├──────────┤
│      Headline            │ Story 2  │
├──────────────────────────┼──────────┤
│ Story 3              │ Story 4       │
└──────────────────────────┴──────────┘
```
- **Required**: 5+ articles
- **Use for**: Visual categories (e.g., Entertainment)
- **Fallback**: 3-column grid

### 10. Editorial Minimal (`editorial-minimal`)
```
Single article: Full-width horizontal card
Two articles: Side-by-side 50/50 split
```
- **Required**: 1+ articles
- **Use for**: Categories with very few articles
- **Fallback**: N/A (terminal layout)

## Smart Fallback System

Each layout has minimum article requirements. When articles are insufficient, the system walks a fallback chain (max 3 hops) until it finds a layout with enough content.

Example chain:
```
editorial-hero (needs 4) → editorial-horizontal (needs 3) → editorial-list (needs 3) → editorial-minimal (needs 1)
```

## Admin Configuration

The admin can configure each category section:

1. **Layout Type** — Choose from 10 editorial layouts
2. **Article Limit** — How many articles to show (3, 4, 5, 6, 8, 10)
3. **Visibility** — Show/hide entire section
4. **Section Order** — Reorder sections with up/down buttons
5. **Accent Color** — Subtle accent for the section header

## Visual Rhythm Sequence

The default layout rhythm (when no admin override) cycles through:
1. 3-Column
2. Split
3. Mosaic
4. Horizontal
5. Feature + Compact
6. Magazine
7. Compact
8. List

This creates a visual rhythm that keeps the scrolling experience engaging.

## Responsive Behavior

Every layout transforms for mobile:
- **Desktop (992px+)**: Full editorial grid
- **Tablet (641-991px)**: Simplified to 1-2 columns
- **Mobile (≤640px)**: Single column, stacked cards

## Component Files

```
frontend/src/components/editorial/
├── EditorialSection.vue          # Layout engine with fallback
├── EditorialSkeleton.vue         # Loading skeleton per layout
├── SectionHeader.vue             # Reusable section header
└── layouts/
    ├── EditorialHeroLayout.vue
    ├── EditorialSplitLayout.vue
    ├── EditorialMosaicLayout.vue
    ├── EditorialThreeColLayout.vue
    ├── EditorialCompactLayout.vue
    ├── EditorialHorizontalLayout.vue
    ├── EditorialListLayout.vue
    ├── EditorialFeatureCompactLayout.vue
    ├── EditorialMagazineLayout.vue
    └── EditorialMinimalLayout.vue
```
