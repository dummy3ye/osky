(function () {
  var nav = document.querySelector('[data-part="nav"]');
  if (nav) {
    nav.outerHTML =
      "<nav>" +
      '<a class="logo" href="/"><img src="/logo.svg" alt="Home"></a>' +
      '<div class="links">' +
      '<a href="/projects">Projects</a>' +
      '<a href="/blog">Blog</a>' +
      '<a href="/now">Now</a>' +
      '<a href="/uses">Uses</a>' +
      '<a href="/contact">Contact</a>' +
      "</div>" +
      "</nav>";
  }

  var s = document.createElement("script");
  s.src = "/favicon.js";
  document.head.appendChild(s);
})();
