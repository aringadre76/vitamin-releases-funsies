#!/bin/bash
#
# Vitamin Browser - Installation Script
#
# This script installs Vitamin Browser by patching an existing LibreWolf installation.
# It backs up the original files and can be reversed with uninstall.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"

# Detect LibreWolf installation
detect_librewolf() {
    local paths=(
        "/usr/lib/librewolf"
        "/usr/lib64/librewolf"
        "/opt/librewolf"
        "/snap/librewolf/current/usr/lib/librewolf"
        "$HOME/.local/lib/librewolf"
    )

    for path in "${paths[@]}"; do
        if [ -f "$path/browser/omni.ja" ]; then
            echo "$path"
            return 0
        fi
    done

    return 1
}

check_librewolf_running() {
    if pgrep -x "librewolf" > /dev/null; then
        return 0
    fi
    return 1
}

backup_original() {
    local lw_path="$1"
    local backup_dir="$HOME/.vitamin-browser/backups/$(date +%Y%m%d_%H%M%S)"

    mkdir -p "$backup_dir"

    echo -e "${YELLOW}Backing up original files...${NC}"
    cp "$lw_path/browser/omni.ja" "$backup_dir/omni.ja"

    echo "$lw_path" > "$backup_dir/install_path"
    echo "$VERSION" > "$backup_dir/version"

    echo -e "${GREEN}Backup saved to: $backup_dir${NC}"
}

install_vitamin() {
    local lw_path="$1"

    echo -e "${CYAN}Installing Vitamin Browser v${VERSION}...${NC}"
    echo ""

    # Check for omni.ja in dist or download location
    local omni_source=""
    if [ -f "$SCRIPT_DIR/dist/browser-omni.ja" ]; then
        omni_source="$SCRIPT_DIR/dist/browser-omni.ja"
    elif [ -f "$SCRIPT_DIR/browser-omni.ja" ]; then
        omni_source="$SCRIPT_DIR/browser-omni.ja"
    else
        echo -e "${RED}Error: browser-omni.ja not found${NC}"
        echo "Run './build.sh omni' first or download from releases."
        exit 1
    fi

    # Backup
    backup_original "$lw_path"

    # Install
    echo -e "${YELLOW}Installing Vitamin omni.ja...${NC}"

    if [ -w "$lw_path/browser/omni.ja" ]; then
        cp "$omni_source" "$lw_path/browser/omni.ja"
    else
        echo "Root access required to install system-wide."
        sudo cp "$omni_source" "$lw_path/browser/omni.ja"
    fi

    # Clear caches
    echo -e "${YELLOW}Clearing browser caches...${NC}"
    rm -rf "$HOME/.cache/librewolf/*/startupCache" 2>/dev/null || true
    rm -rf "$HOME/.librewolf/*/startupCache" 2>/dev/null || true

    echo ""
    echo -e "${GREEN}Installation complete!${NC}"
    echo ""
    echo "Start LibreWolf to use Vitamin Browser."
    echo "Look for the pill icon in the toolbar to activate data poisoning."
}

uninstall_vitamin() {
    local backup_dir="$HOME/.vitamin-browser/backups"

    if [ ! -d "$backup_dir" ]; then
        echo -e "${RED}No backup found. Cannot uninstall.${NC}"
        exit 1
    fi

    # Find most recent backup
    local latest=$(ls -td "$backup_dir"/*/ 2>/dev/null | head -1)

    if [ -z "$latest" ]; then
        echo -e "${RED}No backup found.${NC}"
        exit 1
    fi

    local lw_path=$(cat "$latest/install_path")

    echo -e "${YELLOW}Restoring original LibreWolf...${NC}"

    if [ -w "$lw_path/browser/omni.ja" ]; then
        cp "$latest/omni.ja" "$lw_path/browser/omni.ja"
    else
        sudo cp "$latest/omni.ja" "$lw_path/browser/omni.ja"
    fi

    # Clear caches
    rm -rf "$HOME/.cache/librewolf/*/startupCache" 2>/dev/null || true
    rm -rf "$HOME/.librewolf/*/startupCache" 2>/dev/null || true

    echo -e "${GREEN}LibreWolf restored to original state.${NC}"
}

show_help() {
    echo -e "${CYAN}Vitamin Browser Installer${NC}"
    echo ""
    echo "Usage: ./install.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install     Install Vitamin Browser (default)"
    echo "  uninstall   Restore original LibreWolf"
    echo "  help        Show this help message"
    echo ""
}

# Main
case "${1:-install}" in
    install)
        echo -e "${CYAN}"
        echo "╔═══════════════════════════════════════╗"
        echo "║       Vitamin Browser Installer       ║"
        echo "║     Privacy-first data poisoning      ║"
        echo "╚═══════════════════════════════════════╝"
        echo -e "${NC}"

        # Check if LibreWolf is running
        if check_librewolf_running; then
            echo -e "${RED}Please close LibreWolf before installing.${NC}"
            exit 1
        fi

        # Detect LibreWolf
        LW_PATH=$(detect_librewolf) || {
            echo -e "${RED}LibreWolf not found.${NC}"
            echo ""
            echo "Please install LibreWolf first:"
            echo "  https://librewolf.net/installation/"
            exit 1
        }

        echo -e "Found LibreWolf at: ${GREEN}$LW_PATH${NC}"
        echo ""

        install_vitamin "$LW_PATH"
        ;;

    uninstall)
        if check_librewolf_running; then
            echo -e "${RED}Please close LibreWolf before uninstalling.${NC}"
            exit 1
        fi
        uninstall_vitamin
        ;;

    help|*)
        show_help
        ;;
esac
