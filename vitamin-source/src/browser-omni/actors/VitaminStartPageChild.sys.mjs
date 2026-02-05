/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * VitaminStartPageChild - Content actor for start page poison indicator
 * Sets data-poison-active attribute to trigger CSS glow on VITA logo
 */

export class VitaminStartPageChild extends JSWindowActorChild {
  actorCreated() {
    // Request current state when page loads
    if (this.document.readyState !== "loading") {
      this.requestState();
    } else {
      this.contentWindow.addEventListener("DOMContentLoaded", () => {
        this.requestState();
      });
    }
  }

  requestState() {
    // Only request state if this looks like our Vitamin page
    try {
      if (this.document.querySelector(".logo-bold")) {
        this.sendAsyncMessage("VitaminStartPage:RequestState");
      }
    } catch (e) {}
  }

  receiveMessage(message) {
    switch (message.name) {
      case "VitaminStartPage:UpdateIndicator":
        this.updateIndicator(message.data.active);
        break;
    }
    return null;
  }

  updateIndicator(active) {
    try {
      if (!this.document || !this.document.documentElement) return;

      // Set or remove the data attribute - CSS in the page handles the glow
      if (active) {
        this.document.documentElement.setAttribute("data-poison-active", "true");
      } else {
        this.document.documentElement.removeAttribute("data-poison-active");
      }
    } catch (e) {
      // Update failed, non-critical
    }
  }
}
