/**
 * Vanilla mount of the locked physical calling-card material.
 * Mirrors calling-card InkSurface / PrintedContent / PaperTexture.
 */
import { buildPaperMaps } from "./paper-grain.js";
import {
  CARD_BACK_FONT_DEFAULT,
  getCardBackFont,
} from "./card-back-fonts.js";
import {
  FLAT_INK,
  LOCKED_INK,
  LOCKED_STOCK,
  grainVisual,
} from "./locked.js";

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else node.setAttribute(k, v === true ? "" : String(v));
  }
  return node;
}

function buildPrintMarkup(content, inkRole = "solid") {
  const align =
    inkRole === "density" || inkRole === "breakup" ? "true" : undefined;
  const ink = [
    "physical-card__ink",
    inkRole === "density" && "physical-card__ink--density",
    inkRole === "breakup" && "physical-card__ink--breakup",
    inkRole === "relief" && "physical-card__ink--relief",
  ]
    .filter(Boolean)
    .join(" ");

  const hasTop = Boolean(content.phone || content.company || content.division);
  const print = el(
    "div",
    ["physical-card__print", !hasTop && "physical-card__print--minimal"]
      .filter(Boolean)
      .join(" "),
  );

  if (hasTop) {
    const top = el("div", "physical-card__print-top");
    if (content.phone) {
      const phone = el("span", `${ink} physical-card__ink--small`, {
        text: content.phone,
      });
      if (align) phone.dataset.inkAlign = "";
      top.appendChild(phone);
    } else {
      top.appendChild(el("span"));
    }
    const brand = el("div", "physical-card__print-brand");
    if (content.company) {
      const company = el("span", `${ink} physical-card__ink--small`, {
        text: content.company,
      });
      if (align) company.dataset.inkAlign = "";
      brand.appendChild(company);
    }
    if (content.division) {
      const division = el("span", `${ink} physical-card__ink--tiny`, {
        text: content.division,
      });
      if (align) division.dataset.inkAlign = "";
      brand.appendChild(division);
    }
    top.appendChild(brand);
    print.appendChild(top);
  }

  const center = el("div", "physical-card__print-center");
  const name = el("p", `${ink} physical-card__ink--name`, {
    text: content.name ?? "",
  });
  if (align) name.dataset.inkAlign = "";
  center.appendChild(name);
  if (content.title) {
    const title = el("p", `${ink} physical-card__ink--title`, {
      text: content.title,
    });
    if (align) title.dataset.inkAlign = "";
    center.appendChild(title);
  }
  print.appendChild(center);

  const bottom = el("div", "physical-card__print-bottom");
  for (const line of content.lines ?? []) {
    const row = el("span", `${ink} physical-card__ink--url`, { text: line });
    if (align) row.dataset.inkAlign = "";
    bottom.appendChild(row);
  }
  print.appendChild(bottom);
  return print;
}

function svgEl(name, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [k, v] of Object.entries(attrs)) {
    const attr =
      k === "colorInterpolationFilters"
        ? "color-interpolation-filters"
        : k === "lightingColor"
          ? "lighting-color"
          : k === "stdDeviation"
            ? "stdDeviation"
            : k === "surfaceScale"
              ? "surfaceScale"
              : k === "diffuseConstant"
                ? "diffuseConstant"
                : k;
    node.setAttribute(attr, String(v));
  }
  return node;
}

function buildAbsorbFilter(id, absorb) {
  const coreErode = 0.15 + absorb * 1.1;
  const rimDilate = 0.2 + absorb * 1.35;
  const rimBlur = 0.25 + absorb * 1.1;
  const bleedOpacity = 0.15 + absorb * 0.55;

  const filter = svgEl("filter", {
    id,
    x: "-15%",
    y: "-15%",
    width: "130%",
    height: "130%",
    colorInterpolationFilters: "sRGB",
  });
  filter.append(
    svgEl("feMorphology", {
      in: "SourceAlpha",
      operator: "erode",
      radius: coreErode,
      result: "core",
    }),
    svgEl("feMorphology", {
      in: "SourceAlpha",
      operator: "dilate",
      radius: rimDilate,
      result: "dilated",
    }),
    svgEl("feGaussianBlur", {
      in: "dilated",
      stdDeviation: rimBlur,
      result: "softOuter",
    }),
    svgEl("feComposite", {
      in: "softOuter",
      in2: "core",
      operator: "out",
      result: "rim",
    }),
    svgEl("feComposite", {
      in: "SourceGraphic",
      in2: "core",
      operator: "in",
      result: "sharpBody",
    }),
    svgEl("feColorMatrix", {
      in: "SourceGraphic",
      type: "matrix",
      values: `1 0 0 0 0
               0 1 0 0 0
               0 0 1 0 0
               0 0 0 ${bleedOpacity} 0`,
      result: "faintInk",
    }),
    svgEl("feComposite", {
      in: "faintInk",
      in2: "rim",
      operator: "in",
      result: "bleed",
    }),
  );
  const merge = svgEl("feMerge");
  merge.append(
    svgEl("feMergeNode", { in: "sharpBody" }),
    svgEl("feMergeNode", { in: "bleed" }),
  );
  filter.appendChild(merge);
  return filter;
}

function buildReliefFilter(id, relief) {
  const surfaceScale = -0.35 - relief * 2.2;
  const reliefBlur = 0.35 + relief * 0.55;
  const reliefDilate = 0.4 + relief * 1.2;

  const filter = svgEl("filter", {
    id,
    x: "-20%",
    y: "-20%",
    width: "140%",
    height: "140%",
    colorInterpolationFilters: "sRGB",
  });
  const lit = svgEl("feDiffuseLighting", {
    in: "height",
    surfaceScale,
    diffuseConstant: 0.7 + relief * 0.5,
    lightingColor: "#ffffff",
    result: "lit",
  });
  lit.appendChild(
    svgEl("feDistantLight", { azimuth: 315, elevation: 40 }),
  );
  filter.append(
    svgEl("feMorphology", {
      in: "SourceAlpha",
      operator: "dilate",
      radius: reliefDilate,
      result: "wide",
    }),
    svgEl("feGaussianBlur", {
      in: "wide",
      stdDeviation: reliefBlur,
      result: "height",
    }),
    lit,
    svgEl("feComposite", {
      in: "lit",
      in2: "SourceAlpha",
      operator: "out",
      result: "rimLit",
    }),
    svgEl("feMorphology", {
      in: "SourceAlpha",
      operator: "dilate",
      radius: reliefDilate * 1.4,
      result: "falloffSrc",
    }),
    svgEl("feGaussianBlur", {
      in: "falloffSrc",
      stdDeviation: reliefBlur * 1.2,
      result: "falloff",
    }),
    svgEl("feComposite", {
      in: "rimLit",
      in2: "falloff",
      operator: "in",
      result: "stamped",
    }),
  );
  return filter;
}

/**
 * @param {HTMLElement} host
 * @param {{ seed?: number, ink?: object, stock?: object, filterId?: string, hideContactShadow?: boolean, showPrint?: boolean }} [opts]
 */
export function mountPhysicalCard(host, opts = {}) {
  const showPrint = opts.showPrint !== false;
  let stock = { ...LOCKED_STOCK, ...opts.stock };
  let ink = { ...FLAT_INK, ...opts.ink };
  let typeScale = opts.typeScale ?? 1;
  const filterId = opts.filterId || `lab-ink-${stock.seed}`;
  const absorbId = `${filterId}-absorb`;
  const reliefId = `${filterId}-relief`;

  const maps = opts.maps || buildPaperMaps(stock.seed, opts.mapSize ?? 512);
  let gVis = grainVisual(ink.grain);
  let absorb = Math.max(0, Math.min(1, ink.absorption));
  let relief = Math.max(0, Math.min(1, ink.relief));

  const card = el("article", "physical-card physical-card--lab", {
    "data-card-material": "uncoated-stock",
    "data-print": showPrint ? "on" : "off",
  });
  card.style.setProperty("--paper-base", stock.paperBase);
  card.style.setProperty("--paper-lit-opacity", String(stock.litOpacity));
  card.style.setProperty("--print-scale", String(typeScale));
  if (opts.inkColor) card.style.setProperty("--ink-color", opts.inkColor);

  if (!opts.hideContactShadow) {
    card.appendChild(el("div", "physical-card__contact-shadow", { "aria-hidden": "true" }));
  }

  const body = el("div", "physical-card__body");
  const surface = el("div", "physical-card__surface");

  const texture = el("div", "physical-card__texture", { "aria-hidden": "true" });
  const lit = el("div", "physical-card__texture-lit");
  lit.style.backgroundImage = maps.litUrl ? `url(${maps.litUrl})` : "none";
  texture.appendChild(lit);
  surface.appendChild(texture);

  let paperGrainOn = true;
  const backInitials = opts.backInitials ?? "TL";
  let backFontId = opts.backFont ?? CARD_BACK_FONT_DEFAULT;
  /** @type {HTMLElement | null} */
  let backMark = null;

  function applyBackFont(id = backFontId) {
    if (!backMark) return;
    backFontId = id || CARD_BACK_FONT_DEFAULT;
    const font = getCardBackFont(backFontId);
    card.style.setProperty("--back-font-family", font.family);
    card.style.setProperty("--back-font-style", font.style);
    card.style.setProperty("--back-font-weight", font.weight);
  }

  if (!showPrint) {
    backMark = el("div", "physical-card__back-mark", {
      text: backInitials,
      "aria-hidden": "true",
    });
    surface.appendChild(backMark);
    applyBackFont(backFontId);
  }

  function applyPaperGrain(on) {
    paperGrainOn = on;
    const opacity = on ? stock.litOpacity : 0;
    card.style.setProperty("--paper-lit-opacity", String(opacity));
    texture.style.display = on ? "" : "none";
  }

  function applyStock() {
    card.style.setProperty("--paper-base", stock.paperBase);
    if (paperGrainOn) {
      card.style.setProperty("--paper-lit-opacity", String(stock.litOpacity));
    }
  }

  function applyInkParams() {
    gVis = grainVisual(ink.grain);
    absorb = Math.max(0, Math.min(1, ink.absorption));
    relief = Math.max(0, Math.min(1, ink.relief));
    syncInkVars();
    rebuildFilters();
    rebuildInk(content);
  }

  const inkRoot = el("div", "physical-card__relief physical-card__ink-surface", {
    "data-ink": "physical",
  });
  inkRoot.style.setProperty("--ink-density", String(ink.density));
  inkRoot.style.setProperty("--ink-grain-vis", String(gVis));
  inkRoot.style.setProperty(
    "--ink-map-url",
    maps.inkUrl ? `url(${maps.inkUrl})` : "none",
  );
  inkRoot.style.setProperty(
    "--ink-pore-url",
    maps.inkBreakupUrl ? `url(${maps.inkBreakupUrl})` : "none",
  );
  inkRoot.style.setProperty("--ink-relief-op", String(relief * 0.55));

  const svg = svgEl("svg", {
    class: "physical-card__filters",
    "aria-hidden": "true",
    width: 0,
    height: 0,
    focusable: "false",
  });
  const defs = svgEl("defs");
  svg.appendChild(defs);
  inkRoot.appendChild(svg);

  function rebuildFilters() {
    while (defs.firstChild) defs.removeChild(defs.firstChild);
    defs.append(
      buildAbsorbFilter(absorbId, absorb),
      buildReliefFilter(reliefId, relief),
    );
  }
  rebuildFilters();

  const layers = {
    relief: null,
    solid: null,
    density: null,
    pores: null,
  };

  function syncInkVars() {
    inkRoot.style.setProperty("--ink-density", String(ink.density));
    inkRoot.style.setProperty("--ink-grain-vis", String(gVis));
    inkRoot.style.setProperty("--ink-relief-op", String(relief * 0.55));
  }

  function rebuildInk(content) {
    for (const key of Object.keys(layers)) {
      if (layers[key]) layers[key].remove();
      layers[key] = null;
    }

    if (relief > 0.02) {
      const wrap = el("div", "physical-card__ink-relief", {
        "aria-hidden": "true",
      });
      wrap.style.filter = `url(#${reliefId})`;
      wrap.style.opacity = String(relief * 0.7);
      wrap.appendChild(buildPrintMarkup(content, "relief"));
      inkRoot.appendChild(wrap);
      layers.relief = wrap;
    }

    const solid = el("div", "physical-card__ink-fill physical-card__ink-fill--solid");
    solid.style.opacity = String(ink.density * (1 - gVis * 0.28));
    if (absorb > 0.02) solid.style.filter = `url(#${absorbId})`;
    solid.appendChild(buildPrintMarkup(content, "solid"));
    inkRoot.appendChild(solid);
    layers.solid = solid;

    if (gVis > 0.02) {
      const density = el(
        "div",
        "physical-card__ink-fill physical-card__ink-fill--density",
      );
      density.style.opacity = String(ink.density * gVis);
      if (absorb > 0.02) density.style.filter = `url(#${absorbId})`;
      density.appendChild(buildPrintMarkup(content, "density"));
      inkRoot.appendChild(density);
      layers.density = density;
    }

    if (gVis > 0.08) {
      const pores = el(
        "div",
        "physical-card__ink-fill physical-card__ink-fill--pores",
        { "aria-hidden": "true" },
      );
      pores.style.opacity = String(gVis * 0.65);
      pores.appendChild(buildPrintMarkup(content, "breakup"));
      inkRoot.appendChild(pores);
      layers.pores = pores;
    }

    requestAnimationFrame(alignInkMaps);
  }

  function alignInkMaps() {
    const rr = inkRoot.getBoundingClientRect();
    if (rr.width < 1) return;
    inkRoot.style.setProperty("--ink-bg-w", `${rr.width}px`);
    inkRoot.style.setProperty("--ink-bg-h", `${rr.height}px`);
    inkRoot.querySelectorAll("[data-ink-align]").forEach((node) => {
      const r = node.getBoundingClientRect();
      node.style.setProperty("--ink-bg-x", `${rr.left - r.left}px`);
      node.style.setProperty("--ink-bg-y", `${rr.top - r.top}px`);
    });
  }

  surface.appendChild(
    el("div", "physical-card__edge", { "aria-hidden": "true" }),
  );
  if (showPrint) surface.appendChild(inkRoot);
  body.appendChild(surface);
  card.appendChild(body);

  host.replaceChildren(card);

  let content = {
    phone: "",
    company: "",
    division: "",
    name: "",
    title: "",
    lines: [],
  };
  if (showPrint) rebuildInk(content);

  const ro = new ResizeObserver(() => alignInkMaps());
  if (showPrint) ro.observe(inkRoot);

  return {
    el: card,
    maps,
    getMaterial() {
      return {
        stock: { ...stock },
        ink: { ...ink },
        typeScale,
        paperGrain: paperGrainOn,
        inkColor: card.style.getPropertyValue("--ink-color") || "#1a1814",
        backFont: backFontId,
      };
    },
    setContent(next) {
      if (!showPrint) return;
      content = { ...content, ...next };
      rebuildInk(content);
    },
    setStock(partial) {
      stock = { ...stock, ...partial };
      applyStock();
    },
    setInk(partial) {
      ink = { ...ink, ...partial };
      applyInkParams();
    },
    setTypeScale(scale) {
      typeScale = Math.max(0.7, Math.min(1.6, Number(scale) || 1));
      card.style.setProperty("--print-scale", String(typeScale));
    },
    setInkColor(color) {
      if (color) card.style.setProperty("--ink-color", color);
    },
    setBackFont(id) {
      applyBackFont(id);
    },
    /** true = locked print effects; false = flat digital ink on same paper */
    setTextEffects(on) {
      ink = {
        ...ink,
        ...(on
          ? {
              grain: LOCKED_INK.grain,
              absorption: LOCKED_INK.absorption,
              relief: LOCKED_INK.relief,
            }
          : { grain: 0, absorption: 0, relief: 0 }),
        density: ink.density || LOCKED_INK.density,
      };
      applyInkParams();
    },
    /** true = tooth / surface light map; false = flat paper color only */
    setPaperGrain(on) {
      applyPaperGrain(on);
    },
    realign: alignInkMaps,
    dispose() {
      ro.disconnect();
    },
  };
}

/** Normalize fall-lab card data → printed content shape. */
export function toPrintContent(data) {
  if (data.lines || data.name) {
    return {
      phone: data.phone ?? "",
      company: data.company ?? "",
      division: data.division ?? "",
      name: data.name ?? "",
      title: data.title ?? data.role ?? "",
      lines: data.lines ?? [],
    };
  }
  return {
    phone: data.right ?? "",
    company: data.company ?? "",
    division: "",
    name: data.name ?? "",
    title: data.role ?? "",
    lines: data.left ? [data.left] : [],
  };
}
