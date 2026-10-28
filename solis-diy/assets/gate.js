// Gate for all Solis DIY pages: closes the concept after the countdown deadline, and can ask for a password.
// The password only keeps the concept out of sight (the files are public in the repo); the page stores just its SHA-256.
(function () {
  "use strict";
  var PASSWORD_ON = false; // off since 2026-10-28 (Rok: the data is public); set true to ask for the password again
  var PASS_SHA256 = "65d0ffd891c8b83bd4efdfbaf47122c04bc625e070914d84055cbe1e3c4e2d7f";
  var KEY = "solis-diy-key";
  function unlocked() { try { return localStorage.getItem(KEY) === PASS_SHA256; } catch (e) { return false; } }
  function sha256(t) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  window.SolisKey = function () { return !PASSWORD_ON || unlocked() ? PASS_SHA256 : ""; };

  // Past the countdown deadline the concept is closed for everyone, password or not.
  if (window.SD && SD.expired && SD.expired()) {
    document.documentElement.classList.add("locked", "expired");
    document.addEventListener("DOMContentLoaded", function () {
      var box = document.createElement("div");
      box.className = "gate";
      box.innerHTML =
        '<div class="gate-card">' +
        '<p class="eyebrow">Solis DIY · <span class="sl">koncept</span><span class="en">concept</span></p>' +
        '<h1><span class="sl">Ponudba je potekla</span><span class="en">The offer has expired</span></h1>' +
        '<p class="muted"><span class="sl">Koncept Solis DIY je bil na voljo do 2. 11. 2026 ob 14.00.</span><span class="en">The Solis DIY concept was available until 2 Nov 2026, 14:00.</span></p>' +
        '<p class="fine"><a href="/projects/">← Rok Skrinjar</a></p></div>';
      document.body.appendChild(box);
    });
    return;
  }
  if (!PASSWORD_ON || unlocked()) return;

  // Hide the page before it paints; the form is the only thing shown until the password is right.
  document.documentElement.classList.add("locked");
  document.addEventListener("DOMContentLoaded", function () {
    var box = document.createElement("div");
    box.className = "gate";
    box.innerHTML =
      '<form class="gate-card" id="gate">' +
      '<div class="countdown" role="timer"></div>' +
      '<p class="eyebrow">Solis DIY · <span class="sl">koncept</span><span class="en">concept</span></p>' +
      '<h1><span class="sl">Zasebno</span><span class="en">Private</span></h1>' +
      '<p class="muted"><span class="sl">Za ogled vnesite geslo.</span><span class="en">Enter the password to view.</span></p>' +
      '<div class="gate-row"><input id="gate-pw" type="password" autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" aria-label="Geslo / Password" required>' +
      '<button class="btn primary" type="submit"><span class="sl">Odpri</span><span class="en">Open</span></button></div>' +
      '<p class="gate-err" id="gate-err" role="alert"></p>' +
      '<p class="fine"><a href="/projects/">← Rok Skrinjar</a></p></form>';
    document.body.appendChild(box);
    if (window.SD && SD.tick) SD.tick();
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
