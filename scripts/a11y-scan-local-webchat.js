const fs = require("fs");
const { chromium } = require("playwright");

const url =
  process.env.A11Y_URL || "http://127.0.0.1:4173/local-chat-widget.html";
const summaryPath =
  process.env.A11Y_SUMMARY_PATH || "a11y-local-webchat-results.md";
const selectorTimeout = Number(process.env.A11Y_SELECTOR_TIMEOUT || 30000);

const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const axeOptions = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
  },
};

let browser;

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

async function runAxe(context, label) {
  await context.addScriptTag({ content: axeSource });
  const results = await context.evaluate((options) => axe.run(document, options), axeOptions);

  console.log(`\n${label}: ${results.violations.length} violation(s)`);

  for (const violation of results.violations) {
    console.log(`\n[${violation.impact || "unknown"}] ${violation.id}: ${violation.help}`);
    console.log(violation.helpUrl);

    for (const node of violation.nodes) {
      console.log(`  - ${node.target.join(" ")}`);
      if (node.failureSummary) {
        console.log(`    ${node.failureSummary.replace(/\n/g, "\n    ")}`);
      }
    }
  }

  return {
    label,
    violations: results.violations,
  };
}

function renderSummary(results) {
  const total = results.reduce((sum, result) => sum + result.violations.length, 0);
  const lines = [
    "## ADA Compliance Check - Local Web Chat Embed",
    "",
    `Scanned: \`${url}\``,
    "",
    `**Total axe violations:** ${total}`,
    "",
  ];

  for (const result of results) {
    lines.push(`### ${result.label}`);
    lines.push("");

    if (!result.violations.length) {
      lines.push("No violations found.");
      lines.push("");
      continue;
    }

    for (const violation of result.violations) {
      lines.push(
        `- **[${violation.impact || "unknown"}] ${violation.id}:** ${violation.help}`
      );
      lines.push(`  - ${violation.helpUrl}`);

      for (const node of violation.nodes) {
        lines.push(`  - Target: \`${node.target.join(" ")}\``);
        if (node.failureSummary) {
          lines.push(`    ${node.failureSummary.replace(/\n/g, "\n    ")}`);
        }
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

(async () => {
  browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  const iframeElement = await page.waitForSelector("#citibot-chat-frame", {
    timeout: selectorTimeout,
  });
  const frame = await iframeElement.contentFrame();
  if (!frame) {
    throw new Error("Could not access local web chat iframe.");
  }

  const results = [];

  await frame.waitForSelector(".launcherBtn", { timeout: selectorTimeout });
  results.push(await runAxe(page, "Collapsed web chat host page"));
  results.push(await runAxe(frame, "Collapsed web chat iframe"));

  await frame.click(".launcherBtn");
  await frame.waitForSelector("#rcw-conversation-container", {
    timeout: selectorTimeout,
  });
  results.push(await runAxe(page, "Expanded web chat host page"));
  results.push(await runAxe(frame, "Expanded web chat iframe"));

  await browser.close();

  const violations = results.reduce(
    (sum, result) => sum + result.violations.length,
    0
  );
  fs.writeFileSync(summaryPath, renderSummary(results));

  process.exitCode = violations ? 1 : 0;
})().catch(async (error) => {
  console.error(error);
  if (browser) {
    await browser.close().catch(() => {});
  }
  fs.writeFileSync(
    summaryPath,
    [
      "## ADA Compliance Check - Local Web Chat Embed",
      "",
      "The accessibility scan failed before axe results were produced.",
      "",
      "```",
      stripAnsi(error && error.stack ? error.stack : String(error)),
      "```",
      "",
    ].join("\n")
  );
  process.exitCode = 1;
});
