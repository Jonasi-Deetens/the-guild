const fs = require("fs");
const path = require("path");

// Environment types that need background images
const environments = [
  "training_ground",
  "cave",
  "dungeon_corridor",
  "forest",
  "ruins",
  "crypt",
];

// Create a simple HTML file that can be used to generate placeholder images
const generatePlaceholderHTML = () => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; }
    .placeholder {
      width: 1920px;
      height: 1080px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 48px;
      font-weight: bold;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    }
    .training_ground { background: linear-gradient(135deg, #1a4d1a, #2d5a2d, #1a4d1a); }
    .cave { background: linear-gradient(135deg, #1a1a1a, #2a2a2a, #1a1a1a); }
    .dungeon_corridor { background: linear-gradient(135deg, #271810, #3d2820, #271810); }
    .forest { background: linear-gradient(135deg, #0a2a0a, #1a4d1a, #0a2a0a); }
    .ruins { background: linear-gradient(135deg, #2a2a2a, #4a4a4a, #2a2a2a); }
    .crypt { background: linear-gradient(135deg, #0a0a1a, #1a0a2a, #0a0a1a); }
  </style>
</head>
<body>
  ${environments
    .map(
      (env) => `
    <div class="placeholder ${env}">
      ${env.replace("_", " ").toUpperCase()}
    </div>
  `
    )
    .join("")}
</body>
</html>
`;

  fs.writeFileSync("placeholder-assets.html", html);
  console.log("✅ Generated placeholder-assets.html");
  console.log("📝 Instructions:");
  console.log("1. Open placeholder-assets.html in a browser");
  console.log("2. Take screenshots of each environment section");
  console.log("3. Convert to WebP format and save as:");
  environments.forEach((env) => {
    console.log(`   - public/assets/${env}.webp`);
  });
};

// Create the assets directory if it doesn't exist
const assetsDir = path.join(__dirname, "..", "public", "assets");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log("📁 Created public/assets directory");
}

generatePlaceholderHTML();
