import { MobileProject } from "@trapezedev/project";

const platformDir = process.env["INIT_CWD"];
const capConfig = JSON.parse(process.env["CAPACITOR_CONFIG"]);

const appId = capConfig.appId;
const appName = capConfig.appName
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/"/g, '\\"')
  .replace(/'/g, "\\'");

try {
  const project = new MobileProject(platformDir, {
    android: {
      path: "android",
    },
    enableAndroid: true,
    enableIos: false,
  });

  await project.load();

  // Update the namespace in build.gradle
  // Update the applicationId in build.gradle
  await project.android.setPackageName(appId);
  await project.android.setAppName(appName);

  // Update the settings in res/values/strings.xml
  const stringsXml = project.android.getResourceXmlFile("values/strings.xml");
  await stringsXml.load();

  stringsXml.replaceFragment(
    "resources/string[@name='title_activity_main']",
    `<string name="title_activity_main">${appName}</string>`,
  );
  stringsXml.replaceFragment(
    "resources/string[@name='package_name']",
    `<string name="package_name">${appId}</string>`,
  );
  stringsXml.replaceFragment(
    "resources/string[@name='custom_url_scheme']",
    `<string name="custom_url_scheme">${appId}</string>`,
  );

  await project.commit();
} catch (err) {
  console.error(`Could not configure native project: ${err}`);
}
