# Vitamin Browser Version Overview

## Current Production Version (ACTIVE)
- **Location**: `~/librewolf/`
- **Version**: v146.0.1-1 (Librewolf-based)
- **Type**: Production-ready browser
- **Status**: ✅ ACTIVE AND RUNNING

## Development Versions

### Vitamin Electron Development (DEPRECATED)
- **Location**: `vitamin-electron-development/`
- **Type**: Electron-based development
- **Status**: ⚠️ DEPRECATED - No longer maintained
- **Size**: 1.9GB

### Mac Build Artifacts (ARCHIVED)
- **Location**: `vitamin-mac-build-artifacts/` 
- **Type**: Mac-specific compilation artifacts
- **Status**: 🔄 ARCHIVED - Mac build outputs
- **Size**: 1.4GB (down from 6.8GB after cleanup)

### Essential Build Artifacts
- **Location**: `essential-build-artifacts/`
- **Type**: Preserved browser executables
- **Status**: 🔄 ESSENTIAL FILES PRESERVED

## Development Infrastructure

### LibreWolf Build System
- **Location**: `librewolf-vitamin/`
- **Type**: Firefox-based build system
- **Status**: 🔧 BUILD INFRASTRUCTURE

### Releases & Distribution
- **Location**: `vitamin-releases/`
- **Type**: Release management
- **Status**: 📦 RELEASE MANAGEMENT

## Summary
- **Production**: Use the browser in `~/librewolf/` (auto-starting)
- **Development**: Focus on `librewolf-vitamin/` build system
- **Electronic versions**: Consider removing the deprecated Electron version
- **Space Usage**: Cleaned up from 12.6GB → 4.2GB (-67% reduction)

**Note**: All essential files preserved. Deprecated versions can be safely archived or removed when storage space is needed.

## License

Vitamin Browser is free and open-source software (FOSS) released under GPL-3.0 / MPL-2.0.
See [LICENSE](./LICENSE) for details.