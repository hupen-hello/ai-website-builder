# Event template — final steps for the next template

**No. This file does not make every category perfect if you follow it as written.**

It is the locked behavior of one theme: Event / Evenha (`template-evento-1`, category Event Services). Use it as the pattern. Do not paste Event’s menu, `-9` variants, or `Breadcrumb-9` into Business, Realestate, or any other category.

A new template is perfect only when all of these are true:

1. You fill in the theme sheet below before writing code.
2. You copy the shared editor behavior (Home column, card click, no inline edit on manager cards).
3. You build that theme’s own header, pages, and breadcrumb. You do not reuse Event’s labels.
4. You do not change files that other categories already share, except to add the new variant.

If the new template is another Event Services skin, follow every step and only change the sheet. If it is another category, follow the shared steps and replace Step 2 and Step 6 with that category’s own design.

## Theme sheet — fill this in first

| Item | Event example | New template |
| --- | --- | --- |
| Category | Event Services | |
| Template id | `template-evento-1` | |
| Variant suffix | `-9` | next free number, not `-9` unless it is this same theme |
| Header component | `EventHeader.tsx` | new file, do not edit Event’s header for another category |
| Menus that have a dropdown | About Us, Services, Pages | only the menus this design actually has |
| Menus with no arrow | Home, Events, Blog, Contact | |
| Pages that must not alias another slug | `our-team` is not `team` | list every slug that contains another page’s name |
| Managers this theme uses | Services, Blogs, Teams, Events, Gallery | only the ones this theme has. Skip the rest |
| Breadcrumb variant | `Breadcrumb-9` banner: title, image, Home / title | if the design is a banner, same three fields. If it is a text bar, keep that variant’s own fields |
| Card components to wire | `EventService`, `EventTeam`, `EventList`, `EventGallery` | that theme’s card components. Do not rewire `EventBlog.tsx` |

Reference implementation lives in `apps/frontend`. When a step names a file, open that file and copy the pattern. Swap the new theme’s labels, slugs, and variant ids from the sheet.

## Rules that must stay true

- The theme’s visual JSON is the source of the page. Do not replace it with generic service-page copy.
- Clicking a Service, Blog, Team, Event, or Gallery card opens **that item’s Edit modal**. It does not open a detail-page design.
- Blog already works. When you wire the other cards, do not rewrite the blog card.
- Header dropdown arrows appear only on the items that really have a menu.
- A real page such as Our Team must stay on its own slug. It must not fall back to Home.
- Home visibility in manager tables is an Active / Inactive badge, in the second column. It is not a switch.

---

## Step 1 — Register the theme and its pages

1. Add the template in `apps/frontend/app/editor/layout/src/data/categoryContent.json`.
2. Point every section at that theme’s variant (Event uses the `-9` variants: `Header-9`, `Breadcrumb-9`, `Product-9`, `Blog-9`, `ServicePage-9`, `TeamPage-9`, `EventPage-9`, `GalleryPage-9`, and so on).
3. Register each variant in `apps/frontend/app/editor/layout/src/lib/sectionRegistry.ts`.
4. Give every inner page its own slug. Example: Our Team is `our-team` / `TeamPage-9`. It is not the manager page `#page-teams`.

### Slug rule that broke Our Team

In `apps/frontend/app/editor/layout/src/lib/previewNav.ts`, `getPageSlugCandidates` must **not** treat the last word of `our-team` as `team`.

- `our-team` stays `our-team`.
- `team` and `teams` stay the manager listing.
- If a page label is unknown, do not reset the canvas to Home.

Do the same for any new page whose slug contains another page’s name (`our-story` is not `story`, `services-detail` is not `services`).

---

## Step 2 — Header menu

Only for a theme whose header works like Event. Another category keeps its own header file. Do not put Event’s About / Services / Pages arrows onto a theme that does not use that menu.

File to copy from: `apps/frontend/app/editor/layout/src/lib/eventHeaderNav.ts`  
Render to copy from: `apps/frontend/app/editor/layout/src/components/sections/header/EventHeader.tsx`

Event’s top menu is:

| Item | Dropdown |
| --- | --- |
| HOME | no |
| ABOUT US | yes — About Us, Mission, Vision, Our Story, Awards, Our Team, Why Choose Us |
| SERVICES | yes — Services, Services Detail |
| EVENTS | no |
| PAGES | yes — Gallery, Testimonials, Partners, FAQs, Career, quote, legal, 404, Sitemap |
| BLOG | no |
| CONTACT | no |

For a new template, list only the menus that theme actually has. Then:

1. Build one nav resolver for that theme. Do not flatten every inner page into the top bar.
2. Allow a dropdown only for the labels that should have one. Event’s allowlist is `about us`, `about`, `services`, `service`, `pages`, `page`.
3. If a item has no children, set `subLinks` to `undefined`. An empty array `[]` is truthy and draws an arrow on every item.
4. In the header JSX, render the arrow and the panel only when `link.subLinks?.length` is true. Close the ternary with `: null`, not `)}`. A missing `: null` is a parse error (`Expected '</', got '}'`).
5. Remove detail-only links from dropdowns. Event drops `team-detail`, `blog-detail`, and `/blog/123` style links.
6. Clicking **Our Team** in the menu opens `#page-our-team`. It does not open `#page-teams` and it does not send the user to Home.

---

## Step 3 — Manager tables: Home column

Applies to Blog, Service, Team, Event, and Gallery managers under `apps/frontend/app/editor/components/`.

1. Add `showOnHome?: boolean` on the item type. Missing value means shown (`!== false`).
2. Add a **Home** column. It is the **second** column, directly after the item name. Order is: drag handle, name, Home, then Category, Order, Status, actions.
3. Use `HomeFeedToggle` (`apps/frontend/app/editor/components/HomeFeedToggle.tsx`). It is an eye badge that says **Active** or **Inactive**. Do not use a switch.
4. Persist `showOnHome` on create, edit, and the badge click.
5. Give the table a real width so Category and Order do not overlap. Event uses `min-w-[960px]` (events `min-w-[1040px]`), `overflow-x-auto`, and `whitespace-nowrap` on the header cells.
6. The home canvas only shows items where `showOnHome !== false`. Filter in `apps/frontend/app/editor/layout/src/lib/managerHomeFeeds.ts` and when the section data is written in `apps/frontend/app/editor/layout/page.tsx`.

---

## Step 4 — No canvas inline edit on manager cards

Section titles such as “Our Services” stay inline-editable.

The cards that come from a sidebar manager must not show the blue inline text box or the image editor:

- service cards
- blog cards
- team cards
- event cards
- gallery photos
- the same cards on portfolio and property pages, if that theme has them

How:

1. Do not put `InlineRichText` or `data-editor-media` on the card title or card image.
2. Put `data-editor-no-inline="true"` on the card root. `EditableSection` then leaves the click alone.
3. Keep inline edit on the section heading, subtitle, and description above the grid.

---

## Step 5 — Card click opens that item’s Edit

This is the blog behavior. Copy it. Do not change `EventBlog.tsx` while wiring the others.

### What the click does

In the editor, a click on a card:

1. Does not navigate to a detail layout.
2. Writes `sessionStorage` key `ai-builder-open-manager-item:{Manager}`.
3. Dispatches `ai-builder-open-manager` with `{ manager, preservePage: true }`.
4. Dispatches `ai-builder-open-manager-item` with `{ manager, item }`.
5. The sidebar opens that manager and the matching item’s Edit form.

Shared helper: `apps/frontend/app/editor/layout/src/lib/editorManagerCards.ts`  
`handleManagerCardClick` only runs when `editorMode` is true. Outside the editor the real link still works.

Managers:

| Card | Manager name | Storage key |
| --- | --- | --- |
| Service | `Services` | `ai-builder-open-manager-item:Services` |
| Blog | `Blogs` | `ai-builder-open-manager-item:Blogs` |
| Team | `Teams` | `ai-builder-open-manager-item:Teams` |
| Event | `Events` | `ai-builder-open-manager-item:Events` |
| Gallery | `Gallery` | `ai-builder-open-manager-item:Gallery` |

### Card markup

The whole card must be the hit target, not only the title or a “View more” button.

1. `page.tsx` renders `<Component data={sectionData} editorMode />`.
2. Page wrappers (`EventServicePage`, `EventBlogPage`, `EventTeamPage`, `EventListPage`, `EventGalleryPage`) must forward `editorMode`. If they drop it, the click does nothing.
3. On the card, add `data-editor-no-inline="true"` and `relative`.
4. Cover the card with a link or button: `absolute inset-0 z-20` (team uses `z-30`).
5. Inside that hit target, put an empty `<span className="absolute inset-0" aria-hidden="true" />`. The empty span is what makes the click reach the handler. A click on the title text is otherwise stolen by the inline editor.
6. `onClick` calls `handleManagerCardClick(event, editorMode, "Services" | "Blogs" | "Teams" | "Events" | "Gallery", { id, slug, title, href, image })`.
7. Pass `id` when the item has one. Also pass `slug` and `title`. Gallery also passes `image`, because some photos have no title.

### Manager side

Each manager listens for `ai-builder-open-manager-item` and also reads the session key when it becomes ready.

- Match by `id`, then `slug`, then `title`. Gallery also matches `image`.
- Remove the session key only after a match. If you delete it before the list has loaded, the edit form never opens.
- `apps/frontend/app/editor/components/Sidebar.tsx` must open that manager on `ai-builder-open-manager`. Gallery is included.

Event files that already do this:

- `components/sections/service/EventService.tsx`
- `components/sections/blog/EventBlog.tsx` — leave this file as it is
- `components/sections/team/EventTeam.tsx`
- `components/sections/event/EventList.tsx`
- `components/sections/gallery/EventGallery.tsx`
- `ServiceManager.tsx`, `BlogManager.tsx`, `TeamManager.tsx`, `EventManager.tsx`, `GalleryManager.tsx`

When writing section data in `page.tsx`, keep `id` on team `members` and `id` + `slug` on event `events`. Without them the click cannot find the row.

---

## Step 6 — Breadcrumb editor shows the banner, not the page body

Do this only when the new theme’s breadcrumb is a banner (title, image, Home / title), like `Breadcrumb-9`.

Do not do this to `Breadcrumb-1` through `Breadcrumb-5`. Those variants are other categories. They keep `pretitle`, `title`, `desc`, and their own colors. Forcing Event’s three fields onto them breaks those templates.

Event breadcrumb is variant `Breadcrumb-9` (`EventBreadCrumb.tsx`). The banner shows:

- the page title
- the trail `Home / {title}`
- the banner image

The editor must show those three fields. It must not show `pretitle`, `desc`, or `desc2`. Those values are copied from the page body (service copy) and are not on the banner.

1. One resolver builds the view for both the canvas and the editor: `apps/frontend/app/editor/layout/src/lib/eventBreadcrumb.ts` (`resolveEventBreadcrumbView`).
2. Map each page slug to that page’s banner in the theme JSON (`PageBanner` variants).
3. Title on screen is the current page name. A saved title is used only after the user actually changes it. Ignore the placeholders `About Us` and `Page`.
4. If the stored trail still says `Home / About Us` while the page title is something else, ignore that trail and show `Home / {current title}`.
5. Background is `data.bgImage`, then the banner image from JSON.
6. In `EditSectionModal.tsx`:
   - add the variant to `breadcrumbLayouts`
   - set its content fields to `title`, `bgImage`, `breadcrumbs`
   - when the variant is open, render only those three, seeded by `resolveEventBreadcrumbView`
   - if `breadcrumbs` is not stored yet, seed the array before an add, delete, or nested edit, or the trail saves as a broken object
7. Do not add `pretitle` / `desc` / `desc2` for this banner variant.

---

## Step 7 — Check the theme before you call it done

Walk the editor, not only a screenshot. Also open one template in a different category and confirm its header, breadcrumb editor, and home page did not change.

Skip any check for a manager this theme does not have.

1. Header: arrows only on the menus that have children. Home, and any plain links, have no arrow.
2. Our Team (or the new theme’s equivalent) opens that page. The canvas does not jump to Home.
3. Team Detail and Blog Detail are not in the header menus.
4. Blog, Service, Team, Event, Gallery tables: Home is column 2, Active / Inactive badge, Category and Order do not overlap.
5. Turning Home to Inactive hides that card on the home section and keeps it on its own page.
6. Click a service card, a team card, an event card, and a gallery photo. Each opens **that** item’s Edit modal. Blog still does the same and was not rewritten.
7. The blue inline box does not appear on those cards. It can still appear on the section heading.
8. Open the breadcrumb on an inner page. If this theme uses a banner breadcrumb, the fields are title, background image, and the Home / title trail, and they match the banner. If this theme uses an older text breadcrumb, its own fields are still there. There is no unrelated service-page description in that modal.
9. A template in another category still opens, its header arrows are unchanged, and its breadcrumb editor was not replaced by Event’s three fields.

If a card click does nothing, check these three things in order: `editorMode` is forwarded, the card has an empty full-card hit target plus `data-editor-no-inline`, and the manager does not delete the session key before the item is found.
