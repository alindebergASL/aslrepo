(function () {
  "use strict";

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Current-year stamp in footer
  var yearTargets = document.querySelectorAll("[data-current-year]");
  var currentYear = new Date().getFullYear();
  yearTargets.forEach(function (target) {
    target.textContent = String(currentYear);
  });

  // Scroll-reveal: mark eligible elements then observe them
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
    elements.forEach(function (el) {
      el.classList.add("reveal");
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
      observer.observe(el);
    });
  }

  // Reading-progress bar (only on pages with .article-body)
  function setupReadingProgress() {
    var body = document.querySelector(".article-body");
    if (!body) return;

    var bar = document.createElement("div");
    bar.className = "read-progress";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Reading progress");
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var rect = body.getBoundingClientRect();
      var viewport = window.innerHeight || document.documentElement.clientHeight;
      var total = Math.max(1, rect.height - viewport);
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var pct = scrolled / total;
      bar.style.transform = "scaleX(" + pct.toFixed(4) + ")";
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  // Tag filter on the writing index page
  function setupTagFilter() {
    var filter = document.querySelector(".tag-filter");
    if (!filter) return;

    var cards = document.querySelectorAll(".article-list .article-card");
    if (!cards.length) return;

    // Collect tag set from card data-tags
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

    filter.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-tag]");
      if (!btn) return;
      var selected = btn.getAttribute("data-tag");
      filter.querySelectorAll("button[data-tag]").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      cards.forEach(function (card) {
        var cardTags = (card.getAttribute("data-tags") || "").split(/\s+/);
        var match = selected === "*" || cardTags.indexOf(selected) !== -1;
        card.classList.toggle("is-hidden", !match);
      });
    });
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
