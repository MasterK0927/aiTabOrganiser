const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const browserTarget = process.env.BROWSER_TARGET || 'chrome';
if (!['chrome', 'firefox'].includes(browserTarget)) {
  console.error(`Invalid browser target: ${browserTarget}. Must be 'chrome' or 'firefox'.`);
  process.exit(1);
}

console.log(`Building for ${browserTarget}...`);

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist', browserTarget);

fs.ensureDirSync(distDir);

try {
  const manifestPath = path.join(rootDir, `manifest.${browserTarget}.json`);
  const targetManifestPath = path.join(distDir, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }
  
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  try {
    JSON.parse(manifestContent);
  } catch (e) {
    throw new Error(`Invalid JSON in manifest file: ${e.message}`);
  }
  
  fs.copyFileSync(manifestPath, targetManifestPath);
  console.log(`Copied manifest for ${browserTarget}`);
} catch (error) {
  console.error(`Error processing manifest: ${error.message}`);
  process.exit(1);
}

// Copy all HTML, CSS, and icon files
['html', 'css'].forEach(ext => {
  const files = fs.readdirSync(rootDir).filter(file => file.endsWith(`.${ext}`));
  files.forEach(file => {
    console.log(`Copying ${file} to ${path.join(distDir, file)}`);
    fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
  });
});

// Create directories
fs.ensureDirSync(path.join(distDir, 'utils'));
if (fs.existsSync(path.join(rootDir, 'icons'))) {
  fs.copySync(path.join(rootDir, 'icons'), path.join(distDir, 'icons'));
}

// Process JS files
const processJsFile = (filePath, targetPath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    content = content.replace(/__BROWSER_TARGET__/g, browserTarget);
    
    fs.writeFileSync(targetPath, content);
  } catch (error) {
    console.error(`Error processing JS file ${filePath}: ${error.message}`);
  }
};

// Copy and process JS files
const copyAndProcessJs = (dir, targetDir) => {
  fs.readdirSync(dir).forEach(file => {
    const sourcePath = path.join(dir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      fs.ensureDirSync(targetPath);
      copyAndProcessJs(sourcePath, targetPath);
    } else if (file.endsWith('.js')) {
      processJsFile(sourcePath, targetPath);
    }
  });
};

// Process JS files in root and utils directories
[
  'background.js', 
  'popup.js', 
  'sandbox.js', 
  'ml-model.js',
].forEach(file => {
  if (fs.existsSync(path.join(rootDir, file))) {
    processJsFile(
      path.join(rootDir, file),
      path.join(distDir, file)
    );
  }
});

copyAndProcessJs(path.join(rootDir, 'utils'), path.join(distDir, 'utils'));

console.log(`Build for ${browserTarget} completed!`);