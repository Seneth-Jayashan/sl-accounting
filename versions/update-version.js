const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const rootVersionPath = path.join(__dirname, 'version.json');
const packagePaths = [
  path.join(projectRoot, 'apps', 'web', 'package.json'),
  path.join(projectRoot, 'apps', 'api', 'package.json'),
  path.join(projectRoot, 'apps', 'desktop', 'package.json')
];
const tauriConfPath = path.join(projectRoot, 'apps', 'desktop', 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(projectRoot, 'apps', 'desktop', 'src-tauri', 'Cargo.toml');
const androidBuildGradlePath = path.join(projectRoot, 'apps', 'android', 'android', 'app', 'build.gradle');

let versionData;
try {
  versionData = JSON.parse(fs.readFileSync(rootVersionPath, 'utf8'));
} catch (e) {
  console.error("Could not read version.json. Make sure it exists in the root.");
  process.exit(1);
}

let currentVersion = versionData.version;
console.log(`Current version is: ${currentVersion}`);

const args = process.argv.slice(2);
const bumpType = args[0] || 'minor';

let [major, minor, patch] = currentVersion.split('.').map(Number);

if (bumpType === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (bumpType === 'minor') {
  patch += 1;
} else {
  console.error("Invalid bump type. Use 'minor' or 'major'.");
  process.exit(1);
}

const newVersion = `${major}.${minor}.${patch}`;
console.log(`Bumping to new version: ${newVersion}`);

versionData.version = newVersion;
fs.writeFileSync(rootVersionPath, JSON.stringify(versionData, null, 2) + '\n', 'utf8');
console.log('✅ Updated root version.json');

for (const pkgPath of packagePaths) {
  if (fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`✅ Updated ${path.relative(__dirname, pkgPath)}`);
  }
}

if (fs.existsSync(tauriConfPath)) {
  let tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${path.relative(__dirname, tauriConfPath)}`);
}

if (fs.existsSync(cargoTomlPath)) {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(/(name\s*=\s*"[^"]+"\nversion\s*=\s*)"[^"]+"/, `$1"${newVersion}"`);
  fs.writeFileSync(cargoTomlPath, cargoToml, 'utf8');
  console.log(`✅ Updated ${path.relative(__dirname, cargoTomlPath)}`);
}

if (fs.existsSync(androidBuildGradlePath)) {
  let gradle = fs.readFileSync(androidBuildGradlePath, 'utf8');
  const versionCode = (major * 10000) + (minor * 100) + patch;
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  fs.writeFileSync(androidBuildGradlePath, gradle, 'utf8');
  console.log(`✅ Updated ${path.relative(__dirname, androidBuildGradlePath)}`);
}

console.log(`🎉 All apps successfully updated to ${newVersion}!`);
