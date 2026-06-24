import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const alias = process.env.ANDROID_KEY_ALIAS;
const password = process.env.ANDROID_KEY_PASSWORD;
const keyBase64 = process.env.ANDROID_KEY_BASE64;
const runnerTemp = process.env.RUNNER_TEMP;

if (!alias || !password || !keyBase64 || !runnerTemp) {
  throw new Error("Missing Android signing environment variables.");
}

const androidRoot = resolve("src-tauri", "gen", "android");
const keystorePath = resolve(runnerTemp, "android-release.keystore");
const propertiesPath = resolve(androidRoot, "keystore.properties");
const buildGradlePath = resolve(androidRoot, "app", "build.gradle.kts");

writeFileSync(keystorePath, Buffer.from(keyBase64, "base64"));
writeFileSync(
  propertiesPath,
  [
    `keyAlias=${alias}`,
    `password=${password}`,
    `storeFile=${keystorePath}`,
    "",
  ].join("\n"),
);

const original = readFileSync(buildGradlePath, "utf8");
let updated = original;

if (!updated.includes("import java.io.FileInputStream")) {
  updated = updated.replace(
    "import java.util.Properties\n",
    "import java.util.Properties\nimport java.io.FileInputStream\n",
  );
}

if (!updated.includes("signingConfigs")) {
  const signingBlock = `    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            val keystoreProperties = Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["password"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["password"] as String
        }
    }

`;
  updated = updated.replace("    buildTypes {\n", `${signingBlock}    buildTypes {\n`);
}

if (!updated.includes('signingConfig = signingConfigs.getByName("release")')) {
  updated = updated.replace(
    '        getByName("release") {\n',
    '        getByName("release") {\n            signingConfig = signingConfigs.getByName("release")\n',
  );
}

writeFileSync(buildGradlePath, updated);
