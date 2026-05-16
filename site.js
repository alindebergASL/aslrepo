(function () {
  var yearTargets = document.querySelectorAll("[data-current-year]");
  var currentYear = new Date().getFullYear();

  yearTargets.forEach(function (target) {
    target.textContent = String(currentYear);
  });
})();
