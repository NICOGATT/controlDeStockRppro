const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "dist", "index.html");
let html = fs.readFileSync(file, "utf8");

// convierte href="/..." y src="/..." a href="./..." y src="./..."
html = html.replace(/(src|href)=\"\//g, '$1="./');

// Copiar assets de React Navigation al dist
const srcAssets = path.join(__dirname, "..", "node_modules", "@react-navigation", "elements", "lib", "module", "assets");
const destAssets = path.join(__dirname, "..", "dist", "assets");

if (fs.existsSync(srcAssets)) {
    if (!fs.existsSync(destAssets)) {
        fs.mkdirSync(destAssets, { recursive: true });
    }
    const files = fs.readdirSync(srcAssets);
    files.forEach(f => {
        fs.copyFileSync(path.join(srcAssets, f), path.join(destAssets, f));
    });
    console.log(`✅ Copied ${files.length} React Navigation assets`);
}

// Agregar estilos CSS para visibilidad del header en Electron
const styleFix = `
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
  #root { display: flex; height: 100%; flex: 1; }
  
  /* Header styles */
  [class*="header"],
  [class*="Header"] {
    background-color: #15151a !important;
    color: #ffffff !important;
    display: flex !important;
    visibility: visible !important;
  }
  
  /* Header buttons */
  [class*="headerButton"],
  [class*="backButton"],
  [class*="back"],
  [class*="Back"] {
    color: #ffffff !important;
    fill: #ffffff !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Header title */
  [class*="headerTitle"],
  [class*="title"] {
    color: #ffffff !important;
  }
  
  /* Ensure all icons/text in header are visible */
  header *, [class*="header"] * {
    color: #ffffff !important;
    visibility: visible !important;
  }
</style>
`;

// Insertar antes del cierre de </head>
html = html.replace("</head>", styleFix + "</head>");

fs.writeFileSync(file, html, "utf8");
console.log("✅ Fixed paths and added header visibility styles for Electron");