# Any template — shared editor steps

Use this file for every category: Business, Realestate, Event, or a new one.

This is the editor behavior that must be the same on every template. The look of the header, the page list, and the breadcrumb design belong to that theme. Do not copy them from another category.

The finished Event example is `docs/event-template-final-steps.md`. Read that only when the new theme is Event. Do not paste its menu, `-9` variants, or `Breadcrumb-9` into another category.

Admin screens are in `apps/admin`. The section components are in `apps/frontend`. A layout key in admin is useless until that same key is registered in the frontend.

---

## Fill this in before writing code

| Item | Write it here |
| --- | --- |
| Category name and slug | |
| Template title and key | |
| Single page or multiple pages | |
| Template id | |
| New variant suffix | next free number. Do not reuse another theme’s number |
| Header file | new file for this theme. Do not edit another theme’s header |
| Top menu items | |
| Which of those items have a real dropdown | |
| Inner pages and their slugs | |
| Slugs that contain another page’s name | example: `our-team` is not `team` |
| Managers this theme uses | only these: Services, Blogs, Teams, Events, Gallery, Portfolio, Properties, Countries |
| Card components for those managers | this theme’s files, not another theme’s |
| Breadcrumb variant | |
| What that breadcrumb actually draws | title, trail, image, or a text bar with its own fields |

If a row does not apply, leave it blank. Do not invent a manager or a page the design does not have.

Do admin in this order: category, then each layout, then the template. The React component for a layout key must already be registered, or the admin preview is blank.

---

## Admin — category, layout, template

Admin menu: **Categories**, **Custom Layouts** (`/custom-layouts`), **Templates** (`/template-admin`).

`/template-layouts` only redirects to Custom Layouts. Do not look for a second layout screen there.

### 1. Category

Open **Categories**. Create the category only if it does not exist.

- Name is the label the builder shows (Event Services, Realestate, Business).
- Slug is generated from the name. Keep it. Layouts store this slug.
- Status is **Active**. An inactive category does not show its templates.

Do not create a second category with a near-duplicate name. A template belongs to exactly one category.

### 2. Custom layout — one row per section variant

Open **Custom Layouts**. Add one row for every section variant this theme uses (`Header-7`, `Banner-7`, `Breadcrumb-7`, and the rest). The number is this theme’s suffix from the sheet. Do not reuse another theme’s number.

| Field | What to put |
| --- | --- |
| Key | `{SectionType}-{number}`, same string as `sectionRegistry.ts`. Example: `Header-7` |
| Name | Short label shown in the template builder |
| Section type | The registry type: Header, Banner, Breadcrumb, Product, Blog, Footer, ServicePage, and so on. Product is the Service section |
| Section number | The same number as in the key |
| Category | This theme’s category slug |
| Scope | `home` for home sections. `page` for an inner-page body (About page, Service page, Contact page) |
| Order | Display order inside that section type |
| Status | **Active**. Inactive layouts do not appear when you build the template |
| Thumbnail | Upload a still of that section. The builder uses it as the layout card |
| Description | Optional. One line is enough |

Preview opens `{frontend}/preview/layout/{key}?category={category name}`. If that preview is empty, the key is not registered in `sectionRegistry.ts`. Fix the code before saving the template.

Rules:

- One key, one component. Do not point `Header-7` at Event’s header.
- Home chrome (Topbar, Header, Banner, Footer) is scope `home`.
- An inner page body is scope `page`.
- A multi-page site still needs a Breadcrumb layout if inner pages do not draw their own banner. Do not add a second breadcrumb on a page body that already includes one.
- Do not edit or deactivate a layout key another category’s template already uses.

### 3. Template

Open **Templates**. Create the template and pick the layouts from step 2.

| Field | What to put |
| --- | --- |
| Title | Name shown when the user picks a template |
| Key | Stable id, unique inside that category. Example: `template-business-2` |
| Category | Exactly one. The save fails if you pick none or more than one |
| Type | **Single Page Website** or **Multiple Pages Website** |
| Section layouts | At least one. Map each section type to the layout key from step 2 |
| Pages | Only for Multiple Pages. Each page has an id, a label, and the page-body section. Home is not an inner page |
| Home section order | The order the home sections render. Footer stays last |
| Preview image | Card image for the template picker |
| Preview description | One line on the picker card |
| Status | **Active** |

Save checks, in this order: title and key are filled, exactly one category, at least one section layout.

For a multiple-page template:

- Home uses the home sections only.
- Each inner page is Header (and Topbar if the theme has one), then Breadcrumb, then that page’s body, then Footer.
- The header menu must match those pages. A page that is not in the menu still needs a slug if something links to it.
- Do not add Team Detail or Blog Detail as menu pages unless the design shows them.

After save, open the template preview from the admin card. You should see this theme’s sections, not another category’s header. Then do the editor steps below in the frontend.

The admin preview URL must include `templateId` (the template key, for example `template-service-1`) and `category`. Without `templateId`, compose loads another template’s colors. The logo panel, buttons, and accent text then look like a different site. The preview root also needs `data-site-theme-root` so the same theme stylesheet the editor uses is applied.

### Theme colors

The theme panel writes `--primary-bg`, `--header-bg`, `--hero-bg`, `--blue-bg`, `--primary-link-bg`, and the other tokens in `EditorThemePanels`. It does not write a private name such as `--color-accent`.

Point this theme’s brand colors at those tokens:

- Dark brand (logo panel, headings): `--color-primary: var(--header-bg)`
- Accent (buttons, highlights, active menu): `--color-accent: var(--primary-bg)`

Set the template’s default `--header-bg` and `--primary-bg` to the design’s real colors. A hardcoded `#007bff` or `#051838` in a class does not change when the user picks Sunset, Ocean, or any other preset. Use the variables above instead.

---

## Step 1 — Register only this theme

1. Add the template under its own category in `apps/frontend/app/editor/layout/src/data/categoryContent.json`.
2. Point each section at this theme’s variant ids.
3. Register those variants in `apps/frontend/app/editor/layout/src/lib/sectionRegistry.ts`.
4. One component file per theme. A new Business header does not go inside `EventHeader.tsx`.
5. Every inner page gets its own slug. A content page is not the manager hash (`#page-teams`, `#page-blogs`, and the rest).

### Where the component files go

Do not make a new folder named after the theme (`appliance/`, `hvac/`, or similar). The section folders already exist. Put this theme’s file in the folder that matches the section.

| What it is | File |
| --- | --- |
| Home about block | `about/ServiceAbout1.tsx` |
| About page body | `about/ServiceAboutPage.tsx` |
| Home blog block | `blog/ServiceBlogSection.tsx` |
| Blog page | `blog/ServiceBlogPage.tsx` |
| Blog detail page | `blog/ServiceBlogDetail.tsx` |

Use the same pattern for header, banner, footer, breadcrumb, service, gallery, contact, team, faq, and the rest. The `1` is this template’s own number. A page file sits in that same section folder (`ServiceAboutPage.tsx` inside `about/`). If that filename already belongs to another theme, pick a new name (`ServiceListPage.tsx`) and do not overwrite the existing file. Shared helpers (link component, types) go in `src/lib/`, not in a theme folder.

The registry key can use a different free suffix so it does not collide with another category. Example: file `header/ServiceHeader1.tsx`, registry key `Header-10`.

### Slugs

In `apps/frontend/app/editor/layout/src/lib/previewNav.ts`, `getPageSlugCandidates` must not treat the last word of a longer slug as a different page.

- `our-team` stays `our-team`. It is not `team` or `#page-teams`.
- Do the same for every slug you listed in the sheet (`our-story` is not `story`, `services-detail` is not `services`).
- An unknown page label must not reset the canvas to Home.

---

## Step 2 — Header

Build this theme’s own nav resolver and header component. Copy the rules, not another theme’s labels.

1. The top menu is the design’s menu. Do not flatten every inner page into the bar.
2. A dropdown exists only on items that have children in the design.
3. An item with no children has `subLinks: undefined`. An empty array `[]` still draws an arrow.
4. Draw the arrow and the panel only when `link.subLinks?.length` is true.
5. Close that JSX ternary with `: null`. Closing it with `)}` is a parse error (`Expected '</', got '}'`).
6. Do not put detail-only links in the menu (team detail, blog detail, `/blog/123`) unless the design shows them.
7. Clicking a menu item opens that item’s page. It does not open Home, and it does not open the manager hash for a different page.
8. The section wrapper already has the class `group`. Each menu item must use a named group: `group/nav` on the item, and `group-hover/nav:` on its dropdown. An unnamed `group-hover` opens every dropdown in the header at the same time.
9. In the editor, a menu link’s `href` must be that page’s hash (`#page-about-us`), not only a site path like `/about`. The hash is what the go-to icon matches. Put `data-editor-nav-link` on those anchors so the icon shows on Home when the pointer is on About Us, Gallery, Contact, and the other real page links.

---

## Step 3 — Home column in manager tables

The shared managers already live in `apps/frontend/app/editor/components/`:

`ServiceManager`, `BlogManager`, `TeamManager`, `EventManager`, `GalleryManager`, plus Portfolio, Properties, and Countries where those exist.

Do not build a second table. If this theme uses one of these managers, that table already has the Home column. Confirm it. Add the column only if a new manager is missing it.

1. `showOnHome?: boolean` on the item. Missing means shown (`!== false`).
2. Home is the **second** column, after the item name. Then Category, Order, Status, actions.
3. Use `HomeFeedToggle` in `apps/frontend/app/editor/components/HomeFeedToggle.tsx`. It is an Active / Inactive badge. It is not a switch.
4. Save `showOnHome` on create, edit, and the badge click.
5. The grid is wide enough that Category and Order do not overlap: `overflow-x-auto`, a `min-w-[960px]` table (wider if there are more columns), `whitespace-nowrap` on headers.
6. The home section hides items with `showOnHome === false`. Their own page still lists them. Filter in `apps/frontend/app/editor/layout/src/lib/managerHomeFeeds.ts` and when `page.tsx` writes that section’s data.

---

## Step 4 — No inline edit on manager cards

The section heading, subtitle, and intro can stay inline-editable.

A card that comes from a sidebar manager must not get the blue text box or the image editor. That includes service, blog, team, event, gallery, portfolio, and property cards when this theme has them.

1. No `InlineRichText` and no `data-editor-media` on the card title or the card image.
2. `data-editor-no-inline="true"` on the card root so `EditableSection` does not take the click.
3. Leave the heading above the grid editable.

---

## Step 5 — Card click opens that item’s Edit

A click does not open a detail-page design. It opens the sidebar Edit form for that one item.

Helper: `apps/frontend/app/editor/layout/src/lib/editorManagerCards.ts`

`handleManagerCardClick` runs only when `editorMode` is true. Outside the editor, the real link still works.

| Card | Manager | Storage key |
| --- | --- | --- |
| Service | `Services` | `ai-builder-open-manager-item:Services` |
| Blog | `Blogs` | `ai-builder-open-manager-item:Blogs` |
| Team | `Teams` | `ai-builder-open-manager-item:Teams` |
| Event | `Events` | `ai-builder-open-manager-item:Events` |
| Gallery | `Gallery` | `ai-builder-open-manager-item:Gallery` |
| Portfolio | `Portfolio` | `ai-builder-open-manager-item:Portfolio` |
| Property | `Properties` | `ai-builder-open-manager-item:Properties` |

Wire only the rows this theme uses.

### On the card

1. `page.tsx` already renders `<Component data={sectionData} editorMode />`. Keep that.
2. The page wrapper must forward `editorMode` into the card component. If it drops the prop, the click does nothing.
3. Card root: `relative` and `data-editor-no-inline="true"`.
4. Cover the whole card, not only the title or a “View more” button: `absolute inset-0 z-20`.
5. Inside that hit target, an empty `<span className="absolute inset-0" aria-hidden="true" />`. Without the empty span, the inline editor takes the click and the Edit modal never opens.
6. `onClick` calls `handleManagerCardClick(event, editorMode, managerName, { id, slug, title, href, image })`.
7. Pass `id` when the item has one, plus `slug` and `title`. Gallery also passes `image` when a photo has no title.
8. Do not rewrite a card file that already works for another theme. Add the hit target on this theme’s component.

### In the manager

`Sidebar.tsx` already opens Services, Blogs, Teams, Events, Gallery, Portfolio, Properties, and Countries on `ai-builder-open-manager`.

The manager must:

- listen for `ai-builder-open-manager-item`
- read `ai-builder-open-manager-item:{Manager}` when it becomes ready
- match `id`, then `slug`, then `title` (gallery also matches `image`)
- delete that session key only after a match. Deleting it before the list loads means the Edit form never opens.

When `page.tsx` writes the section data, keep `id` (and `slug` where the card uses it) on each item. A card with no id and no matching title cannot open the right row.

Blog cards that already open Edit stay as they are. Copy that pattern onto the other cards of this theme. Do not restyle the working blog card.

---

## Step 6 — Breadcrumb editor matches the banner on screen

The section editor shows the fields that component draws. It does not show another page’s body copy.

1. Look at the breadcrumb component. List the fields it renders (title, home label, trail, image, colors).
2. In `EditSectionModal.tsx`, that variant’s `componentContentFieldsByVariant` entry is only that list.
3. Add the variant to `breadcrumbLayouts` if it is missing.
4. Seed the editor from the same values the canvas uses (current page name, this page’s banner, saved image). Do not seed it from the service or about body `desc` / `desc2`.
5. A stored trail or title that belongs to a different page (for example `About Us` on the Services page) is ignored. Show the current page.
6. Do not change an existing breadcrumb variant that another category uses. `Breadcrumb-1` through `Breadcrumb-5` keep their own fields. A new banner gets a new variant id.

Event’s banner (`Breadcrumb-9`: title, background image, Home / title) is one example. A text breadcrumb keeps its own title and description fields.

---

## Step 7 — Done only after this pass

Use the editor. A screenshot is not enough. Then open one template in a different category and confirm it did not change.

1. In admin, the category is Active, every layout key for this theme is Active, and the template is Active on exactly that one category.
2. The template preview in admin shows this theme’s sections. A layout card is not blank.
3. Header arrows only on items that have children. Hovering one item opens only that item’s dropdown.
4. Each menu item opens its own page. None of them reset the canvas to Home. On Home, hovering a real page link (About Us, Gallery, Contact) shows the go-to icon.
5. Changing the theme preset changes this template’s brand colors (logo panel, buttons, headings, accents).
6. Detail links you removed are not in the menu.
7. For each manager this theme uses: Home is column 2, the control is the Active / Inactive badge, Category and Order do not overlap.
8. Home set to Inactive hides that card on the home section and leaves it on its own page.
9. Click one card of each manager this theme uses. The Edit modal opens for that item. A working blog card was not rewritten.
10. The blue inline box does not appear on those cards. It can still appear on the section heading.
11. The breadcrumb editor fields match the banner on that page.
12. Another category’s template still opens with its own header and its own breadcrumb fields. Its admin layouts were not edited.
13. The admin template card matches the editor: same logo panel, same header, same hero button colors.

If a card click does nothing, check in this order: `editorMode` is forwarded, the card has the empty full-card hit target and `data-editor-no-inline`, and the manager does not clear the session key before the item is found.
