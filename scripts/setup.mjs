import utilsFSPkg from "@ionic/utils-fs";
import { join, resolve } from "node:path";

const { copy, remove, mkdirp, readFile, writeFile, pathExists } = utilsFSPkg;

const platformDir = process.env["INIT_CWD"];
const appDir = join(platformDir, "android", "app");
const srcMainDir = join(appDir, "src", "main");
const resDirAbs = join(srcMainDir, "res");
const config = JSON.parse(process.env["CAPACITOR_CONFIG"]);

const appId = config.appId;
const appName = config.appName
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/"/g, '\\"')
  .replace(/'/g, "\\'");

const buildGradlePath = resolve(appDir, "build.gradle");

const domainPath = appId.split(".").join("/");
// Make the package source path to the new plugin Java file
const newJavaPath = resolve(srcMainDir, `java/${domainPath}`);

if (!(await pathExists(newJavaPath))) {
  await mkdirp(newJavaPath);
}

await copy(
  resolve(srcMainDir, "java/com/getcapacitor/myapp/MainActivity.java"),
  resolve(newJavaPath, "MainActivity.java")
);

if (appId.split(".")[1] !== "getcapacitor") {
  await remove(resolve(srcMainDir, "java/com/getcapacitor"));
}

// Remove our template 'com' folder if their ID doesn't have it
if (appId.split(".")[0] !== "com") {
  await remove(resolve(srcMainDir, "java/com/"));
}

// Update the package in the MainActivity java file
const activityPath = resolve(newJavaPath, "MainActivity.java");
let activityContent = await readFile(activityPath, { encoding: "utf-8" });

activityContent = activityContent.replace(
  /package ([^;]*)/,
  `package ${appId}`
);
await writeFile(activityPath, activityContent, { encoding: "utf-8" });

// Update the applicationId in build.gradle
let gradleContent = await readFile(buildGradlePath, { encoding: "utf-8" });
gradleContent = gradleContent.replace(
  /applicationId "[^"]+"/,
  `applicationId "${appId}"`
);
// Update the namespace in build.gradle
gradleContent = gradleContent.replace(
  /namespace "[^"]+"/,
  `namespace "${appId}"`
);

await writeFile(buildGradlePath, gradleContent, { encoding: "utf-8" });

// Update the settings in res/values/strings.xml
const stringsPath = resolve(resDirAbs, "values/strings.xml");
let stringsContent = await readFile(stringsPath, { encoding: "utf-8" });
stringsContent = stringsContent.replace(/com.getcapacitor.myapp/g, appId);
stringsContent = stringsContent.replace(/My App/g, appName);

await writeFile(stringsPath, stringsContent);
