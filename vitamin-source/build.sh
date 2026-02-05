#!/bin/bash
#
# Vitamin Browser - Build Script
#
# This script can:
# 1. Build the omni.ja for quick testing
# 2. Generate patches for LibreWolf source integration
# 3. Build a full .deb package (requires LibreWolf source)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/src/browser-omni"
OUTPUT_DIR="$SCRIPT_DIR/dist"
PATCHES_DIR="$SCRIPT_DIR/patches"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

show_help() {
    echo -e "${CYAN}Vitamin Browser Build Script${NC}"
    echo ""
    echo "Usage: ./build.sh [command]"
    echo ""
    echo "Commands:"
    echo "  omni      Build browser-omni.ja for quick testing"
    echo "  patches   Generate LibreWolf patches from current code"
    echo "  deb       Build full .deb package (requires LibreWolf source)"
    echo "  help      Show this help message"
    echo ""
}

build_omni() {
    echo -e "${GREEN}Building browser-omni.ja...${NC}"

    mkdir -p "$OUTPUT_DIR"

    if [ -f "$OUTPUT_DIR/browser-omni.ja" ]; then
        mv "$OUTPUT_DIR/browser-omni.ja" "$OUTPUT_DIR/browser-omni.ja.bak"
    fi

    cd "$BUILD_DIR"
    zip -r -9 "$OUTPUT_DIR/browser-omni.ja" . \
        -x "*.git*" \
        -x "*.DS_Store" \
        -x "*__pycache__*"

    SIZE=$(du -h "$OUTPUT_DIR/browser-omni.ja" | cut -f1)
    echo -e "${GREEN}Built: $OUTPUT_DIR/browser-omni.ja ($SIZE)${NC}"
    echo ""
    echo "To install:"
    echo "  sudo cp $OUTPUT_DIR/browser-omni.ja /usr/lib/librewolf/browser/omni.ja"
}

generate_patches() {
    echo -e "${GREEN}Generating LibreWolf patches...${NC}"

    mkdir -p "$PATCHES_DIR"

    # List of Vitamin-specific files to add
    VITAMIN_FILES=(
        "actors/VitaminPoisonChild.sys.mjs"
        "actors/VitaminPoisonParent.sys.mjs"
        "actors/VitaminStartPageChild.sys.mjs"
        "actors/VitaminStartPageParent.sys.mjs"
        "modules/VitaminPoison.sys.mjs"
        "chrome/browser/content/browser/vitamin-newtab.html"
        "chrome/browser/content/browser/vitamin-welcome.html"
        "chrome/browser/content/browser/vitamin-poison-settings.html"
        "chrome/browser/content/browser/vitamin-poison-content.js"
        "chrome/browser/content/browser/vitaminpoison.css"
        "chrome/browser/skin/classic/browser/vitamin-poison.svg"
        "chrome/browser/skin/classic/browser/vitamin-poison-active.svg"
    )

    echo "Creating new-files patch..."

    # Create a patch that adds all Vitamin files
    PATCH_FILE="$PATCHES_DIR/vitamin-browser.patch"
    echo "# Vitamin Browser Patch" > "$PATCH_FILE"
    echo "# Apply to LibreWolf browser-omni source" >> "$PATCH_FILE"
    echo "" >> "$PATCH_FILE"

    for file in "${VITAMIN_FILES[@]}"; do
        if [ -f "$BUILD_DIR/$file" ]; then
            echo "--- /dev/null" >> "$PATCH_FILE"
            echo "+++ b/$file" >> "$PATCH_FILE"
            echo "@@ -0,0 +1,$(wc -l < "$BUILD_DIR/$file") @@" >> "$PATCH_FILE"
            sed 's/^/+/' "$BUILD_DIR/$file" >> "$PATCH_FILE"
            echo "" >> "$PATCH_FILE"
        fi
    done

    echo -e "${GREEN}Generated: $PATCH_FILE${NC}"

    # Also create a copy-files script for easier integration
    COPY_SCRIPT="$PATCHES_DIR/apply-vitamin.sh"
    cat > "$COPY_SCRIPT" << 'SCRIPT'
#!/bin/bash
# Apply Vitamin files to LibreWolf source
# Usage: ./apply-vitamin.sh /path/to/librewolf-source

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/librewolf-source"
    exit 1
fi

TARGET="$1"
SOURCE="$(dirname "$0")/../src/browser-omni"

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
SCRIPT
    chmod +x "$COPY_SCRIPT"

    echo -e "${GREEN}Generated: $COPY_SCRIPT${NC}"
}

build_deb() {
    echo -e "${YELLOW}Building .deb package...${NC}"
    echo ""
    echo "To build a proper .deb, you need to:"
    echo ""
    echo "1. Clone LibreWolf source:"
    echo "   git clone --recursive https://codeberg.org/librewolf/source.git librewolf-source"
    echo ""
    echo "2. Apply Vitamin patches:"
    echo "   ./patches/apply-vitamin.sh librewolf-source"
    echo ""
    echo "3. Build using LibreWolf's bsys6:"
    echo "   cd librewolf-source"
    echo "   make deb"
    echo ""
    echo "See: https://codeberg.org/librewolf/bsys6"
}

# Main
case "${1:-help}" in
    omni)
        build_omni
        ;;
    patches)
        generate_patches
        ;;
    deb)
        build_deb
        ;;
    help|*)
        show_help
        ;;
esac
