// Password gate for all Solis DIY pages. It only keeps the concept out of sight:
// the files are public in the repo. The page stores just the SHA-256 of the password.
(function () {
  "use strict";
  var PASS_SHA256 = "65d0ffd891c8b83bd4efdfbaf47122c04bc625e070914d84055cbe1e3c4e2d7f";
  var KEY = "solis-diy-key";
  function unlocked() { try { return localStorage.getItem(KEY) === PASS_SHA256; } catch (e) { return false; } }
  function sha256(t) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  window.SolisKey = function () { return unlocked() ? PASS_SHA256 : ""; };
  if (unlocked()) return;

  // Hide the page before it paints; the form is the only thing shown until the password is right.
  document.documentElement.classList.add("locked");
  document.addEventListener("DOMContentLoaded", function () {
    var box = document.createElement("div");
    box.className = "gate";
    box.innerHTML =
      '<form class="gate-card" id="gate">' +
      '<p class="eyebrow">Solis DIY · <span class="sl">koncept</span><span class="en">concept</span></p>' +
      '<h1><span class="sl">Zasebno</span><span class="en">Private</span></h1>' +
      '<p class="muted"><span class="sl">Za ogled vnesite geslo.</span><span class="en">Enter the password to view.</span></p>' +
      '<div class="gate-row"><input id="gate-pw" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Geslo / Password" required>' +
      '<button class="btn primary" type="submit"><span class="sl">Odpri</span><span class="en">Open</span></button></div>' +
      '<p class="gate-err" id="gate-err" role="alert"></p>' +
      '<p class="fine"><a href="/projects/">← Rok Skrinjar</a></p></form>';
    document.body.appendChild(box);
    var pw = box.querySelector("#gate-pw");
    pw.focus();
    box.querySelector("#gate").addEventListener("submit", function (e) {
      e.preventDefault();
      // Phone keyboards often capitalise the first letter or add a space, so ignore case and spaces.
      sha256(pw.value.trim().toLowerCase()).then(function (h) {
        if (h === PASS_SHA256) {
          try { localStorage.setItem(KEY, PASS_SHA256); } catch (err) {}
          box.remove();
          document.documentElement.classList.remove("locked");
        } else {
          box.querySelector("#gate-err").textContent = document.documentElement.getAttribute("data-lang") === "en" ? "Wrong password." : "Napačno geslo.";
          pw.select();
        }
      });
    });
  });
})();
