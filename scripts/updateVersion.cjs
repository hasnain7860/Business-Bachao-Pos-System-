const fs = require('fs');
const path = require('path');

// 1. Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

// 2. Define Output Path (src/assets/version.json)
const outputDir = path.join(__dirname, '..', 'src', 'assets');
const outputFilePath = path.join(outputDir, 'version.json');

// Ensure directory exists
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

// 3. Create Data
const versionData = {
    version: packageJson.version,
    buildDate: new Date().toISOString().split('T')[0],
    buildTime: new Date().toLocaleTimeString(),
};

// 4. Write File
console.log(`🔹 Updating version to ${versionData.version}...`);
fs.writeFileSync(outputFilePath, JSON.stringify(versionData, null, 2));
console.log(`✅ Version file updated at src/assets/version.json`);


