// Password gate shared by all cookbook pages. It only keeps the cookbook out of sight:
// the recipes are public files in the repo. The page stores just the SHA-256 of the password.
(function () {
  const PASS_SHA256 = '897c28f8df989f876ea04616fe6e7f2d1219a8bbabdbb30ff8d409cec8f8db07';
  const sha256 = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const unlocked = () => { try { return localStorage.getItem('cookbook-key') === PASS_SHA256; } catch (e) { return false; } };

  // Resolves once the visitor is unlocked; until then shows the password form inside `container`.
  window.cookbookGate = function (container) {
    return new Promise(resolve => {
      if (unlocked()) return resolve();
      const saved = container.innerHTML;
      container.innerHTML = `<div class="lock">
        <p class="eyebrow">Kuharska knjiga</p>
        <h1>Zasebno</h1>
        <p>Za ogled vnesi geslo.</p>
        <form id="lock"><input id="pw" type="password" autocomplete="current-password" aria-label="Geslo" placeholder="Geslo" required><button type="submit">Odpri</button></form>
        <p class="err" id="err" role="alert"></p>
      </div>`;
      const pw = container.querySelector('#pw');
      pw.focus();
      container.querySelector('#lock').addEventListener('submit', async e => {
        e.preventDefault();
        if (await sha256(pw.value) === PASS_SHA256) {
          try { localStorage.setItem('cookbook-key', PASS_SHA256); } catch (err) {}
          container.innerHTML = saved;
          resolve();
        } else {
          container.querySelector('#err').textContent = 'Napačno geslo.';
          pw.select();
        }
      });
    });
  };
})();
