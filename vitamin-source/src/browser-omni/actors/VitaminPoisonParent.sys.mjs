/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * VitaminPoisonParent - Chrome process actor
 */

export class VitaminPoisonParent extends JSWindowActorParent {
  receiveMessage(message) {
    switch (message.name) {
      case "VitaminPoison:CaptchaDetected":
        this.handleCaptchaDetected(message.data);
        break;
    }
    return null;
  }

  handleCaptchaDetected(data) {
    // CAPTCHA detected and couldn't be solved - close this tab
    try {
      const browser = this.browsingContext?.top?.embedderElement;
      if (!browser) return;

      const win = browser.ownerGlobal;
      if (!win || !win.gBrowser) return;

      const tab = win.gBrowser.getTabForBrowser(browser);
      if (tab) {
        // Close tab after short delay
        win.setTimeout(() => {
          try {
            win.gBrowser.removeTab(tab, { animate: false, skipPermitUnload: true });
          } catch (e) {}
        }, 500);
      }
    } catch (e) {
      // Failed to close tab, non-critical
    }
  }
}
