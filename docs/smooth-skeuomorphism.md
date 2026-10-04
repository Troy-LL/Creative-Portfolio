# Smooth skeuomorphism — how to recreate it

Build rules for a physical control in this portfolio. The whole-site feel is in [feel.md](feel.md). The want for this look is in [02-FEEL.md](02-FEEL.md) under Objects. The bone-paper room stays. This file is how the object is made.

The calling card is outside this file. It is realistic cardstock: tooth, grain, ink in the paper, thickness. See [feel.md](feel.md). Do not smooth it into a device.

Default to the MX-6. Use the Nord only when the object is a digital twin of a real product. Use the Etch A Sketch / golden ticket only when the object's real verb is the interaction.

## Light

One light, from above, slightly toward the reader. Every part shares it.

Do:

- One soft contact shadow under the whole object. Warm black, low alpha, small offset, wide blur. A second tighter shadow for the seam where it meets the table.
- Recesses darker toward the top edge (inset shadow). Raised parts lighter on the top edge, darker on the bottom edge.
- A status lamp as its own small glow. One lamp.

Don't:

- A second key light, a rim light, or a highlight that switches sides between parts.
- Gloss streaks, chrome, gel buttons, or a broad specular band.
- A hard drop shadow, a long cast shadow, or a shadow tinted pure `#000` on the bone floor.

## Material

Matte, manufactured, clean.

Do:

- Matte plastic as the body. Rubber or soft-touch for a cap you grab. Metal only for hardware that is actually metal (screw, knob skirt).
- Separate fills for separate materials. A screw is not the same paint as the chassis.
- Low noise. The surface reads as new.

Don't:

- Leather, stitching, wood grain, felt, linen, paper fiber on the device.
- Scratches, dust, fingerprints, fingerprints in the varnish, or edge wear.
- A texture image used as a shortcut for form. Form comes from light and separate parts.

## Form

A specific object, simplified.

Do:

- Keep the silhouette and the parts a hand would touch: slot, cap, screw, key, knob, screen.
- Use manufactured radii. Corners are rounded because they were tooled, not because the form is inflated.
- Sit the object on the bone floor (`#F2EEE8` in [02-FEEL.md](02-FEEL.md)) or inside a frame. The page around it stays flat.

Don't:

- An abstract extruded button that only suggests a device.
- One material for the control and the panel (neumorphism).
- Inflated, seamless, candy-colored clay (claymorphism).
- Ornament from classic skeuomorphism: stitches, wood, felt, gloss.
- A pile of objects. One control. If it looks busy, cut.

## Motion

The object does the verb the real thing does.

Do:

- A fader slides in its slot. A knob rotates. An Etch A Sketch draws when the knobs turn and clears when it is shaken. A ticket is punched.
- Honor `prefers-reduced-motion`: show the settled pose, skip the shake, spin, and idle loop.
- Keep room motion as already locked: pan and stack settle only. See [02-FEEL.md](02-FEEL.md).

Don't:

- A control that looks physical and then fades, scales, or crossfades like a normal button.
- A picture of the object next to an ordinary input. The object is the input.
- Looping motion on the room, the frame, or a second object.

## Nord Stage 4 — photoreal end

A digital twin. Use it when the work *is* the instrument (or an equally specific product) and a simplified body would be a lie.

Do:

- Match the real product's silhouette, control layout, and material split (painted body, plastic keys, printed panel).
- Keep the finish studio-clean. Accurate, not weathered.
- Light it with the same single soft key as everything else.

Don't:

- Invent extra knobs, labels, or panels.
- Start here for a gift-code field, a toggle, or a signature. That is the MX-6 or the object-verb, below.
- Reach for a 3D library. This repo's visitor surface is vanilla HTML/CSS/JS. A twin this dense is a drawn asset, not a scene graph.

## MX-6 — the default

One device, one job. Matte body, recessed slots, raised caps, a few screws, one LED. This is the look to copy unless a rule above says otherwise.

Live reference: [songwrap.app](https://songwrap.app). The page is a quiet gray field. One line of type sits above the device ("Enter your gift code"). The MX-6 is centered and small. Wordmark, quote, and buttons stay flat. A short "turn your volume up" moment can precede the device. The faders are the gift-code input.

Do:

- Build it in CSS on the visitor surface. Chassis, slot, cap, screw, and lamp are separate elements.
- Chassis: one rounded rectangle, flat matte fill, no texture.
- Slot: inset shadow, darker at the top.
- Cap: small radius, light top edge, dark bottom edge, so it reads as a piece sitting in the slot.
- Screw and LED: their own elements. The LED is the only saturated color.
- Labels on the device stay small and quiet. Room labels stay Switzer, from the feel file.

Don't:

- Micro-printed manuals, fake brand clutter, or a second lamp color.
- A gradient that tries to be a photograph of plastic.
- Neumorphic same-color extrusion. The cap, the slot, and the chassis are different depths and slightly different values.
- Clay radii. If a corner looks squeezable, it is too round.

## Etch A Sketch / golden ticket — the object is the control

Use this when a familiar object already has the verb: draw and shake to clear, punch a hole, tear a stub. The rendering is realistic. The page around it is flat type.

Do:

- Spend the realism on the object. Leave the heading, the date, and the button in ordinary type.
- Make the input the object's real gesture. Knobs draw. Shake clears. The punch makes the hole.
- Keep one object per frame.

Don't:

- Put the object in the room as decoration beside a normal form.
- Turn the desk into a toybox. [02-FEEL.md](02-FEEL.md) already refuses that.
- Animate the page, the card, or the frame to match the toy.

## What stays outside the object

From [02-FEEL.md](02-FEEL.md). This look does not replace them.

- Floor is paper `#F2EEE8` plus light grain. Warm black ink. No neon. No new display face.
- At most three frames, stacked. Peek is earned. Empty stays empty.
- No fake demo, store tile, twin MacBooks, grid, badge wall, or Mac OS revival.
- No live implement until Troy names a sprint.

## Check

Before calling an object done:

- One light direction, visible on every part.
- Contact shadow is soft and warm, not a hard black plate.
- Body is matte. Hardware is separate. One lamp at most.
- The silhouette names a real object without a caption.
- The gesture matches that object.
- The bone-paper room is unchanged.
- Reduced motion shows the settled pose.
