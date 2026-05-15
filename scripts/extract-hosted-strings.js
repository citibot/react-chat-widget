const fs = require("fs");

const source = fs.readFileSync("hosted-main.779124ca.js", "utf8");
const pattern = /"([^"]+)"/g;
const matches = [];
let match;

while ((match = pattern.exec(source))) {
  const value = match[1];
  if (
    value.includes("api-v2") ||
    value.includes("preview") ||
    value.includes("account") ||
    value.includes("widget") ||
    value.includes("chat") ||
    value.includes("citibot") ||
    value.includes("bot") ||
    value.startsWith("/")
  ) {
    matches.push(value);
  }
}

console.log([...new Set(matches)].slice(0, 500).join("\n"));
