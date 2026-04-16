import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_THEME_KEY = "founders-theme";
const STORAGE_CODE_UNLOCKED_KEY = "founders-discount-unlocked";
const STORAGE_DAILY_FAILURES_KEY = "founders-game-daily-failures";
const MAX_DAILY_GAME_FAILURES = 3;
const DISCOUNT_CODE = "FOUNDERS20";
const STORAGE_BEAN_TOKENS_KEY = "founders-bean-tokens";
const STORAGE_BEAN_HOLDINGS_KEY = "founders-bean-holdings";
const STORAGE_BEAN_WEEK_KEY = "founders-bean-week";
const WEEKLY_BEAN_ALLOCATION = 1000;
const ROUND_SETTINGS = [
  { size: 4, targetCount: 6, previewMs: 3000 },
  { size: 5, targetCount: 8, previewMs: 2500 },
  { size: 5, targetCount: 10, previewMs: 2000 },
];

/** How long the fail animation runs before the selection clears */
const FAIL_SEQUENCE_MS = 920;
/** How long the “try again” hint stays after a miss */
const FAIL_FEEDBACK_MS = 3400;

const MENU_ITEMS = [
  { name: "Espresso", price: "$4.50", description: "Bold and smooth single-origin shot." },
  { name: "Cappuccino", price: "$5.80", description: "Balanced milk foam with nutty notes." },
  { name: "Oat Latte", price: "$6.20", description: "Creamy oat texture with caramel finish." },
  { name: "Matcha", price: "$5.90", description: "Ceremonial-grade matcha, lightly sweet." },
];

const BEAN_STOCKS = [
  { id: "single-origin", name: "Single-Origin Signals", basePrice: 42 },
  { id: "oat-latte", name: "Oat Latte Index", basePrice: 37 },
  { id: "founder-fuel", name: "Founder Fuel Blend", basePrice: 51 },
  { id: "weekend-slow", name: "Weekend Slow Drip", basePrice: 29 },
];

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function makePattern(size, targetCount) {
  const max = size * size;
  const selected = new Set();
  while (selected.size < targetCount) {
    selected.add(Math.floor(Math.random() * max));
  }
  return Array.from(selected);
}

function getLocalDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekKey() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function readDailyFailures() {
  const today = getLocalDateKey();
  try {
    const raw = localStorage.getItem(STORAGE_DAILY_FAILURES_KEY);
    if (!raw) {
      return { date: today, count: 0 };
    }
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      return { date: today, count: 0 };
    }
    return { date: parsed.date, count: Number(parsed.count) || 0 };
  } catch {
    return { date: today, count: 0 };
  }
}

function recordDailyFailure() {
  const today = getLocalDateKey();
  const prev = readDailyFailures();
  const count = (prev.date === today ? prev.count : 0) + 1;
  localStorage.setItem(STORAGE_DAILY_FAILURES_KEY, JSON.stringify({ date: today, count }));
  return count;
}

function clearDailyFailuresStorage() {
  const today = getLocalDateKey();
  localStorage.setItem(STORAGE_DAILY_FAILURES_KEY, JSON.stringify({ date: today, count: 0 }));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

function buildInitialPriceHistory() {
  return Object.fromEntries(
    BEAN_STOCKS.map((stock) => [stock.id, Array.from({ length: 12 }, () => stock.basePrice)]),
  );
}

function App() {
  const [theme, setTheme] = useState("system");
  const [effectiveTheme, setEffectiveTheme] = useState("dark");
  const [gameState, setGameState] = useState("idle");
  const [currentRound, setCurrentRound] = useState(1);
  const [targetPattern, setTargetPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState("idle");
  const [fallbackEmail, setFallbackEmail] = useState("");
  const [fallbackPhone, setFallbackPhone] = useState("");
  const [fallbackStatus, setFallbackStatus] = useState("idle");
  const [dailyFailures, setDailyFailures] = useState(() => readDailyFailures().count);
  const [codeUnlocked, setCodeUnlocked] = useState(false);
  const [gameFeedback, setGameFeedback] = useState(null);
  const [failSequence, setFailSequence] = useState(false);
  const [manualContactOpen, setManualContactOpen] = useState(false);
  const [beanTokens, setBeanTokens] = useState(WEEKLY_BEAN_ALLOCATION);
  const [beanHoldings, setBeanHoldings] = useState({});
  const [beanPrices, setBeanPrices] = useState(
    () =>
      Object.fromEntries(
        BEAN_STOCKS.map((stock) => [stock.id, stock.basePrice]),
      ),
  );
  const [beanHistory, setBeanHistory] = useState(() => buildInitialPriceHistory());
  const [exchangeOpen, setExchangeOpen] = useState(false);

  const modalRef = useRef(null);
  const exchangeCloseRef = useRef(null);
  const appShellRef = useRef(null);
  const closeBtnRef = useRef(null);
  const launchBtnRef = useRef(null);
  const previousFocusRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const copyResetRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const lockAfterFailRef = useRef(false);

  const roundConfig = useMemo(() => ROUND_SETTINGS[currentRound - 1], [currentRound]);

  const gameLockedOut = dailyFailures >= MAX_DAILY_GAME_FAILURES && !codeUnlocked;

  const revealContactCTA =
    manualContactOpen || gameLockedOut || gameState === "won" || codeUnlocked;

  const showContactTeaser =
    !manualContactOpen && !gameLockedOut && gameState !== "won" && !codeUnlocked;

  const emailGetsModalRestoreRef =
    revealContactCTA && (gameLockedOut || gameState === "won");

  const totalBeanValue = useMemo(() => {
    return Object.entries(beanHoldings).reduce((sum, [id, amount]) => {
      const price = beanPrices[id] ?? 0;
      return sum + amount * price;
    }, 0);
  }, [beanHoldings, beanPrices]);

  const topBeanLeaders = useMemo(() => {
    return [...BEAN_STOCKS]
      .map((stock) => ({
        ...stock,
        held: Number(beanHoldings[stock.id] || 0),
        price: beanPrices[stock.id] ?? stock.basePrice,
      }))
      .sort((a, b) => b.held - a.held || b.price - a.price);
  }, [beanHoldings, beanPrices]);

  const marketChartData = useMemo(() => {
    const colors = ["#b77b3f", "#3f7a6b", "#c8563d", "#6b5bd2"];
    const entries = topBeanLeaders.slice(0, 4).map((stock, index) => {
      const history = beanHistory[stock.id] || [stock.basePrice];
      const min = Math.min(...history);
      const max = Math.max(...history);
      const range = Math.max(1, max - min);
      const points = history
        .map((value, pointIndex) => {
          const x = (pointIndex / Math.max(1, history.length - 1)) * 100;
          const y = 100 - ((value - min) / range) * 100;
          return `${x},${y}`;
        })
        .join(" ");

      return {
        ...stock,
        color: colors[index],
        points,
      };
    });

    return entries;
  }, [beanHistory, topBeanLeaders]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      setTheme(savedTheme);
    }

    const isUnlocked = localStorage.getItem(STORAGE_CODE_UNLOCKED_KEY) === "true";
    setCodeUnlocked(isUnlocked);
  }, []);

  useEffect(() => {
    const currentWeek = getWeekKey();
    const storedWeek = localStorage.getItem(STORAGE_BEAN_WEEK_KEY);
    const shouldReset = storedWeek !== currentWeek;

    const storedTokens = shouldReset
      ? WEEKLY_BEAN_ALLOCATION
      : Number(localStorage.getItem(STORAGE_BEAN_TOKENS_KEY) || WEEKLY_BEAN_ALLOCATION);

    const storedHoldings = shouldReset
      ? {}
      : (() => {
          try {
            const raw = localStorage.getItem(STORAGE_BEAN_HOLDINGS_KEY);
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {};
          }
        })();

    setBeanTokens(storedTokens);
    setBeanHoldings(storedHoldings);
    localStorage.setItem(STORAGE_BEAN_WEEK_KEY, currentWeek);
    localStorage.setItem(STORAGE_BEAN_TOKENS_KEY, String(storedTokens));
    localStorage.setItem(STORAGE_BEAN_HOLDINGS_KEY, JSON.stringify(storedHoldings));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBeanPrices((prev) => {
        const next = { ...prev };
        BEAN_STOCKS.forEach((stock) => {
          const current = prev[stock.id] ?? stock.basePrice;
          const delta = (Math.random() - 0.5) * 2; // -1 to +1
          const candidate = Math.max(10, Math.min(99, Math.round(current + delta)));
          next[stock.id] = candidate;
        });
        return next;
      });
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setBeanHistory((prev) => {
      const next = { ...prev };
      BEAN_STOCKS.forEach((stock) => {
        const currentHistory = prev[stock.id] || [stock.basePrice];
        next[stock.id] = [...currentHistory.slice(-11), beanPrices[stock.id] ?? stock.basePrice];
      });
      return next;
    });
  }, [beanPrices]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => setEffectiveTheme(theme === "system" ? getSystemTheme() : theme);
    updateTheme();
    if (media.addEventListener) {
      media.addEventListener("change", updateTheme);
      return () => media.removeEventListener("change", updateTheme);
    }
    media.addListener(updateTheme);
    return () => media.removeListener(updateTheme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (!exchangeOpen) {
      return undefined;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => {
      exchangeCloseRef.current?.focus();
    });
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setExchangeOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(id);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [exchangeOpen]);

  useEffect(() => {
    if (!showModal) {
      return undefined;
    }
    previousFocusRef.current = document.activeElement;
    closeBtnRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCloseModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = modalRef.current?.querySelectorAll(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (modalRef.current && !modalRef.current.contains(current)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showModal]);

  useEffect(() => {
    if (gameState !== "preview") {
      return undefined;
    }

    previewTimeoutRef.current = setTimeout(() => {
      setGameState("input");
    }, roundConfig.previewMs);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [gameState, roundConfig.previewMs]);

  useEffect(() => {
    if (copyStatus === "idle") {
      return undefined;
    }
    copyResetRef.current = setTimeout(() => {
      setCopyStatus("idle");
    }, 2000);

    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
    };
  }, [copyStatus]);

  useEffect(() => {
    if (!failSequence) {
      return undefined;
    }
    const clearSelection = window.setTimeout(() => {
      setUserPattern([]);
      setFailSequence(false);
      if (lockAfterFailRef.current) {
        lockAfterFailRef.current = false;
        setGameState("idle");
        setCurrentRound(1);
        setTargetPattern([]);
      }
    }, FAIL_SEQUENCE_MS);
    return () => window.clearTimeout(clearSelection);
  }, [failSequence]);

  useEffect(() => {
    if (gameFeedback !== "wrong") {
      return undefined;
    }
    const clearHint = window.setTimeout(() => setGameFeedback(null), FAIL_FEEDBACK_MS);
    return () => window.clearTimeout(clearHint);
  }, [gameFeedback]);

  useEffect(() => {
    if (!appShellRef.current) {
      return;
    }

    if (showModal) {
      appShellRef.current.setAttribute("aria-hidden", "true");
      appShellRef.current.inert = true;
    } else {
      appShellRef.current.removeAttribute("aria-hidden");
      appShellRef.current.inert = false;
    }
  }, [showModal]);

  useEffect(() => {
    if (!showModal && restoreFocusRef.current) {
      requestAnimationFrame(() => {
        restoreFocusRef.current?.focus?.();
        restoreFocusRef.current = null;
      });
    }
  }, [showModal]);

  function handleThemeToggle() {
    setTheme((current) => {
      if (current === "system") return "light";
      if (current === "light") return "dark";
      return "system";
    });
  }

  function handleStartGame() {
    if (gameLockedOut) {
      return;
    }
    setGameFeedback(null);
    setFailSequence(false);
    setCurrentRound(1);
    const nextPattern = makePattern(ROUND_SETTINGS[0].size, ROUND_SETTINGS[0].targetCount);
    setTargetPattern(nextPattern);
    setUserPattern([]);
    setGameState("preview");
  }

  function evaluatePattern(pattern) {
    const isMatch =
      pattern.every((cell) => targetPattern.includes(cell)) &&
      targetPattern.every((cell) => pattern.includes(cell));

    if (!isMatch) {
      const failCount = recordDailyFailure();
      setDailyFailures(failCount);
      if (failCount >= MAX_DAILY_GAME_FAILURES) {
        lockAfterFailRef.current = true;
      }
      setFailSequence(true);
      setGameFeedback(null);
      queueMicrotask(() => setGameFeedback("wrong"));
      return;
    }

    if (currentRound === ROUND_SETTINGS.length) {
      clearDailyFailuresStorage();
      setDailyFailures(0);
      setGameState("won");
      setCodeUnlocked(true);
      localStorage.setItem(STORAGE_CODE_UNLOCKED_KEY, "true");
      setShowModal(true);
      return;
    }

    const nextRound = currentRound + 1;
    const nextConfig = ROUND_SETTINGS[nextRound - 1];
    setCurrentRound(nextRound);
    setTargetPattern(makePattern(nextConfig.size, nextConfig.targetCount));
    setUserPattern([]);
    setGameState("preview");
  }

  function handleCellToggle(index) {
    if (gameState !== "input" || failSequence) {
      return;
    }
    setUserPattern((current) => {
      let next;
      if (current.includes(index)) {
        next = current.filter((item) => item !== index);
      } else if (current.length >= roundConfig.targetCount) {
        return current;
      } else {
        next = [...current, index];
      }
      if (next.length === roundConfig.targetCount) {
        queueMicrotask(() => evaluatePattern(next));
      }
      return next;
    });
  }

  function handleFallbackUnlock(event) {
    event.preventDefault();
    const email = fallbackEmail.trim();
    const phone = fallbackPhone.trim();
    const emailOk = email.length > 0 && isValidEmail(email);
    const phoneOk = phone.length > 0 && isValidPhone(phone);
    if (!emailOk && !phoneOk) {
      setFallbackStatus("error");
      return;
    }
    setFallbackStatus("success");
    setCodeUnlocked(true);
    localStorage.setItem(STORAGE_CODE_UNLOCKED_KEY, "true");
    setShowModal(true);
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      setCopyStatus("success");
    } catch (_error) {
      setCopyStatus("error");
    }
  }

  async function handleShareCode() {
    const message = `I unlocked ${DISCOUNT_CODE} at Founders Cafe.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Founders Cafe Discount", text: message });
        return;
      } catch (_error) {
        // noop: user cancelled or share failed
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("shared");
    } catch (_error) {
      setCopyStatus("error");
    }
  }

  function updateBeanStorage(nextTokens, nextHoldings) {
    setBeanTokens(nextTokens);
    setBeanHoldings(nextHoldings);
    localStorage.setItem(STORAGE_BEAN_TOKENS_KEY, String(nextTokens));
    localStorage.setItem(STORAGE_BEAN_HOLDINGS_KEY, JSON.stringify(nextHoldings));
  }

  function handleBeanTrade(id, delta) {
    setBeanHoldings((currentHoldings) => {
      const currentAmount = Number(currentHoldings[id] || 0);
      if (delta > 0 && beanTokens < delta) {
        return currentHoldings;
      }
      if (delta < 0 && currentAmount + delta < 0) {
        return currentHoldings;
      }
      const nextAmount = currentAmount + delta;
      const nextHoldings = { ...currentHoldings };
      if (nextAmount === 0) {
        delete nextHoldings[id];
      } else {
        nextHoldings[id] = nextAmount;
      }
      const nextTokens = beanTokens - delta;
      updateBeanStorage(nextTokens, nextHoldings);
      return nextHoldings;
    });
  }

  function handleCloseModal() {
    const focusTarget = previousFocusRef.current;
    restoreFocusRef.current = focusTarget && !focusTarget.disabled ? focusTarget : launchBtnRef.current;
    setShowModal(false);
    setCopyStatus("idle");
  }

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetGame() {
    if (gameLockedOut) {
      return;
    }
    setGameState("idle");
    setCurrentRound(1);
    setTargetPattern([]);
    setUserPattern([]);
    setGameFeedback(null);
    setFailSequence(false);
  }

  const boardSize = roundConfig?.size ?? 4;
  const totalCells = boardSize * boardSize;

  return (
    <>
      <div ref={appShellRef}>
        <header className="site-header">
        <div className="container header-inner">
          <a className="logo-link" href="#hero" aria-label="Founders Cafe — home">
            <svg className="logo-mark" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <use href="#logo-founders-cafe" />
            </svg>
            <span className="logo-text">Founders Cafe</span>
          </a>
          <nav className="header-nav" aria-label="Main">
            <a href="#menu">Menu</a>
            <a href="#info">Info</a>
            <a href="#game">Rewards</a>
          </nav>
          <button
            type="button"
            className="theme-toggle"
            onClick={handleThemeToggle}
            aria-label={`Color theme: ${theme}. Click to cycle system, light, and dark.`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <use href={effectiveTheme === "dark" ? "#icon-theme-dark" : "#icon-theme-light"} />
            </svg>
          </button>
        </div>
        </header>

        <main>
        <section id="hero" className="hero">
          <div className="container hero-inner">
            <div className="hero-content">
              <p className="hero-kicker">Purpose-built workspace cafe</p>
              <h1>Brew crafted for founders.</h1>
              <p>
                Intentional coffee, minimal distractions, and a game-driven reward
                you can unlock in minutes.
              </p>
              <div className="hero-actions">
                <button type="button" className="primary-btn" onClick={() => scrollToSection("menu")}>
                  Explore Deals
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <use href="#icon-arrow-right" />
                  </svg>
                </button>
                <button type="button" className="ghost-btn" onClick={() => scrollToSection("game")}>
                  Unlock 20% off
                </button>
              </div>
              <div className="hero-trust" aria-label="Cafe highlights">
                <p>Fast Wi-Fi</p>
                <p>Quiet focus zones</p>
                <p>Power-friendly seating</p>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="100%" height="100%">
                <use href="#logo-founders-cafe" />
              </svg>
            </div>
          </div>
        </section>

        <section id="menu" className="section">
          <div className="container">
            <div className="section-head">
              <p className="section-kicker">Signature lineup</p>
              <h2>The menu, always in motion.</h2>
              <p className="section-copy">
                Focused drinks, clean flavors, and no fluff. We rotate beans and specials
                based on what founders are actually ordering — think of this as the
                current release of the cafe.
              </p>
            </div>
            <div className="menu-grid">
              {MENU_ITEMS.map((item, i) => (
                <article
                  className="menu-card"
                  key={item.name}
                  data-index={String(i + 1).padStart(2, "0")}
                >
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="menu-footer">
                    <span className="menu-price">{item.price}</span>
                    <span className="menu-note">Current pour</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="menu-bridge">
              <button type="button" className="text-btn menu-bridge-btn" onClick={() => setExchangeOpen(true)}>
                See how beans are trading today
              </button>
              <span className="menu-bridge-sep" aria-hidden="true">
                ·
              </span>
              <a className="text-btn" href="#info">
                Hours & location
              </a>
            </div>
          </div>
        </section>

        <section id="info" className="section">
          <div className="container info-wrap">
            <div className="section-head">
              <p className="section-kicker">Plan your focus session</p>
              <h2>Everything before you drop in.</h2>
              <p className="section-copy">
                Opening windows, the exact location, and the work atmosphere you
                can expect — all in one glance.
              </p>
            </div>
            <div className="info-grid">
              <article className="info-card">
                <span className="info-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <use href="#icon-clock" />
                  </svg>
                </span>
                <h3>Hours</h3>
                <p className="info-detail">Predictable hours for weekday builders and weekend deep-work sessions.</p>
                <ul className="info-list" aria-label="Opening hours">
                  <li>
                    <span>Mon-Fri</span>
                    <strong>7:00-18:00</strong>
                  </li>
                  <li>
                    <span>Sat-Sun</span>
                    <strong>8:00-17:00</strong>
                  </li>
                </ul>
              </article>
              <article className="info-card">
                <span className="info-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <use href="#icon-location" />
                  </svg>
                </span>
                <h3>Location</h3>
                <p className="info-detail">Central to the Innovation District, with easy access for quick meetings.</p>
                <p className="info-address">123 Founder Lane, Innovation District</p>
                <p className="info-meta">Two blocks from Metro Center and open street parking after 10am.</p>
              </article>
              <article className="info-card">
                <span className="info-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <use href="#icon-info" />
                  </svg>
                </span>
                <h3>About</h3>
                <p className="info-detail">Built for builders: precise coffee, fast service, and a focus-friendly pace.</p>
                <div className="info-badges" aria-label="Cafe highlights">
                  <span>Fast Wi-Fi</span>
                  <span>Quiet corners</span>
                  <span>Power at most tables</span>
                </div>
              </article>
            </div>
            <p className="info-game-nudge">
              <a className="text-btn" href="#game">
                Keep scrolling — there's a reward below →
              </a>
            </p>
          </div>
        </section>

        <section id="game" className="section section-game-end" aria-labelledby="game-heading">
          <div className="container section-game-end-inner">
            <div className="section-head">
              <p className="section-kicker">Pattern Master</p>
              <h2 id="game-heading">Earn 20% off in 3 rounds.</h2>
              <p className="section-copy section-game-copy">
                Match the pattern 3 times to unlock your code. {MAX_DAILY_GAME_FAILURES} misses
                per day, then the email/phone form slides open for the same reward.
              </p>
            </div>

            <div className="game-controls">
              <p className="round-pill">
                {gameLockedOut
                  ? "No pattern tries left today"
                  : codeUnlocked
                    ? "Discount unlocked"
                    : gameState === "idle"
                      ? `${Math.max(0, MAX_DAILY_GAME_FAILURES - dailyFailures)} tries left today`
                      : `Round ${currentRound} of 3 · ${Math.max(0, MAX_DAILY_GAME_FAILURES - dailyFailures)} tries left today`}
              </p>
              {gameState !== "idle" && !gameLockedOut && (
                <button ref={launchBtnRef} type="button" className="text-btn" onClick={resetGame}>
                  Start over
                </button>
              )}
            </div>

            <div className="game-status" role="status" aria-live="polite">
              {gameFeedback === "wrong" && !failSequence && "Not quite — try again."}
              {gameLockedOut &&
                !failSequence &&
                "Today’s game turns are used up — come back tomorrow to try again. If you still want the code today, use the form that opened below."}
              {gameFeedback !== "wrong" && !failSequence && gameState === "idle" && !gameLockedOut && "Tap the grid to begin."}
              {gameFeedback !== "wrong" && !failSequence && gameState === "preview" && "Watch the highlighted pattern."}
              {gameFeedback !== "wrong" && !failSequence && gameState === "input" && "Tap cells to match the pattern."}
              {gameFeedback !== "wrong" && !failSequence && gameState === "won" && "Great memory. Your discount is ready."}
            </div>

            {failSequence && (
              <p className="fail-banner" role="alert">
                <span className="fail-banner-mark" aria-hidden="true">
                  ×
                </span>
                {dailyFailures >= MAX_DAILY_GAME_FAILURES
                  ? "That was your last try for today — the form below is there if you still want the discount."
                  : "Doesn’t match — your picks flash, then clear."}
              </p>
            )}

            <div className="game-panel">
              <div className="game-board-stage">
                <div className="game-board-wrap">
                  <div
                    className={`game-board ${failSequence ? "game-board--fail" : ""}`}
                    style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
                    aria-label={`Pattern grid ${boardSize} by ${boardSize}`}
                  >
                    {Array.from({ length: totalCells }).map((_, index) => {
                      const inTarget = targetPattern.includes(index);
                      const inUser = userPattern.includes(index);
                      const showTarget = gameState === "preview" && inTarget;
                      const selected = gameState !== "preview" && inUser;
                      const failReveal = failSequence && inUser;
                      const staggerMs = failReveal ? userPattern.indexOf(index) * 48 : 0;
                      return (
                        <button
                          key={index}
                          type="button"
                          className={`grid-cell ${showTarget ? "target" : ""} ${selected ? "selected" : ""} ${failReveal ? "fail-reveal" : ""}`}
                          style={
                            failReveal
                              ? { ["--fail-stagger"]: `${staggerMs}ms` }
                              : undefined
                          }
                          onClick={() => handleCellToggle(index)}
                          disabled={gameState !== "input" || failSequence}
                          aria-pressed={selected}
                          aria-label={`Grid cell ${index + 1}`}
                        />
                      );
                    })}
                  </div>
                  {gameState === "idle" && !gameLockedOut && (
                    <button
                      type="button"
                      className="game-start-overlay"
                      ref={launchBtnRef}
                      onClick={handleStartGame}
                      aria-label="Start pattern challenge"
                    >
                      <span className="game-start-label">Tap to start</span>
                      <span className="game-start-hint">3 rounds — match the pattern</span>
                    </button>
                  )}
                  {gameState === "idle" && gameLockedOut && (
                    <div className="game-start-overlay game-start-overlay--locked" role="status">
                      <span className="game-start-label">No tries left today</span>
                      <span className="game-start-hint">
                        The pattern didn’t work out this time — that happens. You can play again tomorrow. If you
                        still want today’s discount, the contact form below is for that.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {codeUnlocked && !showModal && (
                <p className="game-unlock-footer">
                  <button type="button" className="text-btn" onClick={() => setShowModal(true)}>
                    Show discount code
                  </button>
                </p>
              )}

              {showContactTeaser && (
                <button
                  type="button"
                  className="fallback-teaser"
                  onClick={() => setManualContactOpen(true)}
                >
                  Get the code by email or phone instead
                </button>
              )}

              {revealContactCTA && (
                <div className="fallback-drawer-surface">
                  <form className="fallback fallback--enter" onSubmit={handleFallbackUnlock}>
                    <h3>
                      {gameState === "won"
                        ? "You won — claim your code"
                        : gameLockedOut
                          ? "Still want today’s discount?"
                          : codeUnlocked
                            ? "Your discount"
                            : "Get the code by email or phone"}
                    </h3>
                    <p>
                      {gameState === "won"
                        ? "Drop your email or phone and we’ll send the code (or use the buttons in the popup you just saw)."
                        : gameLockedOut
                          ? "The game is done for today, but you can still get the same code here — no shame in tapping out."
                          : codeUnlocked
                            ? "You’re already unlocked. Your code is available above or in the modal."
                            : "Same discount as the game — pick one way to reach you."}
                    </p>
                    <div className="fallback-fields">
                      <label className="fallback-field">
                        <span className="fallback-label">Email</span>
                        <input
                          id="fallback-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          value={fallbackEmail}
                          ref={emailGetsModalRestoreRef ? launchBtnRef : undefined}
                          onChange={(event) => {
                            setFallbackEmail(event.target.value);
                            setFallbackStatus("idle");
                          }}
                        />
                      </label>
                      <span className="fallback-or" aria-hidden="true">
                        or
                      </span>
                      <label className="fallback-field">
                        <span className="fallback-label">Phone</span>
                        <input
                          id="fallback-phone"
                          type="tel"
                          autoComplete="tel"
                          inputMode="tel"
                          placeholder="(555) 123-4567"
                          value={fallbackPhone}
                          onChange={(event) => {
                            setFallbackPhone(event.target.value);
                            setFallbackStatus("idle");
                          }}
                        />
                      </label>
                    </div>
                    <button className="ghost-btn fallback-submit" type="submit">
                      Send me the code
                    </button>
                    {fallbackStatus === "error" && (
                      <p className="error-text">Enter a valid email or a phone number with at least 10 digits.</p>
                    )}
                    {fallbackStatus === "success" && (
                      <p className="success-text">You’re in. Your code is ready.</p>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        </main>

        <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-top">
            <a className="footer-brand" href="#hero" aria-label="Founders Cafe — back to top">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#logo-founders-cafe" />
              </svg>
              <span>Founders Cafe</span>
            </a>
            <nav className="footer-nav" aria-label="Footer links">
              <a href="#menu">Menu</a>
              <a href="#info">Info</a>
              <a href="#game">Rewards</a>
            </nav>
            <div className="social-links">
              <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <use href="#icon-instagram" />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <use href="#icon-twitter" />
                </svg>
              </a>
              <a href="mailto:hello@founders.cafe" aria-label="Email">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <use href="#icon-mail" />
                </svg>
              </a>
            </div>
          </div>
          <div className="footer-legal" aria-label="Policies and help">
            <section id="terms" className="footer-legal-block">
              <h3 className="footer-legal-title">Terms</h3>
              <p>Use policy and ordering terms are summarized for transparency.</p>
            </section>
            <section id="privacy" className="footer-legal-block">
              <h3 className="footer-legal-title">Privacy</h3>
              <p>We only store the minimum preference and unlock data needed for your experience.</p>
            </section>
            <section id="faq" className="footer-legal-block">
              <h3 className="footer-legal-title">FAQ</h3>
              <p>Discount code applies once per checkout and can be unlocked via game or fallback path.</p>
            </section>
          </div>
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} Founders Cafe. Brewed with intention.</p>
            <p className="copyright">Made for makers.</p>
          </div>
        </div>
        </footer>
      </div>

      {exchangeOpen && (
        <div className="exchange-overlay" role="presentation">
          <button
            type="button"
            className="exchange-backdrop"
            aria-label="Close bean exchange"
            onClick={() => setExchangeOpen(false)}
          >
            <span className="sr-only">Close</span>
          </button>
          <div
            className="exchange-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exchange-panel-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={exchangeCloseRef}
              className="exchange-close"
              type="button"
              aria-label="Close bean exchange"
              onClick={() => setExchangeOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <use href="#icon-close" />
              </svg>
            </button>
            <div className="exchange-panel-inner">
              <div className="exchange-panel-left">
                <p className="section-kicker">For fun</p>
                <h2 id="exchange-panel-title">Bean exchange</h2>
                <p className="exchange-panel-lead">
                  <strong>{WEEKLY_BEAN_ALLOCATION}</strong> points per week · live prices · your votes only — no checkout.
                </p>
                <div className="exchange-summary exchange-summary--compact">
                  <p>
                    <span className="exchange-label">Unallocated</span>
                    <span className="exchange-value">{beanTokens}</span>
                  </p>
                  <p>
                    <span className="exchange-label">Portfolio</span>
                    <span className="exchange-value">
                      {totalBeanValue.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </p>
                </div>
                <ul className="exchange-trade-list" aria-label="Trade bean votes">
                  {BEAN_STOCKS.map((stock) => {
                    const price = beanPrices[stock.id] ?? stock.basePrice;
                    const held = Number(beanHoldings[stock.id] || 0);
                    return (
                      <li key={stock.id} className="exchange-trade-row">
                        <div className="exchange-trade-meta">
                          <span className="exchange-trade-name">{stock.name}</span>
                          <span className="exchange-trade-sub">
                            {price} pts spot · {held} pts held
                          </span>
                        </div>
                        <div className="exchange-trade-actions">
                          <button
                            type="button"
                            className="ghost-btn exchange-btn-sm"
                            onClick={() => handleBeanTrade(stock.id, -50)}
                            disabled={held < 50}
                            aria-label={`Sell 50 points of ${stock.name}`}
                          >
                            −50
                          </button>
                          <button
                            type="button"
                            className="primary-btn exchange-btn-sm"
                            onClick={() => handleBeanTrade(stock.id, 50)}
                            disabled={beanTokens < 50}
                            aria-label={`Buy 50 points of ${stock.name}`}
                          >
                            +50
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="exchange-note exchange-note--compact">
                  Top vote this week shapes next week’s lineup. Data stays on this device.
                </p>
              </div>
              <div className="exchange-panel-right" aria-label="Live bean market chart">
                <p className="exchange-chart-kicker">Live race · top four</p>
                <p className="exchange-chart-tagline">Strongest line wins a slot on next week’s menu.</p>
                <div className="exchange-chart-wrap">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="exchange-chart exchange-chart--featured"
                    role="img"
                    aria-label="Live bean market line graph"
                  >
                    <path d="M0 10H100M0 35H100M0 60H100M0 85H100" className="exchange-chart-grid" />
                    {marketChartData.map((line) => (
                      <polyline
                        key={line.id}
                        points={line.points}
                        fill="none"
                        stroke={line.color}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </svg>
                </div>
                <div className="exchange-legend exchange-legend--inline">
                  {marketChartData.map((line) => (
                    <div key={line.id} className="exchange-legend-chip">
                      <span className="exchange-legend-dot" style={{ backgroundColor: line.color }} aria-hidden="true" />
                      <span className="exchange-legend-name">{line.name}</span>
                      <span className="exchange-legend-meta">{line.held}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showModal || codeUnlocked) && (
        <section className={`modal-layer ${showModal ? "open" : ""}`} aria-hidden={!showModal}>
          {showModal && <div className="backdrop" onClick={handleCloseModal} />}
          {showModal && (
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="discount-title" ref={modalRef}>
              <button
                ref={closeBtnRef}
                className="close-btn"
                type="button"
                aria-label="Close discount modal"
                onClick={handleCloseModal}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <use href="#icon-close" />
                </svg>
              </button>
              <h3 id="discount-title">Your discount is ready.</h3>
              <p className="modal-subtitle">Use this code at checkout for 20% off your next order.</p>
              <p className="code-box">{DISCOUNT_CODE}</p>
              <div className="modal-actions">
                <button className="primary-btn" type="button" onClick={handleCopyCode}>
                  {copyStatus === "success" ? "Copied" : "Copy Code"}
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                    <use href={copyStatus === "success" ? "#icon-check" : "#icon-copy"} />
                  </svg>
                </button>
                <button className="ghost-btn" type="button" onClick={handleShareCode}>
                  Share
                </button>
                <button className="ghost-btn" type="button" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
              {copyStatus === "success" && <p className="success-text">Copied to clipboard.</p>}
              {copyStatus === "shared" && (
                <p className="success-text">Share text copied. Paste it anywhere to share.</p>
              )}
              {copyStatus === "error" && (
                <p className="error-text">Clipboard blocked. Select and copy the code manually.</p>
              )}
            </div>
          )}
        </section>
      )}

      <svg style={{ display: "none" }} aria-hidden="true">
        <defs>
          {/* Founders Cafe logo — F + coffee cup fusion (Option A) */}
          <symbol id="logo-founders-cafe" viewBox="0 0 24 24">
            {/* steam dots */}
            <circle cx="10" cy="3.5" r="0.6" fill="currentColor" />
            <circle cx="12" cy="2.4" r="0.6" fill="currentColor" />
            <circle cx="14" cy="3.5" r="0.6" fill="currentColor" />
            {/* cup body — trapezoid */}
            <path
              d="M6 7h11 M6 7v9a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* handle */}
            <path
              d="M17 10a2.5 2.5 0 0 1 0 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* F crossbar — subtle integration */}
            <line
              x1="6"
              y1="11"
              x2="10"
              y2="11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />
          </symbol>
          <symbol id="icon-arrow-right" viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </symbol>
          <symbol id="icon-theme-light" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-theme-dark" viewBox="0 0 24 24">
            <path d="M21 13a8.5 8.5 0 1 1-10-10 7 7 0 0 0 10 10z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-chevron-down" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-copy" viewBox="0 0 24 24">
            <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="4" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-check" viewBox="0 0 24 24">
            <path d="M20 7 10 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </symbol>
          <symbol id="icon-close" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-clock" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-location" viewBox="0 0 24 24">
            <path d="M12 22s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-info" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
          <symbol id="icon-instagram" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="17" cy="7" r="1.2" fill="currentColor" />
          </symbol>
          <symbol id="icon-twitter" viewBox="0 0 24 24">
            <path d="M4 4h4l4 5 4-5h4l-6 8 6 8h-4l-4-5-4 5H4l6-8z" fill="currentColor" />
          </symbol>
          <symbol id="icon-mail" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </symbol>
        </defs>
      </svg>
    </>
  );
}

export default App;
