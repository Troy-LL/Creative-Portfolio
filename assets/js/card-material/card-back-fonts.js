/**
 * Card-back initials — self-hosted faces from Troy-LL/personal `fonts/`.
 * "Front face" matches `.physical-card__ink` in Card.css.
 */

/** Same stack as the calling-card print face */
export const CARD_FRONT_FONT_FAMILY =
  'Copperplate, "Copperplate Gothic", "Trajan Pro", "Times New Roman", Times, Georgia, serif';

export const CARD_BACK_FONT_DEFAULT = "dancing-script-regular";

/** @typedef {{ id: string, label: string, family: string, style: string, weight: string }} CardBackFont */

/** @type {CardBackFont[]} */
export const CARD_BACK_FONTS = [
  {
    id: "dancing-script-regular",
    label: "Dancing Script regular",
    family: '"Dancing Script", cursive',
    style: "normal",
    weight: "400",
  },
  {
    id: "front-face",
    label: "Front face (Copperplate)",
    family: CARD_FRONT_FONT_FAMILY,
    style: "normal",
    weight: "500",
  },
  {
    id: "boska-italic",
    label: "Boska italic",
    family: '"Boska Variable Italic", Georgia, "Times New Roman", serif',
    style: "italic",
    weight: "500",
  },
  {
    id: "boska-regular",
    label: "Boska regular",
    family: '"Boska Variable", Georgia, "Times New Roman", serif',
    style: "normal",
    weight: "500",
  },
  {
    id: "gambetta-italic",
    label: "Gambetta italic",
    family: '"Gambetta Variable Italic", Georgia, "Times New Roman", serif',
    style: "italic",
    weight: "500",
  },
  {
    id: "gambetta-regular",
    label: "Gambetta regular",
    family: '"Gambetta Variable", Georgia, "Times New Roman", serif',
    style: "normal",
    weight: "400",
  },
  {
    id: "switzer-regular",
    label: "Switzer regular",
    family: '"Switzer Regular", "Segoe UI", system-ui, sans-serif',
    style: "normal",
    weight: "400",
  },
  {
    id: "switzer-light",
    label: "Switzer light",
    family: '"Switzer Light", "Segoe UI", system-ui, sans-serif',
    style: "normal",
    weight: "300",
  },
];

export function getCardBackFont(id) {
  return (
    CARD_BACK_FONTS.find((f) => f.id === id) ??
    CARD_BACK_FONTS.find((f) => f.id === CARD_BACK_FONT_DEFAULT)
  );
}
