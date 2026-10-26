// Examples load from the live service. Served by a PlaceMellon itself (as
// npm run dev does), they load from that one; ?base=URL picks another.
var PM_LIVE = "https://placemellon.andrew.cmu.edu";
var PM_BASE = (function () {
  var base = new URLSearchParams(location.search).get("base");
  if (!base && location.hostname !== "cmutli.github.io" && location.protocol !== "file:") base = location.origin;
  return base || PM_LIVE;
})();
(function () {
  if (PM_BASE === PM_LIVE) return;
  document.querySelectorAll('img[src^="' + PM_LIVE + '/"]').forEach(function (el) {
    el.setAttribute("src", el.getAttribute("src").replace(PM_LIVE, PM_BASE));
  });
})();
