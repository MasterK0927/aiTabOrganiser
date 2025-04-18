# AI Tab Organiser

## Overview

Ever find yourself drowning in countless open tabs across multiple projects? AI Tab Organiser is here to save your time and provide you organised workspaces, all just in a single click, eliminating the fuss of organising tabs manually.

## Key Features

- **Intelligent Tab Grouping**: Automatically organize tabs into meaningful workspaces based on content similarity
- **Workspace Management**: Easily create, rename, and switch between different tab collections
- **Tab Preview**: View tab contents without switching context
- **Dark Mode Support**: Full light/dark theme integration
- **Tab Sandboxing**: Safely isolate tab sessions
- **Tab Stacking**: Organize related tabs in vertical stacks
- **Cross-browser Support**: Works on Chrome/Chromium and Firefox browsers

## How It Works?

### Analyzing Tabs

When you click the "Analyze Tabs" button, the extension:
1. Looks at your currently open tabs
2. Groups tabs based on their similarities, predicted by our Machine learning algorithm
3. Creates workspaces that make sense for your browsing habits

### Workspace Management

- **View Workspaces**: See all your organized tab collections in one place
- **Rename Workspaces**: Customize workspace names to match your projects
- **Switch Between Workspaces**: Open all tabs in a workspace with one click
- **Delete Workspaces**: Remove workspaces you no longer need

## Installation

### From Releases
1. Download the latest release for your browser from the [Releases page](../../releases)
2. For Chrome/Chromium:
   - Go to `chrome://extensions/`
   - Enable "Developer Mode"
   - Drag and drop the downloaded `.crx` file
3. For Firefox:
   - Go to `about:addons`
   - Click the gear icon and select "Install Add-on From File..."
   - Select the downloaded `.xpi` file

### Common Issues

- **No Workspaces Created**: 
  - Ensure you have multiple tabs open
  - Check browser permissions

- **Tabs Not Switching Properly**:
  - Restart the browser
  - Reinstall the extension

## Privacy & Performance

- **Privacy**: We don't collect or store the browsing data
- **Performance**: Lightweight and designed to be fast

## Contributing

Love the project? Here's how you can help:

1. Star the GitHub repository
2. Report bugs
3. Submit pull requests
4. Share with other fellow developers

### Development Setup

```bash
# Clone the repository
git clone https://github.com/masterK0927/aiTabOrganiser.git

# Navigate to project directory
cd aiTabOrganiser

# Install dependencies
npm install

# Give permission to the build script
chmod +x build.sh

# Build the extension for all supported browsers
# This will create a `dist` folder with the extension files
# dist/packages
./build.sh all

# Build the extension for a specific browser
./build.sh chrome
# or
./build.sh firefox
```

## Roadmap for future development

- [ ] Cloud sync for workspaces
- [ ] Customizable workspace rules
- [ ] Export/Import workspace configurations

## Support

Ran into a problem? I am here to help!
- Email: masterK0927@protonmail.com
- Issues: GitHub Issues Page

## License

MIT License - Free for personal and commercial use.

---

Made by [Keshav]