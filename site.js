(function () {
  "use strict";

  var docEl = document.documentElement;
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mark the document as JS-enabled. This is what gates the reveal-hide
  // CSS rules — without this class the .reveal opacity-0 state never
  // applies, so content stays visible if JS fails to load or run.
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    docEl.classList.add("js");
  }

  // Current-year stamp in footer
  var yearTargets = document.querySelectorAll("[data-current-year]");
  var currentYear = new Date().getFullYear();
  yearTargets.forEach(function (target) {
    target.textContent = String(currentYear);
  });

  function setupReveal() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

    var selectors = [
      ".hero-copy",
      ".signal-panel",
      ".split-section > *",
      ".section-heading",
      ".card-grid > *",
      ".feature-article",
      ".contact-panel",
      ".currently-panel",
      ".article-card",
      ".article-header",
      ".article-body > *"
    ];

    var elements = document.querySelectorAll(selectors.join(","));
    if (!elements.length) return;

    var viewport = window.innerHeight || docEl.clientHeight || 0;

    elements.forEach(function (el) {
      el.classList.add("reveal");
      // Any element already on screen (or just below the fold) shows
      // immediately. This prevents an above-the-fold flash and means the
      // observer only has to handle genuinely off-screen content.
      var rect = el.getBoundingClientRect();
      if (rect.top < viewport * 1.1) {
        el.classList.add("is-visible");
      }
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    elements.forEach(function (el) {
      if (!el.classList.contains("is-visible")) {
        observer.observe(el);
      }
    });

    // Safety net: if anything is still hidden 1.2s after load (e.g. a
    // browser quirk or layout shift kept it off the observer), reveal it.
    window.setTimeout(function () {
      elements.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }, 1200);
  }

  function setupReadingProgress() {
    var body = document.querySelector(".article-body");
    if (!body) return;

    var bar = document.createElement("div");
    bar.className = "read-progress";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Reading progress");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", "0");
    document.body.appendChild(bar);

    function clamp(v, lo, hi) {
      return v < lo ? lo : v > hi ? hi : v;
    }

    // Walk the offsetParent chain to get the article body's absolute top
    // in document coordinates. Cached and recomputed on resize / load so
    // the scroll handler is a cheap math op instead of a layout read.
    function getOffsetTop(el) {
      var top = 0;
      var n = el;
      while (n) {
        top += n.offsetTop || 0;
        n = n.offsetParent;
      }
      return top;
    }

    var articleTop = 0;
    var articleHeight = 0;

    function measure() {
      articleTop = getOffsetTop(body);
      articleHeight = body.offsetHeight || 0;
    }

    var ticking = false;
    function update() {
      var viewport = window.innerHeight || docEl.clientHeight || 0;
      var start = articleTop - viewport * 0.15;
      var end = articleTop + articleHeight - viewport * 0.85;
      var range = Math.max(1, end - start);
      var scrollY =
        window.scrollY ||
        window.pageYOffset ||
        (document.scrollingElement && document.scrollingElement.scrollTop) ||
        docEl.scrollTop ||
        0;
      var pct = clamp((scrollY - start) / range, 0, 1);
      bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      bar.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
      ticking = false;
    }

    function schedule() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    function onResize() {
      measure();
      schedule();
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", onResize);

    measure();
    update();

    // Web fonts and reveal animations can shift article height shortly
    // after first paint. Re-measure after layout has settled.
    window.setTimeout(onResize, 250);
    window.setTimeout(onResize, 1500);
  }

  function setupTagFilter() {
    var filter = document.querySelector(".tag-filter");
    if (!filter) return;

    var cards = document.querySelectorAll(".article-list .article-card");
    if (!cards.length) return;

    var tagSet = Object.create(null);
    cards.forEach(function (card) {
      var raw = card.getAttribute("data-tags") || "";
      raw.split(/\s+/).forEach(function (t) {
        if (t) tagSet[t] = true;
      });
    });
    var tags = Object.keys(tagSet).sort();

    function makeButton(label, value, pressed) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("data-tag", value);
      b.setAttribute("aria-pressed", pressed ? "true" : "false");
      if (value !== "*") b.id = "filter-" + value;
      return b;
    }

    var label = document.createElement("p");
    label.className = "tag-filter-label";
    label.textContent = "Filter";
    filter.appendChild(label);

    filter.appendChild(makeButton("All", "*", true));
    tags.forEach(function (t) {
      filter.appendChild(makeButton(prettyTag(t), t, false));
    });

    function applyFilter(selected) {
      filter.querySelectorAll("button[data-tag]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-tag") === selected ? "true" : "false");
      });
      cards.forEach(function (card) {
        var cardTags = (card.getAttribute("data-tags") || "").split(/\s+/);
        var match = selected === "*" || cardTags.indexOf(selected) !== -1;
        card.classList.toggle("is-hidden", !match);
      });
    }

    filter.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-tag]");
      if (!btn) return;
      applyFilter(btn.getAttribute("data-tag"));
    });

    // Deep link via ?tag=<slug> (used by footer "Topics" links).
    try {
      var params = new URLSearchParams(window.location.search);
      var deep = params.get("tag");
      if (deep && tagSet[deep]) {
        applyFilter(deep);
      }
    } catch (_) {
      /* URLSearchParams unsupported — leave default filter state */
    }
  }

  function prettyTag(slug) {
    return slug
      .split("-")
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  }

  setupReveal();
  setupReadingProgress();
  setupTagFilter();
})();
