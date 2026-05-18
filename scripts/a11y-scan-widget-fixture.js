const fs = require("fs");
const { chromium } = require("playwright");

const url =
  process.env.A11Y_URL ||
  "http://127.0.0.1:4173/a11y-widget-fixture.html";
const summaryPath = process.env.A11Y_SUMMARY_PATH || "a11y-results.md";

const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const axeOptions = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
  },
};

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

async function runAxe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate((options) => axe.run(document, options), axeOptions);

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
    "## ADA Compliance Check",
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
          lines.push(
            `    ${node.failureSummary.replace(/\n/g, "\n    ")}`
          );
        }
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle" });

  const results = [];

  await page.waitForSelector(".rcw-launcher", { timeout: 30000 });
  results.push(await runAxe(page, "Collapsed widget fixture"));

  await page.click(".rcw-launcher");
  await page.waitForSelector("#rcw-conversation-container", {
    timeout: 30000,
  });
  results.push(await runAxe(page, "Expanded widget fixture"));

  await page.click(".quick-button");
  results.push(await runAxe(page, "Quick button response fixture"));

  await page.fill(".rcw-input", "Accessibility scan user message");
  await page.press(".rcw-input", "Enter");
  results.push(await runAxe(page, "User message response fixture"));

  await browser.close();

  const violations = results.reduce(
    (sum, result) => sum + result.violations.length,
    0
  );
  fs.writeFileSync(summaryPath, renderSummary(results));

  process.exitCode = violations ? 1 : 0;
})().catch((error) => {
  console.error(error);
  fs.writeFileSync(
    summaryPath,
    [
      "## ADA Compliance Check",
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
