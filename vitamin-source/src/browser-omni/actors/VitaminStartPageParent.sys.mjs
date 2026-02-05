/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * VitaminStartPageParent - Parent actor for start page poison indicator
 * Manages indicator state across all new tab pages
 */

// Shared state - accessible from VitaminPoison module
let poisonActive = false;

export function setPoisonActive(active) {
  poisonActive = active;
  broadcastToAllStartPages(active);
}

export function getPoisonActive() {
  return poisonActive;
}

function broadcastToAllStartPages(active) {
  try {
    const windows = Services.wm.getEnumerator("navigator:browser");
    while (windows.hasMoreElements()) {
      const win = windows.getNext();
      if (!win.gBrowser) continue;

      for (const browser of win.gBrowser.browsers) {
        try {
          const actor = browser.browsingContext?.currentWindowGlobal?.getActor("VitaminStartPage");
          if (actor) {
            actor.sendAsyncMessage("VitaminStartPage:UpdateIndicator", { active });
          }
        } catch (e) {
          // Actor not available for this browser, skip
        }
      }
    }
  } catch (e) {
    // Broadcast failed, non-critical
  }
}

export class VitaminStartPageParent extends JSWindowActorParent {
  receiveMessage(message) {
    switch (message.name) {
      case "VitaminStartPage:RequestState":
        // Child is asking for current state
        this.sendAsyncMessage("VitaminStartPage:UpdateIndicator", { active: poisonActive });
        break;
    }
    return null;
  }
}
