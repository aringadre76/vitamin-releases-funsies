# Vitamin Browser

A privacy-first browser built on LibreWolf with built-in **Data Poisoning** technology.

## What is Data Poisoning?

Trackers build profiles on you based on your browsing. Vitamin fights back by generating fake browsing activity in the background — polluting your tracker profile with garbage data, making it useless for targeting you.

When activated, Vitamin opens background tabs that simulate realistic human browsing — searches, clicks, scrolling — all with randomized fingerprints that look like different browsers and devices.

## Features

- **Privacy-first**: Built on LibreWolf with all its privacy protections
- **Data Poisoning**: Generate fake browsing to pollute tracker profiles
- **Realistic behavior**: Fitts's Law mouse movement, micro-tremors, variable scroll speeds
- **User-Agent spoofing**: Each poison tab appears as a different browser/device
- **Container isolation**: Poison tabs run in isolated containers
- **Configurable**: Adjust frequency, max tabs, search engines, and more
- **CAPTCHA detection**: Automatically closes tabs that hit bot detection

## Building from Source

Vitamin Browser is built by patching LibreWolf. Follow these steps:

### Prerequisites

- Git
- Python 3
- Rust toolchain
- Node.js
- Build dependencies for Firefox (see [Mozilla Build Prerequisites](https://firefox-source-docs.mozilla.org/setup/linux_build.html))

### Clone and Build

```bash
# Clone LibreWolf source
git clone --recursive https://codeberg.org/librewolf/source.git librewolf-source
cd librewolf-source

# Bootstrap (one-time setup)
./mach --no-interactive bootstrap --application-choice=browser
./lw/setup-wasi-linux.sh

# Apply Vitamin patches
cp -r /path/to/vitamin-browser/patches/* patches/
./scripts/git-patchtree.sh

# Build
make all

# Generate .deb package
make deb
```

### Quick Install (omni.ja replacement)

For testing, you can replace the `browser-omni.ja` in an existing LibreWolf installation:

```bash
# Build omni.ja
cd omni-work/browser-omni
zip -r -9 ../browser-omni.ja .

# Backup and replace (Linux)
sudo cp /usr/lib/librewolf/browser/omni.ja /usr/lib/librewolf/browser/omni.ja.bak
sudo cp browser-omni.ja /usr/lib/librewolf/browser/omni.ja

# Restart LibreWolf
```

## Usage

1. Look for the **pill icon** 💊 in your toolbar
2. **Click** to toggle data poisoning on/off (glows orange when active)
3. **Right-click** to open settings:
   - Frequency: How often to open new poison tabs (20-120s)
   - Max tabs: Maximum concurrent poison tabs (1-5)
   - Tab lifetime: How long each tab stays open (15-120s)
   - Search engines: Google (may trigger CAPTCHAs), Bing, Yahoo
   - Auto-start: Begin poisoning when browser launches
4. **Hover** to see live stats: tabs opened, searches performed, links clicked

## How It Works

1. Opens tabs in isolated Firefox containers (cookies isolated)
2. Spoofs User-Agent headers to appear as different browsers
3. Performs searches on Bing/Yahoo (Google limited due to CAPTCHA detection)
4. Simulates realistic mouse movement using Fitts's Law
5. Clicks search results and scrolls with human-like patterns
6. Automatically detects and closes CAPTCHA/bot-check pages

## Privacy Considerations

- **IP Address**: All poison traffic uses your real IP (same as normal browsing)
- **No telemetry**: Vitamin collects zero data about your usage
- **Local-only**: All processing happens in your browser
- **Container isolation**: Poison activity doesn't affect your real cookies/sessions

## Project Structure

```
vitamin-browser/
├── actors/
│   ├── VitaminPoisonChild.sys.mjs   # Content process behavior
│   ├── VitaminPoisonParent.sys.mjs  # Parent process coordination
│   ├── VitaminStartPageChild.sys.mjs
│   └── VitaminStartPageParent.sys.mjs
├── modules/
│   └── VitaminPoison.sys.mjs        # Main poison controller
├── chrome/browser/content/browser/
│   ├── vitamin-newtab.html          # Custom new tab page
│   ├── vitamin-welcome.html         # First-run onboarding
│   └── vitamin-poison-settings.html
├── chrome/browser/skin/classic/browser/
│   └── vitamin-poison.svg           # Toolbar icon
└── patches/                         # LibreWolf patches
```

## License

This project is free and open-source software (FOSS).

- **LibreWolf/Firefox base code**: Mozilla Public License 2.0 (MPL-2.0)
- **Vitamin-specific additions**: Dual-licensed under MPL-2.0 and GPL-3.0-or-later

See [LICENSE](../LICENSE) for details.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run security checks — we take security seriously
5. Submit a pull request

All contributions must be compatible with the MPL-2.0 / GPL-3.0 dual license.

## Security

If you discover a security vulnerability, please report it responsibly by emailing mrvitali@pm.me. Do not open a public issue for security vulnerabilities.

## Credits

- Built on [LibreWolf](https://librewolf.net/)
- Inspired by privacy research on tracker pollution techniques
- Made by VitaliCorp

## Links

- [LibreWolf Source](https://codeberg.org/librewolf/source)
- [LibreWolf Build System (bsys6)](https://codeberg.org/librewolf/bsys6)
