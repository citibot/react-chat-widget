const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const falkorMonoDir = process.env.FALKOR_MONO_PATH
  ? path.resolve(process.env.FALKOR_MONO_PATH)
  : path.resolve(rootDir, "..", "falkor-mono");
const falkorWebChatDir = path.join(falkorMonoDir, "frontend", "web-chat-ui");
const tempDir = path.join(rootDir, ".local-web-chat-ui-build");
const outputDir = path.join(rootDir, "local-webchat");
const envPath = path.join(rootDir, ".env");
const htmlPath = path.join(rootDir, "local-chat-widget.html");

const requiredKeys = [
  "ACCOUNT_ID",
  "STAGE_API_BASE_URL",
  "STAGE_ENGINE_BASE_URL",
  "STAGE_TRANSLATE_URL",
  "CONFIG_TOKEN",
  "ENGINE_TOKEN",
  "USER_AVATAR",
  "DEFAULT_ACCOUNT_ICON_SIZE",
];

function parseEnv(text) {
  return text.split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return env;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return env;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
    return env;
  }, {});
}

function removeDirectory(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyWebChatSource() {
  removeDirectory(tempDir);
  fs.cpSync(falkorWebChatDir, tempDir, {
    recursive: true,
    filter: (source) => {
      const name = path.basename(source);
      return name !== "node_modules" && name !== "build" && name !== ".env";
    },
  });
}

function writeWebChatEnv(env) {
  const webChatUrl = env.LOCAL_WEB_CHAT_URL || "http://127.0.0.1:4173/local-webchat";
  const values = {
    REACT_APP_BUDIBASE_TOKEN: env.REACT_APP_BUDIBASE_TOKEN || env.CONFIG_TOKEN,
    REACT_APP_WEBCHAT_TOKEN: env.REACT_APP_WEBCHAT_TOKEN || env.ENGINE_TOKEN,
    REACT_APP_PLACEHOLDER_IMAGE: env.REACT_APP_PLACEHOLDER_IMAGE || "",
    REACT_APP_SPEAKER: env.REACT_APP_SPEAKER || "https://webchat-icon-stage.citibot.net/speaker.svg",
    REACT_APP_SPEAKER_MUTE:
      env.REACT_APP_SPEAKER_MUTE || "https://webchat-icon-stage.citibot.net/speaker-mute.svg",
    REACT_APP_USER_AVATAR: env.REACT_APP_USER_AVATAR || env.USER_AVATAR,
    REACT_APP_API_URL: env.REACT_APP_API_URL || env.STAGE_API_BASE_URL,
    REACT_APP_ENGINE_URL: env.REACT_APP_ENGINE_URL || env.STAGE_ENGINE_BASE_URL,
    REACT_APP_TRANSLATION_URL: env.REACT_APP_TRANSLATION_URL || env.STAGE_TRANSLATE_URL,
    WEB_CHAT_URL: webChatUrl,
    REACT_APP_CITIBOT_LANDING_PAGE_URL:
      env.REACT_APP_CITIBOT_LANDING_PAGE_URL || "https://citibot.io",
    API_ENCRYPTION_KEY: env.API_ENCRYPTION_KEY || env.CONFIG_TOKEN,
  };

  const envFile = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(path.join(tempDir, ".env"), `${envFile}\n`);
}

function useLocalWidgetPackage() {
  const packedFileName = execSync(`npm pack --pack-destination "${tempDir}"`, {
    cwd: rootDir,
    encoding: "utf8",
  })
    .trim()
    .split(/\r?\n/)
    .pop();
  const packedWidgetPath = path.join(tempDir, packedFileName);
  const packagePath = path.join(tempDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  packageJson.dependencies["@falkor/react-chat-widget"] = `file:${packedWidgetPath.replace(/\\/g, "/")}`;
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const lockPath = path.join(tempDir, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath);
  }
}

function copyBuildOutput() {
  const buildDir = path.join(tempDir, "build");
  const jsDir = path.join(buildDir, "static", "js");
  const cssDir = path.join(buildDir, "static", "css");
  const mainJs = fs.readdirSync(jsDir).find((file) => /^main\..*\.js$/.test(file));
  const mainCss = fs.readdirSync(cssDir).find((file) => /^main\..*\.css$/.test(file));

  if (!mainJs || !mainCss) {
    throw new Error("Could not find CRA main JS/CSS output in web-chat-ui build.");
  }

  removeDirectory(outputDir);
  fs.cpSync(buildDir, outputDir, { recursive: true });
  fs.copyFileSync(path.join(jsDir, mainJs), path.join(outputDir, "index.js"));
  fs.copyFileSync(path.join(cssDir, mainCss), path.join(outputDir, "index.css"));
}

function writeHtml(env) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Local Chat Widget</title>
  </head>
  <body>
    <script
      src="local-webchat/script.js?account_id=${env.ACCOUNT_ID}"
      id="citibot-chatscript"
      async
    ></script>
  </body>
</html>
`;
  fs.writeFileSync(htmlPath, html);
}

if (!fs.existsSync(envPath)) {
  throw new Error("Missing .env. Copy .env-example to .env and fill in the local build values.");
}

if (!fs.existsSync(falkorWebChatDir)) {
  throw new Error(`Could not find falkor-mono web-chat-ui at ${falkorWebChatDir}`);
}

const env = parseEnv(fs.readFileSync(envPath, "utf8"));
const missingKeys = requiredKeys.filter((key) => !env[key]);
if (missingKeys.length) {
  throw new Error(`Missing required .env value(s): ${missingKeys.join(", ")}`);
}

copyWebChatSource();
useLocalWidgetPackage();
writeWebChatEnv(env);

execSync("npm install", { cwd: tempDir, stdio: "inherit" });
execSync("npx react-scripts build", {
  cwd: tempDir,
  stdio: "inherit",
  env: { ...process.env, CI: "false", DISABLE_ESLINT_PLUGIN: "true" },
});
execSync("node generateScript.js", { cwd: tempDir, stdio: "inherit" });

copyBuildOutput();
writeHtml(env);
removeDirectory(tempDir);

console.log("Generated local-chat-widget.html and local-webchat/ from falkor-mono web-chat-ui.");
