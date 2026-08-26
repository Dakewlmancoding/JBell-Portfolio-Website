// ============================================
// SHARED INCLUDES — loads nav.html / footer.html
// into every page and highlights the active tab.
// Requires the page to be served over http(s),
// e.g. via the VS Code "Live Server" extension.
// ============================================

async function loadInclude(targetId, url) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const res = await fetch(url);
  target.innerHTML = await res.text();
}

function highlightActiveNav() {
  const current = document.body.dataset.page;
  document.querySelectorAll('#site-nav a[data-page]').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === current);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadInclude('site-nav', 'includes/nav.html');
  highlightActiveNav();
  loadInclude('site-footer', 'includes/footer.html');
});
