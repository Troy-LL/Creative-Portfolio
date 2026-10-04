# Feel — the redesign

How the whole visitor site should feel. Mechanics live in [design.md](design.md). Station `02` workbench rules live in [02-FEEL.md](02-FEEL.md). A physical control lives in [smooth-skeuomorphism.md](smooth-skeuomorphism.md). Brand voice and type beyond what this file names live in `Troy-LL/personal` → `docs/branding.md`.

You are at a table with one person's card. The site behaves like paper and objects. It does not behave like a marketing page.

## Weight

Things land, rest, and take a moment to leave.

Do:

- Let the card fall, settle, and take a cursor lean. Fold is the same card, not a new panel.
- Hold the folded pose for a short wall of scroll before the hop off `01`. Leaving is easy and not instant.
- Give a contact shadow at rest. Soft shadow only while something is in the air.
- Scroll-up undoes the path in reverse: stack, hop, hold, fold.

Don't:

- Fade, wipe, or button the entry open.
- Tear, shatter, or simulate cloth.
- Zoom, scale, dolly, or portal into the card.
- Skip the hold so the next chapter arrives on the same tick as the fold.

## Light and surface

Bone paper, warm ink, one quiet light.

Do:

- Keep the early floor bone. `--floor` on the door; `#F2EEE8` plus a light grain once the workbench rules apply.
- Use warm black ink. Labels in Switzer. Boska only for a scrap wordmark. The card back is **TL** in Dancing Script.
- Light from above. Shadows stay soft and warm.
- Let a later station change floor color only if it declares its own wall.

Don't:

- Neon, gloss, a second display face, or a dark-mode reskin of the table.
- A HUD, a sticky app bar, or a corner full of icons. A station may carry a quiet index mark.
- Texture used as decoration. Grain belongs to the paper. Device texture belongs to [smooth-skeuomorphism.md](smooth-skeuomorphism.md).

## Card

The calling card is realistic cardstock. It is not a smooth-skeuomorphic object. Smooth skeuomorphism is for a control that has earned a frame. The card is paper you could pick up.

Do:

- Keep the tooth of the sheet and the offset grain. Front and back are the same stock.
- Let ink sit in the paper: warm black on the face, **TL** in Dancing Script on the back.
- Show thickness. Dual shadows: a contact shadow at rest, a softer one only while the card is in the air.
- At rest, read as one sheet. Creases appear when it folds. The fold is stiff cardstock.

Don't:

- Sand the card into a matte device. No plastic body, no screws, no LED, no studio-clean chassis.
- Add leather, gloss, or a printed texture that is not paper.
- Weather it. A real card here is new stock, not a scuffed one.
- Draw a halo around the sheet, or show panel seams while it lies flat.

Mechanics stay in [design.md](design.md).

## Motion

One axis at a time. The path is an L: fold and hold on `01`, one horizontal hop onto the column, then a vertical stack through `02`–`06`. See [004](decisions/004-l-path-scroll-not-staircase.md).

Do:

- Move X on the hop and Y on the stack. Never both in one gesture.
- Keep the viewport pinned. The track moves.
- Honor `prefers-reduced-motion`: keep the pose and the nav's land, and freeze idle loops (the ruler ripple, a shake, a spin).

Don't:

- Add another horizontal corner between chapters.
- Diagonal pan, a staircase of hops, or free 2D roam.
- Nest a scroll trap that has no wall back to the table.

## Voice

Short, specific, first person when a person is speaking. One idea per line.

Do:

- Name the thing. "The thing behind the hatch." "Kept work." "The site this one replaced."
- Leave a sentence out when the object already says it.
- Sound like one person made the wall. "Everything on this wall is one person's work."

Don't:

- Open with `Welcome.`
- Use a skill list, badge wall, award receipt, or a line about passion.
- Explain the interaction in a caption. If the card needs a manual, the card is wrong. One subtle "scroll down" after settle is enough, once per session.

## Rooms

Each station is one job. Empty is allowed. If it looks busy, cut.

| Station | Feel |
| --- | --- |
| `01` Door | A card on a table. Pick it up, flip it, fold it. The hatch is a window in the wall, a slit of looping picture, not a trailer. |
| `02` Flagship | One project, the one the card was hiding. One case file. Placeholder copy stays placeholder until the work ships. |
| `03` Shelf | Few pieces. Only what earns shelf space. A piece with nothing to show stays a label: details when it earns them. |
| `04` Archive | The old desktop is an artifact with a placard. Retired, still visitable. It is not the live interface. |
| `05` Person | A name, a signature, a few lines. The hand that made the card. |
| `06` Exit | One link to a conversation. No form. No newsletter. |

Do:

- Peek inside a frame only when there is something real to show. Leave pulls back to the desk.
- Send someone out only from an explicit link (the archive desk, the exit card).
- Keep the push hand on the `01`→`02` seam decorative and non-interactive.

Don't:

- Turn `02` into a museum, a grid, or a store.
- Revive the Mac desktop as the redesign. The archive link is the door back.
- Fill the shelf to look productive.
- Add a second exit, a subscribe field, or a contact form on `06`.

`docs/02-FEEL.md` still locks a workbench (Tinig, EditLayer, one empty pad) and says not to implement it until Troy names a sprint. That file is the workbench. It is not a second flagship. Do not merge the workbench pads into the flagship chapter.

## Objects

The room stays paper. Realism is spent on a control that has earned a frame.

Do:

- Build that control as smooth skeuomorphism. Rules: [smooth-skeuomorphism.md](smooth-skeuomorphism.md).
- Default to one matte device (the MX-6). On a page it sits centered and small, with one line of type and flat chrome around it, as on [songwrap.app](https://songwrap.app). Use a digital twin or a toy-verb only when that file says so.

Don't:

- Make the table, the type, or the nav out of device plastic.
- Collect several realistic objects in one station. That is a toybox.

## Check

Before calling a station done:

- It has one job, and the job is obvious without a tour.
- Travel into it was one axis, and scroll-up leaves the way you came.
- The floor, ink, and type match this file.
- Nothing on it is a badge, a fake demo, a welcome, or a second product.
- Motion settles. Reduced motion holds the pose.
- A physical control, if there is one, passes the check in [smooth-skeuomorphism.md](smooth-skeuomorphism.md).
