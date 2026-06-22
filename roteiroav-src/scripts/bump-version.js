const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../src/version.ts');

function bumpVersion() {
    try {
        const content = fs.readFileSync(versionFilePath, 'utf8');

        // Match VERSION = '0.1.0-beta.1'
        const versionMatch = content.match(/VERSION = ['"]([^'"]+)['"]/);
        const buildMatch = content.match(/BUILD_NUMBER = (\d+)/);

        if (!versionMatch || !buildMatch) {
            console.error("Could not find VERSION or BUILD_NUMBER in version.ts");
            return;
        }

        let currentVersion = versionMatch[1];
        let buildNumber = parseInt(buildMatch[1]);

        // Simple bump: increment the pre-release number (e.g., beta.1 -> beta.2)
        // Format: x.y.z-phase.n
        const parts = currentVersion.split('-');
        if (parts.length > 1) {
            const preParts = parts[1].split('.');
            if (preParts.length > 1) {
                const num = parseInt(preParts[preParts.length - 1]);
                preParts[preParts.length - 1] = (num + 1).toString();
                currentVersion = `${parts[0]}-${preParts.join('.')}`;
            }
        } else {
            // If no pre-release suffix, increment patch
            const vParts = parts[0].split('.');
            vParts[vParts.length - 1] = (parseInt(vParts[vParts.length - 1]) + 1).toString();
            currentVersion = vParts.join('.');
        }

        buildNumber += 1;
        const today = new Date().toISOString().split('T')[0];

        let newContent = content.replace(/VERSION = ['"][^'"]+['"]/, `VERSION = '${currentVersion}'`);
        newContent = newContent.replace(/BUILD_NUMBER = \d+/, `BUILD_NUMBER = ${buildNumber}`);
        newContent = newContent.replace(/LAST_UPDATE = ['"][^'"]+['"]/, `LAST_UPDATE = '${today}'`);

        fs.writeFileSync(versionFilePath, newContent);
        console.log(`Bumped to version ${currentVersion} (Build ${buildNumber})`);
    } catch (err) {
        console.error("Error bumping version:", err);
    }
}

bumpVersion();
