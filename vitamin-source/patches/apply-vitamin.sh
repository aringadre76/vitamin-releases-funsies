#!/bin/bash
# Apply Vitamin files to LibreWolf source
# Usage: ./apply-vitamin.sh /path/to/librewolf-source

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/librewolf-source"
    exit 1
fi

TARGET="$1"
SOURCE="$(dirname "$0")/../omni-work/browser-omni"

if [ ! -d "$TARGET" ]; then
    echo "Error: Target directory not found: $TARGET"
    exit 1
fi

echo "Copying Vitamin files to $TARGET..."

# Copy new files
cp "$SOURCE/actors/VitaminPoisonChild.sys.mjs" "$TARGET/actors/"
cp "$SOURCE/actors/VitaminPoisonParent.sys.mjs" "$TARGET/actors/"
cp "$SOURCE/actors/VitaminStartPageChild.sys.mjs" "$TARGET/actors/"
cp "$SOURCE/actors/VitaminStartPageParent.sys.mjs" "$TARGET/actors/"
cp "$SOURCE/modules/VitaminPoison.sys.mjs" "$TARGET/modules/"
cp "$SOURCE/chrome/browser/content/browser/vitamin-newtab.html" "$TARGET/chrome/browser/content/browser/"
cp "$SOURCE/chrome/browser/content/browser/vitamin-welcome.html" "$TARGET/chrome/browser/content/browser/"
cp "$SOURCE/chrome/browser/content/browser/vitamin-poison-settings.html" "$TARGET/chrome/browser/content/browser/"
cp "$SOURCE/chrome/browser/content/browser/vitamin-poison-content.js" "$TARGET/chrome/browser/content/browser/"
cp "$SOURCE/chrome/browser/content/browser/vitaminpoison.css" "$TARGET/chrome/browser/content/browser/"
cp "$SOURCE/chrome/browser/skin/classic/browser/vitamin-poison.svg" "$TARGET/chrome/browser/skin/classic/browser/"

# Copy modified files
cp "$SOURCE/modules/BrowserGlue.sys.mjs" "$TARGET/modules/"
cp "$SOURCE/modules/AboutNewTabRedirector.sys.mjs" "$TARGET/modules/"
cp "$SOURCE/defaults/preferences/firefox-branding.js" "$TARGET/defaults/preferences/"

echo "Done! Vitamin files applied."
