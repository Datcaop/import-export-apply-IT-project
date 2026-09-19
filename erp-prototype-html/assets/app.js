// Prototype-only interactions: open/close modal dialogs, switch chip tabs.
document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.open);
    if (dialog) dialog.showModal();
    return;
  }

  const closer = event.target.closest('[data-close]');
  if (closer) {
    closer.closest('dialog').close();
    return;
  }

  const tab = event.target.closest('[role="tab"]');
  if (tab) {
    tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]').forEach((t) => {
      t.setAttribute('aria-selected', String(t === tab));
    });
  }
});

// Link trực tiếp tới modal, ví dụ products.html#m-product-new
window.addEventListener('DOMContentLoaded', () => {
  const dialog = location.hash && document.querySelector(`dialog${location.hash}`);
  if (dialog) dialog.showModal();
});
