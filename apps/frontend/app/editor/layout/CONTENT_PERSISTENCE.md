# Editor content persistence contract

- Website content belongs to the site, not to a theme or layout variant.
- A saved logo must remain unchanged after header layout and theme changes.
- Matching text, links, buttons, images, videos, and inline formatting must be
  copied to the destination section when its layout or theme changes.
- Destination visual settings such as colors, spacing, dimensions, alignment,
  sticky mode, and gradients remain owned by the selected layout.
- Editor mutations must update `sectionsRef` synchronously before autosave or
  the modal Done action reads the snapshot.
- Theme switching must save the current snapshot before activating the target
  theme, then save the converted snapshot under the new template id.
- Template defaults may fill missing fields, but must never overwrite matching
  user content.
- A draft copied from the database keeps the database `clientUpdatedAt` value
  and is marked as synced; reading it later must not make it artificially newer.
- Local storage may override a loaded database project only when it is marked
  as an unsynced user edit and its timestamp is newer than the server version.
- Legacy drafts without an explicit sync marker are never allowed to replace a
  successfully loaded database project.
