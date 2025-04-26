# Changelog

All notable changes to AI Tab Organiser will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation in `docs/` folder
- Installation, user, and developer guides
- API reference and troubleshooting documentation

### Changed
- Enhanced project documentation structure

## [1.5.0] - 2025-04-19

### Added
- Option for grouping tabs of select windows
- Window-specific tab analysis
- Settings for tab source configuration (current window, all windows, specific window)
- Enhanced window management in settings

### Changed
- Improved tab source selection interface
- Better handling of multi-window environments

### Fixed
- Window ID handling for tab grouping
- Settings persistence for window preferences

## [1.4.0] - 2025-04-19

### Added
- Comprehensive settings page
- Support for custom grouping rules
- Advanced configuration options for ML algorithm
- Theme customization options
- Import/export functionality for settings

### Changed
- Enhanced user interface with better settings organization
- Improved animations and transitions
- More intuitive configuration workflows

### Fixed
- Settings persistence across browser sessions
- Theme switching reliability

## [1.3.0] - 2025-04-18

### Added
- Interactive onboarding tutorial
- Step-by-step feature introduction
- Settings page onboarding flow
- Guided tour for new users

### Changed
- Improved first-time user experience
- Better feature discovery
- Enhanced tooltips and help text

### Fixed
- Onboarding completion tracking
- Tutorial navigation issues

## [1.2.0] - 2025-04-18

### Added
- Firefox browser support
- Cross-browser compatibility layer
- Browser-specific build system
- Firefox-specific manifest and features

### Changed
- **Major UI overhaul** with improved design
- Enhanced performance in tab management
- Better cross-browser API abstraction
- Improved sandboxing functionality for Firefox

### Fixed
- Firefox sandboxing implementation
- Cross-browser permission handling
- UI consistency across browsers

### Technical
- Unified build system for Chrome and Firefox
- Browser detection and feature adaptation
- Improved error handling for different browser APIs

## [1.1.0] - 2025-02-02

### Added
- **Dark Mode support** with automatic theme detection
- **Tab sandboxing** for secure browsing environments
- **Tab stacking** feature for better organization
- Theme persistence across sessions

### Changed
- Enhanced UI with dark/light theme options
- Improved visual design and accessibility
- Better tab grouping visualization

### Fixed
- Theme switching performance
- Sandbox isolation reliability
- Tab stack management

## [1.0.0] - 2025-01-15

### Added
- Initial release of AI Tab Organiser
- **Intelligent tab grouping** using machine learning
- **Workspace management** system
- **Tab analysis** with similarity detection
- Chrome browser support
- Basic UI with popup interface
- Storage system for workspaces
- Tab preview functionality

### Features
- Automatic tab similarity analysis
- Workspace creation and management
- Tab grouping based on content and URL patterns
- Simple and intuitive user interface
- Local data storage (no external servers)

---

## Release Guidelines

### Version Numbers
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (1.X.0)**: New features, non-breaking changes
- **Patch (1.1.X)**: Bug fixes, small improvements

### Changelog Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### How to Update This Changelog

When releasing a new version:

1. **Move unreleased items** to the new version section
2. **Add release date** in YYYY-MM-DD format
3. **Create new [Unreleased] section** at the top
4. **Update version links** at the bottom (if using GitHub releases)
5. **Follow Keep a Changelog format** for consistency

### Example Entry Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature descriptions
- List of additions

### Changed
- Modified functionality descriptions
- Updated behaviors

### Fixed
- Bug fix descriptions
- Issue resolutions

### Security
- Security-related changes
```

### Contributor Guidelines

When contributing:
- **Update CHANGELOG.md** with your changes
- **Use present tense** ("Add feature" not "Added feature")
- **Be specific** about what changed
- **Reference issues** when applicable (#123)
- **Group related changes** under appropriate categories

---

## Links

- [GitHub Repository](https://github.com/masterK0927/aiTabOrganiser)
- [Releases](https://github.com/masterK0927/aiTabOrganiser/releases)
- [Issues](https://github.com/masterK0927/aiTabOrganiser/issues)
- [Documentation](./README.md)