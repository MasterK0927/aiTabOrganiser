#!/bin/bash

# Display usage information
function show_usage {
  echo "Usage: $0 [chrome|firefox|all]"
  echo ""
  echo "Options:"
  echo "  chrome    Build for Chrome only"
  echo "  firefox   Build for Firefox only"
  echo "  all       Build for both browsers (default)"
  echo ""
  exit 1
}

# Check arguments
if [ "$#" -gt 1 ]; then
  show_usage
fi

TARGET=${1:-all}

# Validate target
if [[ "$TARGET" != "chrome" && "$TARGET" != "firefox" && "$TARGET" != "all" ]]; then
  echo "Error: Invalid target '$TARGET'"
  show_usage
fi

# Clean up
rm -rf dist

# Build for specified targets
if [[ "$TARGET" == "chrome" || "$TARGET" == "all" ]]; then
  echo "Building for Chrome..."
  BROWSER_TARGET=chrome node build/build.js
  
  # Create a ZIP file
  echo "Packaging Chrome extension..."
  mkdir -p dist/packages
  (cd dist/chrome && zip -r ../packages/ai-tab-manager-chrome.zip *)
  
  # Create a CRX if the key exists
  if [ -f "release-key.pem" ]; then
    echo "Building CRX file for Chrome..."
    npx crx pack dist/chrome -o dist/packages/ai-tab-manager-chrome.crx -p release-key.pem
    echo "Chrome CRX build complete: dist/packages/ai-tab-manager-chrome.crx"
  else
    echo "Warning: release-key.pem not found. Skipping CRX generation."
    echo "To generate a key, run: npm run key:generate"
  fi
  
  echo "Chrome build complete: dist/packages/ai-tab-manager-chrome.zip"
fi

if [[ "$TARGET" == "firefox" || "$TARGET" == "all" ]]; then
  echo "Building for Firefox..."
  BROWSER_TARGET=firefox node build/build.js
  
  echo "Packaging Firefox extension (XPI)..."
  mkdir -p dist/packages
  
  # Create the zip
  (cd dist/firefox && zip -r ../packages/ai-tab-manager-firefox.zip *)
  
  # Create an XPI
  cp dist/packages/ai-tab-manager-firefox.zip dist/packages/ai-tab-manager-firefox.xpi
  
  echo "Firefox build complete: dist/packages/ai-tab-manager-firefox.xpi"
fi

echo "Build process completed successfully!"