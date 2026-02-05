/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// VitaminPoison content script - runs in content process
// Handles scroll simulation for poisoning

/* eslint-env mozilla/frame-script */

addMessageListener("VitaminPoison:Scroll", function(message) {
  const { scrollAmount } = message.data;
  content.window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
});

addMessageListener("VitaminPoison:ScrollSequence", function(message) {
  const { scrolls } = message.data;
  let index = 0;

  function doNextScroll() {
    if (index >= scrolls.length) return;

    const { amount, delay } = scrolls[index];
    content.window.scrollBy({ top: amount, behavior: 'smooth' });
    index++;

    if (index < scrolls.length) {
      content.setTimeout(doNextScroll, delay);
    }
  }

  doNextScroll();
});
