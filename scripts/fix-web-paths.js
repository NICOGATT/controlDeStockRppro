const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "dist", "index.html");
let html = fs.readFileSync(file, "utf8");

// convierte href="/..." y src="/..." a href="./..." y src="./..."
html = html.replace(/(src|href)=\"\//g, '$1="./');

fs.writeFileSync(file, html, "utf8");
console.log("✅ Fixed paths in dist/index.html");