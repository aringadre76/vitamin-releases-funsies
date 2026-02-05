/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * VitaminPoison - Built-in data poisoning feature for Vitamin Browser
 * Opens container tabs with fake browsing sessions to pollute tracker profiles
 * Uses realistic human-like behavior: mouse movements, scrolling, link clicking
 */

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  CustomizableUI: "moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs",
  ContextualIdentityService: "resource://gre/modules/ContextualIdentityService.sys.mjs",
});

// Import start page indicator control
import { setPoisonActive } from "resource:///actors/VitaminStartPageParent.sys.mjs";

const WIDGET_ID = "vitamin-poison-button";
const CONTAINER_NAME = "Vitamin Poison";
const CONTAINER_COLOR = "green";
const CONTAINER_ICON = "fingerprint";

// Default settings
const DEFAULT_SETTINGS = {
  frequency: 40,      // seconds between new tabs
  lifetime: 45,       // seconds before closing tab
  maxTabs: 2,         // max concurrent tabs
  engineGoogle: false,
  engineBing: true,
  engineYahoo: true,
  autoStart: false,
  clickResults: true,
};

// Preference branch for settings
const PREF_BRANCH = "vitamin.poison.";

// Search engine URLs (dynamically built from settings)
const SEARCH_ENGINE_URLS = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  yahoo: "https://search.yahoo.com/search?p=",
};

// 150+ generic safe search terms to pollute profiles
const SEARCH_TERMS = [
  // Health & Fitness
  "best hiking trails near me", "home workout routines", "yoga for beginners",
  "healthy breakfast recipes", "how to start running", "meditation techniques",
  "best stretching exercises", "calorie counting apps", "sleep improvement tips",
  "stress relief techniques", "vitamins for energy", "posture correction exercises",
  "healthy meal prep ideas", "beginner gym routine", "walking for weight loss",
  "how to stay hydrated", "benefits of green tea", "home exercise equipment",

  // Cooking & Food
  "easy dinner recipes", "vegetarian meal ideas", "how to bake bread",
  "slow cooker recipes", "budget friendly meals", "meal planning tips",
  "best kitchen gadgets", "how to cook rice perfectly", "homemade pizza dough",
  "healthy snack ideas", "breakfast smoothie recipes", "grilling tips for beginners",
  "food storage containers", "instant pot recipes", "how to meal prep",
  "baking substitutes", "cast iron skillet care", "knife sharpening guide",

  // Home & Garden
  "diy home improvement", "gardening for beginners", "indoor plant care",
  "home organization tips", "how to paint walls", "furniture arrangement ideas",
  "cleaning schedule template", "best vacuum cleaners", "composting at home",
  "how to unclog drain", "energy saving tips home", "small space storage",
  "lawn care basics", "growing vegetables indoors", "home repair basics",
  "decluttering methods", "natural cleaning products", "pest control natural",

  // Technology & Learning
  "learn coding online free", "best productivity apps", "how to use excel",
  "online course recommendations", "typing speed improvement", "computer maintenance tips",
  "password manager comparison", "cloud storage options", "video editing basics",
  "podcast recommendations", "audiobook apps", "language learning apps",
  "keyboard shortcuts windows", "photo editing tutorials", "website building guide",
  "email organization tips", "digital note taking", "screen time management",

  // Finance & Career
  "budget planning tips", "how to save money", "investing for beginners",
  "credit score improvement", "resume writing tips", "job interview preparation",
  "side hustle ideas", "retirement planning basics", "tax filing tips",
  "negotiation skills", "work from home tips", "professional networking",
  "student loan repayment", "emergency fund guide", "frugal living tips",
  "career change advice", "freelancing beginners", "passive income ideas",

  // Hobbies & Entertainment
  "how to learn guitar", "photography tutorials", "book recommendations fiction",
  "board games for adults", "knitting patterns beginners", "watercolor painting basics",
  "chess strategies beginners", "podcast starting guide", "journaling prompts",
  "bird watching guide", "fishing for beginners", "camping essentials list",
  "drawing tutorials easy", "origami instructions", "calligraphy for beginners",
  "woodworking projects simple", "puzzle solving tips", "magic tricks easy",

  // Travel & Outdoors
  "budget travel tips", "road trip essentials", "camping gear checklist",
  "hiking boots reviews", "travel packing tips", "best national parks",
  "backpacking for beginners", "travel insurance guide", "weekend getaway ideas",
  "scenic drives near me", "beach vacation essentials", "mountain hiking tips",
  "travel photography tips", "local attractions nearby", "day trip ideas",
  "outdoor cooking tips", "stargazing locations", "wildlife watching guide",

  // Pets & Animals
  "dog training basics", "cat care tips", "pet nutrition guide",
  "fish tank setup", "bird cage accessories", "hamster care guide",
  "pet grooming at home", "dog walking tips", "cat toys diy",
  "pet first aid basics", "adopting a rescue pet", "pet insurance comparison",
  "puppy training schedule", "indoor cat enrichment", "pet friendly plants",

  // Lifestyle & Wellness
  "morning routine ideas", "self care practices", "mindfulness exercises",
  "time management tips", "goal setting methods", "habit tracking apps",
  "gratitude journaling", "work life balance", "minimalist lifestyle",
  "digital detox tips", "reading habits improvement", "public speaking tips",
  "confidence building exercises", "social skills improvement", "memory improvement techniques",

  // Shopping & Reviews
  "best wireless headphones", "laptop buying guide", "smartphone comparison",
  "coffee maker reviews", "running shoes comparison", "mattress buying guide",
  "office chair ergonomic", "standing desk reviews", "water bottle recommendations",
  "backpack reviews", "sunglasses buying guide", "watch recommendations",
  "bluetooth speaker reviews", "fitness tracker comparison", "camera buying guide",

  // Seasonal & Events
  "spring cleaning checklist", "summer activities ideas", "fall home decoration",
  "winter preparation home", "holiday gift ideas", "birthday party planning",
  "new year resolutions", "valentine day ideas", "easter crafts simple",
  "thanksgiving recipes easy", "christmas decoration diy", "halloween costume ideas",

  // Random Knowledge
  "how does wifi work", "why is sky blue", "how to tie a tie",
  "history of coffee", "how rainbows form", "interesting science facts",
  "world geography basics", "famous art paintings", "space exploration news",
  "ocean conservation tips", "recycling guide", "carbon footprint reduction",
];

// Sites to visit for additional noise
const NOISE_SITES = [
  "https://en.wikipedia.org/wiki/Special:Random",
  "https://www.reddit.com/r/all/",
  "https://news.ycombinator.com/",
  "https://www.bbc.com/news",
  "https://www.reuters.com/",
  "https://www.npr.org/",
  "https://www.theguardian.com/",
  "https://www.wired.com/",
  "https://arstechnica.com/",
  "https://www.smithsonianmag.com/",
];

// Realistic fingerprint profiles (mainstream browsers, NOT privacy-focused)
const FINGERPRINT_PROFILES = [
  // Chrome on Windows 10/11 (most common)
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    platform: "Win32",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US", "en"],
    screenWidth: 1920,
    screenHeight: 1080,
    colorDepth: 24,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    doNotTrack: null,
  },
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    platform: "Win32",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US", "en"],
    screenWidth: 1366,
    screenHeight: 768,
    colorDepth: 24,
    deviceMemory: 4,
    hardwareConcurrency: 4,
    doNotTrack: null,
  },
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    platform: "Win32",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US"],
    screenWidth: 2560,
    screenHeight: 1440,
    colorDepth: 24,
    deviceMemory: 16,
    hardwareConcurrency: 12,
    doNotTrack: null,
  },
  // Edge on Windows
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    platform: "Win32",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US", "en"],
    screenWidth: 1920,
    screenHeight: 1080,
    colorDepth: 24,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    doNotTrack: null,
  },
  {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    platform: "Win32",
    vendor: "Google Inc.",
    language: "en-GB",
    languages: ["en-GB", "en"],
    screenWidth: 1366,
    screenHeight: 768,
    colorDepth: 24,
    deviceMemory: 4,
    hardwareConcurrency: 4,
    doNotTrack: null,
  },
  // Chrome on macOS
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    platform: "MacIntel",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US", "en"],
    screenWidth: 1440,
    screenHeight: 900,
    colorDepth: 30,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    doNotTrack: null,
  },
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    platform: "MacIntel",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US"],
    screenWidth: 2560,
    screenHeight: 1600,
    colorDepth: 30,
    deviceMemory: 16,
    hardwareConcurrency: 10,
    doNotTrack: null,
  },
  // Safari on macOS
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
    platform: "MacIntel",
    vendor: "Apple Computer, Inc.",
    language: "en-US",
    languages: ["en-US"],
    screenWidth: 1440,
    screenHeight: 900,
    colorDepth: 30,
    deviceMemory: undefined, // Safari doesn't expose this
    hardwareConcurrency: 8,
    doNotTrack: null,
  },
  {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
    platform: "MacIntel",
    vendor: "Apple Computer, Inc.",
    language: "en-US",
    languages: ["en-US", "en"],
    screenWidth: 1680,
    screenHeight: 1050,
    colorDepth: 30,
    deviceMemory: undefined,
    hardwareConcurrency: 10,
    doNotTrack: null,
  },
  // Chrome on Linux (less common but adds variety)
  {
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    platform: "Linux x86_64",
    vendor: "Google Inc.",
    language: "en-US",
    languages: ["en-US", "en"],
    screenWidth: 1920,
    screenHeight: 1080,
    colorDepth: 24,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    doNotTrack: null,
  },
];

// Current fingerprint for this session (randomized per tab)
let currentFingerprint = null;

let enabled = false;
let poisonContainerId = null;
let poisonInterval = null;
let actorRegistered = false;
let openPoisonTabs = new Set();
let currentSettings = { ...DEFAULT_SETTINGS };

// Stats tracking
const stats = {
  tabsOpened: 0,
  searchesPerformed: 0,
  sitesVisited: 0,
  linksClicked: 0,
  sessionStart: null,

  reset() {
    this.tabsOpened = 0;
    this.searchesPerformed = 0;
    this.sitesVisited = 0;
    this.linksClicked = 0;
    this.sessionStart = null;
  },

  getSessionDuration() {
    if (!this.sessionStart) return "0s";
    const seconds = Math.floor((Date.now() - this.sessionStart) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }
};

export const VitaminPoison = {
  init() {
    this.loadSettings();
    this.registerActor();
    this.checkFirstRun();

    // Auto-start if enabled
    if (currentSettings.autoStart) {
      // Delay auto-start to let browser fully initialize
      const win = Services.wm.getMostRecentWindow("navigator:browser");
      if (win) {
        win.setTimeout(() => {
          if (!enabled && currentSettings.autoStart) {
            this.toggle(win);
          }
        }, 5000);
      }
    }

    try {
      const self = this;

      lazy.CustomizableUI.createWidget({
        id: WIDGET_ID,
        type: "button",
        label: "Poison",
        tooltiptext: "Toggle Vitamin Poison - Creates fake browsing sessions to pollute tracker profiles\nRight-click for settings",
        defaultArea: lazy.CustomizableUI.AREA_NAVBAR,

        onCreated(aNode) {
          aNode.classList.add("toolbarbutton-1");
          aNode.setAttribute("image", "chrome://browser/skin/vitamin-poison.svg");
          aNode.setAttribute("context", "");

          // Right-click opens settings menu
          aNode.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            self.openSettings(aNode.ownerGlobal);
          });
        },

        onCommand(aEvent) {
          self.toggle(aEvent.target.ownerGlobal);
        },
      });
    } catch (e) {
      console.error("[VitaminPoison] Error creating widget:", e);
    }
  },

  toggle(win) {
    enabled = !enabled;

    if (enabled) {
      this.startPoisoning(win);
    } else {
      this.stopPoisoning(win);
    }

    this.updateButtonState(win);

    // Update start page indicator via actor system
    setPoisonActive(enabled);
  },

  // Check if first run and show welcome page
  checkFirstRun() {
    try {
      const hasRun = Services.prefs.getBoolPref(PREF_BRANCH + "hasRun", false);
      if (!hasRun) {
        // Mark as run
        Services.prefs.setBoolPref(PREF_BRANCH + "hasRun", true);

        // Open welcome page after browser is ready
        const showWelcome = () => {
          const win = Services.wm.getMostRecentWindow("navigator:browser");
          if (win && win.gBrowser) {
            win.gBrowser.addTab("chrome://browser/content/vitamin-welcome.html", {
              triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
              inBackground: false,
            });
          } else {
            // Browser not ready, try again
            Services.tm.dispatchToMainThread(() => {
              Services.wm.getMostRecentWindow("navigator:browser")?.setTimeout(showWelcome, 500);
            });
          }
        };

        // Delay to let browser fully initialize
        Services.tm.dispatchToMainThread(() => {
          const win = Services.wm.getMostRecentWindow("navigator:browser");
          if (win) {
            win.setTimeout(showWelcome, 1500);
          }
        });
      }
    } catch (e) {
      // First run check failed, non-critical
    }
  },

  // Load settings from preferences
  loadSettings() {
    try {
      currentSettings = {
        frequency: Services.prefs.getIntPref(PREF_BRANCH + "frequency", DEFAULT_SETTINGS.frequency),
        lifetime: Services.prefs.getIntPref(PREF_BRANCH + "lifetime", DEFAULT_SETTINGS.lifetime),
        maxTabs: Services.prefs.getIntPref(PREF_BRANCH + "maxTabs", DEFAULT_SETTINGS.maxTabs),
        engineGoogle: Services.prefs.getBoolPref(PREF_BRANCH + "engineGoogle", DEFAULT_SETTINGS.engineGoogle),
        engineBing: Services.prefs.getBoolPref(PREF_BRANCH + "engineBing", DEFAULT_SETTINGS.engineBing),
        engineYahoo: Services.prefs.getBoolPref(PREF_BRANCH + "engineYahoo", DEFAULT_SETTINGS.engineYahoo),
        autoStart: Services.prefs.getBoolPref(PREF_BRANCH + "autoStart", DEFAULT_SETTINGS.autoStart),
        clickResults: Services.prefs.getBoolPref(PREF_BRANCH + "clickResults", DEFAULT_SETTINGS.clickResults),
      };
    } catch (e) {
      currentSettings = { ...DEFAULT_SETTINGS };
    }
  },

  // Save settings to preferences
  saveSettings(settings) {
    try {
      Services.prefs.setIntPref(PREF_BRANCH + "frequency", settings.frequency);
      Services.prefs.setIntPref(PREF_BRANCH + "lifetime", settings.lifetime);
      Services.prefs.setIntPref(PREF_BRANCH + "maxTabs", settings.maxTabs);
      Services.prefs.setBoolPref(PREF_BRANCH + "engineGoogle", settings.engineGoogle);
      Services.prefs.setBoolPref(PREF_BRANCH + "engineBing", settings.engineBing);
      Services.prefs.setBoolPref(PREF_BRANCH + "engineYahoo", settings.engineYahoo);
      Services.prefs.setBoolPref(PREF_BRANCH + "autoStart", settings.autoStart);
      Services.prefs.setBoolPref(PREF_BRANCH + "clickResults", settings.clickResults);
      currentSettings = { ...settings };
    } catch (e) {
      console.error("[VitaminPoison] Failed to save settings:", e);
    }
  },

  // Open settings menu
  openSettings(win) {
    const self = this;
    const doc = win.document;

    // Remove existing menu if any
    let existingMenu = doc.getElementById("vitamin-poison-settings-menu");
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create menupopup
    const menu = doc.createXULElement("menupopup");
    menu.id = "vitamin-poison-settings-menu";

    // Helper to create menu item
    const createItem = (label, type, checked, callback) => {
      const item = doc.createXULElement("menuitem");
      item.setAttribute("label", label);
      if (type === "checkbox") {
        item.setAttribute("type", "checkbox");
        item.setAttribute("checked", checked ? "true" : "false");
        item.addEventListener("command", () => {
          callback(!checked);
        });
      } else {
        item.addEventListener("command", callback);
      }
      return item;
    };

    // Helper to create separator
    const createSeparator = () => doc.createXULElement("menuseparator");

    // Helper to create label
    const createLabel = (text) => {
      const item = doc.createXULElement("menuitem");
      item.setAttribute("label", text);
      item.setAttribute("disabled", "true");
      item.style.fontWeight = "bold";
      return item;
    };

    // Frequency submenu
    const freqMenu = doc.createXULElement("menu");
    freqMenu.setAttribute("label", `Frequency: ${currentSettings.frequency}s`);
    const freqPopup = doc.createXULElement("menupopup");
    [20, 30, 40, 60, 90, 120].forEach(val => {
      const item = createItem(`${val} seconds`, null, false, () => {
        currentSettings.frequency = val;
        self.saveSettings(currentSettings);
      });
      if (val === currentSettings.frequency) item.setAttribute("checked", "true");
      freqPopup.appendChild(item);
    });
    freqMenu.appendChild(freqPopup);
    menu.appendChild(freqMenu);

    // Lifetime submenu
    const lifeMenu = doc.createXULElement("menu");
    lifeMenu.setAttribute("label", `Tab Lifetime: ${currentSettings.lifetime}s`);
    const lifePopup = doc.createXULElement("menupopup");
    [20, 30, 45, 60, 90, 120].forEach(val => {
      const item = createItem(`${val} seconds`, null, false, () => {
        currentSettings.lifetime = val;
        self.saveSettings(currentSettings);
      });
      if (val === currentSettings.lifetime) item.setAttribute("checked", "true");
      lifePopup.appendChild(item);
    });
    lifeMenu.appendChild(lifePopup);
    menu.appendChild(lifeMenu);

    // Max tabs submenu
    const tabsMenu = doc.createXULElement("menu");
    tabsMenu.setAttribute("label", `Max Tabs: ${currentSettings.maxTabs}`);
    const tabsPopup = doc.createXULElement("menupopup");
    [1, 2, 3, 4, 5].forEach(val => {
      const item = createItem(`${val} tab${val > 1 ? 's' : ''}`, null, false, () => {
        currentSettings.maxTabs = val;
        self.saveSettings(currentSettings);
      });
      if (val === currentSettings.maxTabs) item.setAttribute("checked", "true");
      tabsPopup.appendChild(item);
    });
    tabsMenu.appendChild(tabsPopup);
    menu.appendChild(tabsMenu);

    menu.appendChild(createSeparator());

    // Search engines
    menu.appendChild(createLabel("Search Engines"));
    menu.appendChild(createItem("Bing", "checkbox", currentSettings.engineBing, (v) => {
      currentSettings.engineBing = v;
      self.saveSettings(currentSettings);
    }));
    menu.appendChild(createItem("Yahoo", "checkbox", currentSettings.engineYahoo, (v) => {
      currentSettings.engineYahoo = v;
      self.saveSettings(currentSettings);
    }));
    menu.appendChild(createItem("Google (may trigger CAPTCHA)", "checkbox", currentSettings.engineGoogle, (v) => {
      currentSettings.engineGoogle = v;
      self.saveSettings(currentSettings);
    }));

    menu.appendChild(createSeparator());

    // Behavior
    menu.appendChild(createLabel("Behavior"));
    menu.appendChild(createItem("Auto-start on launch", "checkbox", currentSettings.autoStart, (v) => {
      currentSettings.autoStart = v;
      self.saveSettings(currentSettings);
    }));
    menu.appendChild(createItem("Click search results", "checkbox", currentSettings.clickResults, (v) => {
      currentSettings.clickResults = v;
      self.saveSettings(currentSettings);
    }));

    // Add to document and show
    doc.getElementById("mainPopupSet").appendChild(menu);
    const button = doc.getElementById(WIDGET_ID);
    menu.openPopup(button, "after_end", 0, 0, false, false);
  },

  // Build search engines list based on settings
  getActiveSearchEngines() {
    const engines = [];
    if (currentSettings.engineBing) {
      engines.push(SEARCH_ENGINE_URLS.bing);
      engines.push(SEARCH_ENGINE_URLS.bing); // Weight Bing higher
    }
    if (currentSettings.engineYahoo) {
      engines.push(SEARCH_ENGINE_URLS.yahoo);
      engines.push(SEARCH_ENGINE_URLS.yahoo); // Weight Yahoo higher
    }
    if (currentSettings.engineGoogle) {
      engines.push(SEARCH_ENGINE_URLS.google); // Google only once (lower weight)
    }
    // Fallback if none selected
    if (engines.length === 0) {
      engines.push(SEARCH_ENGINE_URLS.bing);
    }
    return engines;
  },

  updateButtonState(win) {
    const button = win.document.getElementById(WIDGET_ID);
    if (button) {
      const icon = button.querySelector(".toolbarbutton-icon");

      if (enabled) {
        button.setAttribute("checked", "true");
        if (icon) {
          icon.style.setProperty("filter", "drop-shadow(0 0 2px #ff8c00)");
          icon.style.setProperty("fill", "#ff8c00");
        }
        this.updateTooltip(button);
      } else {
        button.removeAttribute("checked");
        if (icon) {
          icon.style.removeProperty("filter");
          icon.style.removeProperty("fill");
        }
        button.setAttribute("tooltiptext", "Toggle Vitamin Poison - Creates fake browsing sessions to pollute tracker profiles");
      }
    }
  },

  updateTooltip(button) {
    if (!enabled) return;
    const tooltip = `Vitamin Poison Active (${stats.getSessionDuration()})
Tabs: ${stats.tabsOpened} | Searches: ${stats.searchesPerformed} | Sites: ${stats.sitesVisited} | Clicks: ${stats.linksClicked}`;
    button.setAttribute("tooltiptext", tooltip);
  },


  async getOrCreateContainer() {
    const containers = lazy.ContextualIdentityService.getPublicIdentities();
    for (const container of containers) {
      if (container.name === CONTAINER_NAME) {
        return container.userContextId;
      }
    }

    const newContainer = lazy.ContextualIdentityService.create(
      CONTAINER_NAME,
      CONTAINER_ICON,
      CONTAINER_COLOR
    );
    return newContainer.userContextId;
  },

  getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  getRandomFingerprint() {
    return this.getRandomItem(FINGERPRINT_PROFILES);
  },

  getRandomSearchUrl() {
    const engines = this.getActiveSearchEngines();
    const engine = this.getRandomItem(engines);
    const term = this.getRandomItem(SEARCH_TERMS);
    return engine + encodeURIComponent(term);
  },

  getRandomUrl() {
    // 75% chance search, 25% chance noise site
    if (Math.random() < 0.75) {
      return this.getRandomSearchUrl();
    }
    return this.getRandomItem(NOISE_SITES);
  },

  async openPoisonTab(win) {
    if (!enabled) return;

    // Check max tabs limit
    if (openPoisonTabs.size >= currentSettings.maxTabs) {
      return; // Don't open more tabs
    }

    try {
      if (!poisonContainerId) {
        poisonContainerId = await this.getOrCreateContainer();
      }

      const url = this.getRandomUrl();
      const isSearchPage = url.includes("?q=") || url.includes("?p=");

      // Pick a random fingerprint for this tab
      const fingerprint = this.getRandomFingerprint();

      const tab = win.gBrowser.addTab(url, {
        triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
        userContextId: poisonContainerId,
      });

      // Store fingerprint on tab for later use
      tab._vitaminFingerprint = fingerprint;
      openPoisonTabs.add(tab);

      // Update stats
      stats.tabsOpened++;
      if (isSearchPage) {
        stats.searchesPerformed++;
      } else {
        stats.sitesVisited++;
      }
      this.updateButtonState(win);

      const browser = win.gBrowser.getBrowserForTab(tab);
      const self = this;

      // Set up User-Agent spoofing for this browser
      this.setupUserAgentSpoofing(browser, fingerprint);

      const startSimulation = () => {
        win.setTimeout(() => {
          self.simulateHumanBehavior(win, browser, tab, isSearchPage, fingerprint);
        }, 2000);
      };

      const progressListener = {
        onStateChange(webProgress, request, flags, status) {
          if (flags & Ci.nsIWebProgressListener.STATE_STOP &&
              flags & Ci.nsIWebProgressListener.STATE_IS_WINDOW) {
            browser.removeProgressListener(progressListener);
            startSimulation();
          }
        },
        QueryInterface: ChromeUtils.generateQI([
          "nsIWebProgressListener",
          "nsISupportsWeakReference",
        ]),
      };
      browser.addProgressListener(progressListener);

      // Use settings for tab lifetime (convert seconds to ms, add variance)
      const baseLifetime = currentSettings.lifetime * 1000;
      const closeDelay = baseLifetime * (0.7 + Math.random() * 0.6);
      win.setTimeout(() => {
        try {
          openPoisonTabs.delete(tab);
          if (tab && !tab.closing) {
            win.gBrowser.removeTab(tab);
          }
        } catch (e) {
          // Tab already closed
        }
      }, closeDelay);

    } catch (e) {
      console.error("[VitaminPoison] Error opening poison tab:", e);
    }
  },

  setupUserAgentSpoofing(browser, fingerprint) {
    // Use nsIHttpChannel observer to modify User-Agent header
    try {
      const dominated = browser.browsingContext?.id;
      if (!dominated) return;

      // Store the mapping for the HTTP observer
      if (!this._browserFingerprints) {
        this._browserFingerprints = new Map();
        this.registerHttpObserver();
      }
      this._browserFingerprints.set(dominated, fingerprint);
    } catch (e) {}
  },

  registerHttpObserver() {
    if (this._httpObserverRegistered) return;

    const self = this;
    this._httpObserver = {
      observe(subject, topic, data) {
        if (topic !== "http-on-modify-request") return;

        try {
          const channel = subject.QueryInterface(Ci.nsIHttpChannel);
          const dominated = channel.loadInfo?.browsingContextID;

          if (dominated && self._browserFingerprints?.has(dominated)) {
            const fp = self._browserFingerprints.get(dominated);
            channel.setRequestHeader("User-Agent", fp.userAgent, false);
            // Also set Accept-Language to match
            channel.setRequestHeader("Accept-Language", fp.language + ",en;q=0.9", false);
          }
        } catch (e) {}
      },
      QueryInterface: ChromeUtils.generateQI(["nsIObserver"]),
    };

    Services.obs.addObserver(this._httpObserver, "http-on-modify-request");
    this._httpObserverRegistered = true;
  },

  registerActor() {
    if (actorRegistered) return;

    try {
      // Register behavior simulation actor (for poison tabs)
      ChromeUtils.registerWindowActor("VitaminPoison", {
        parent: {
          esModuleURI: "resource:///actors/VitaminPoisonParent.sys.mjs",
        },
        child: {
          esModuleURI: "resource:///actors/VitaminPoisonChild.sys.mjs",
        },
        allFrames: true,
      });

      // Register start page indicator actor (for new tab pages)
      ChromeUtils.registerWindowActor("VitaminStartPage", {
        parent: {
          esModuleURI: "resource:///actors/VitaminStartPageParent.sys.mjs",
        },
        child: {
          esModuleURI: "resource:///actors/VitaminStartPageChild.sys.mjs",
          events: {
            DOMContentLoaded: { capture: true },
          },
        },
        matches: [
          "about:home",
          "about:newtab",
          "about:welcome",
          "chrome://browser/content/browser/vitamin-newtab.html",
        ],
      });

      actorRegistered = true;
    } catch (e) {}
  },

  async simulateHumanBehavior(win, browser, tab, isSearchPage, fingerprint) {
    try {
      const browsingContext = browser.browsingContext;
      if (!browsingContext) return;

      const windowGlobal = browsingContext.currentWindowGlobal;
      if (!windowGlobal) return;

      const actor = windowGlobal.getActor("VitaminPoison");
      const shouldClick = currentSettings.clickResults;
      const behaviorSequence = this.generateBehaviorSequence(isSearchPage, shouldClick);

      // Track if we're clicking a link
      if (isSearchPage && shouldClick && behaviorSequence.some(a => a.type === "clickSearchResult")) {
        stats.linksClicked++;
        this.updateButtonState(win);
      }

      actor.sendAsyncMessage("VitaminPoison:SimulateBehavior", {
        sequence: behaviorSequence,
        isSearchPage,
        fingerprint // Pass fingerprint for JS property spoofing
      });
    } catch (e) {}
  },

  generateBehaviorSequence(isSearchPage, shouldClick = true) {
    const sequence = [];

    // 10% chance: Do almost nothing (distracted user)
    if (Math.random() < 0.1) {
      sequence.push({ type: "pause", duration: 2000 + Math.random() * 5000 });
      if (Math.random() < 0.5) {
        sequence.push({
          type: "mouseMove",
          x: 300 + Math.random() * 200,
          y: 200 + Math.random() * 100,
          duration: 500
        });
      }
      sequence.push({ type: "pause", duration: 1000 + Math.random() * 3000 });
      return sequence;
    }

    // Initial pause - human takes time to see page load
    sequence.push({
      type: "pause",
      duration: 500 + Math.random() * 1500
    });

    // Mouse movement to center of page
    sequence.push({
      type: "mouseMove",
      x: 400 + Math.random() * 400,
      y: 300 + Math.random() * 200,
      duration: 300 + Math.random() * 500
    });

    // Initial scroll down to see content
    sequence.push({
      type: "scroll",
      amount: 150 + Math.floor(Math.random() * 200),
      duration: 800 + Math.random() * 400
    });

    // Reading pause
    sequence.push({
      type: "pause",
      duration: 1000 + Math.random() * 2000
    });

    // More mouse movements (mimicking reading/scanning)
    const numMouseMoves = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numMouseMoves; i++) {
      sequence.push({
        type: "mouseMove",
        x: 200 + Math.random() * 600,
        y: 200 + Math.random() * 400,
        duration: 200 + Math.random() * 400
      });

      sequence.push({
        type: "pause",
        duration: 300 + Math.random() * 800
      });
    }

    // Scrolling - mix of down and up
    const numScrolls = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numScrolls; i++) {
      // 25% chance to scroll UP (re-reading something)
      const scrollUp = Math.random() < 0.25;
      const amount = 100 + Math.floor(Math.random() * 300);

      sequence.push({
        type: "scroll",
        amount: scrollUp ? -amount : amount,
        duration: 600 + Math.random() * 600
      });

      // Variable pause - sometimes long (reading), sometimes short (scanning)
      const longPause = Math.random() < 0.3;
      sequence.push({
        type: "pause",
        duration: longPause ? (2000 + Math.random() * 3000) : (500 + Math.random() * 1000)
      });

      // Occasional mouse movement while scrolling
      if (Math.random() < 0.4) {
        sequence.push({
          type: "mouseMove",
          x: 150 + Math.random() * 700,
          y: 250 + Math.random() * 300,
          duration: 250 + Math.random() * 350
        });
      }

      // 15% chance: Random idle moment (user distracted)
      if (Math.random() < 0.15) {
        sequence.push({
          type: "pause",
          duration: 3000 + Math.random() * 4000
        });
      }
    }

    // If search page and clicking enabled, maybe click a result (70% chance)
    if (isSearchPage && shouldClick && Math.random() < 0.7) {
      // Scroll back up a bit first sometimes
      if (Math.random() < 0.4) {
        sequence.push({
          type: "scroll",
          amount: -(100 + Math.floor(Math.random() * 150)),
          duration: 400 + Math.random() * 300
        });
        sequence.push({
          type: "pause",
          duration: 500 + Math.random() * 800
        });
      }

      sequence.push({
        type: "pause",
        duration: 500 + Math.random() * 1000
      });

      sequence.push({
        type: "clickSearchResult",
        resultIndex: Math.floor(Math.random() * 5)
      });
    } else {
      // Not clicking - just browse and leave
      // Final scroll (could be up or down)
      const finalUp = Math.random() < 0.3;
      sequence.push({
        type: "scroll",
        amount: finalUp ? -(50 + Math.random() * 100) : (100 + Math.random() * 200),
        duration: 500 + Math.random() * 500
      });

      sequence.push({
        type: "pause",
        duration: 1000 + Math.random() * 2000
      });
    }

    return sequence;
  },

  showNotification(win, message) {
    try {
      const notificationBox = win.gBrowser.getNotificationBox();

      const existing = notificationBox.getNotificationWithValue("vitamin-poison-notification");
      if (existing) {
        notificationBox.removeNotification(existing);
      }

      const notification = notificationBox.appendNotification(
        "vitamin-poison-notification",
        {
          label: message,
          priority: notificationBox.PRIORITY_INFO_MEDIUM,
        },
        null
      );

      win.setTimeout(() => {
        try {
          if (notification && notification.parentNode) {
            notificationBox.removeNotification(notification);
          }
        } catch (e) {}
      }, 3000);
    } catch (e) {}
  },

  async startPoisoning(win) {
    stats.reset();
    stats.sessionStart = Date.now();

    await this.openPoisonTab(win);

    // Use settings for frequency (convert seconds to ms, add randomness)
    const baseInterval = currentSettings.frequency * 1000;
    const scheduleNext = () => {
      if (!enabled) return;
      const interval = baseInterval * (0.7 + Math.random() * 0.6); // +/- 30% variance
      poisonInterval = win.setTimeout(() => {
        if (enabled) {
          this.openPoisonTab(win);
          scheduleNext();
        }
      }, interval);
    };
    scheduleNext();

    this.showNotification(win, "Vitamin Poison activated - Polluting tracker profiles");
  },

  async stopPoisoning(win) {
    // Clear the timeout
    if (poisonInterval) {
      try {
        win.clearTimeout(poisonInterval);
      } catch (e) {
        try {
          Services.wm.getMostRecentWindow("navigator:browser").clearTimeout(poisonInterval);
        } catch (e2) {}
      }
      poisonInterval = null;
    }

    // Close poison tabs in a window
    const closePoisonTabs = (targetWin) => {
      if (!targetWin || !targetWin.gBrowser) return 0;

      let closed = 0;
      const tabsToCheck = Array.from(targetWin.gBrowser.tabs).reverse();

      for (const tab of tabsToCheck) {
        try {
          const attrId = tab.getAttribute("usercontextid");
          const attrIdNum = attrId ? parseInt(attrId, 10) : null;
          const propIdNum = tab.userContextId;
          const isTracked = openPoisonTabs.has(tab);

          const shouldClose = isTracked ||
            (poisonContainerId && attrIdNum === poisonContainerId) ||
            (poisonContainerId && propIdNum === poisonContainerId);

          if (shouldClose) {
            targetWin.gBrowser.removeTab(tab, { animate: false, skipPermitUnload: true });
            closed++;
          }
        } catch (e) {}
      }
      return closed;
    };

    // Close in current window
    let totalClosed = closePoisonTabs(win);

    // Check all other windows
    try {
      const windows = Services.wm.getEnumerator("navigator:browser");
      while (windows.hasMoreElements()) {
        const browserWin = windows.getNext();
        if (browserWin !== win) {
          totalClosed += closePoisonTabs(browserWin);
        }
      }
    } catch (e) {}

    openPoisonTabs.clear();

    // Clear fingerprint mappings
    if (this._browserFingerprints) {
      this._browserFingerprints.clear();
    }

    // Show summary notification
    if (win) {
      const msg = `Poison stopped - ${stats.tabsOpened} tabs, ${stats.searchesPerformed} searches, ${stats.sitesVisited} sites (${stats.getSessionDuration()})`;
      this.showNotification(win, msg);
    }
  },

  uninit() {
    this.stopPoisoning();
    try {
      lazy.CustomizableUI.destroyWidget(WIDGET_ID);
    } catch (e) {}
  }
};
