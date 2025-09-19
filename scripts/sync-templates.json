const fs = require("fs");
const path = require("path");

const tenants = ["devops", "feature", "synergis"]; // Add more tenants if needed
const templateRoot = path.join(__dirname, "..", "_template");
const repoRoot = path.join(__dirname, "..");

// Recursively walk through _template folder
function syncTemplates(dir, relativePath = "") {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const templatePath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stat = fs.statSync(templatePath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      syncTemplates(templatePath, relPath);
    } else if (item === "appsettings.json") {
      // Found appsettings.json -> copy to each tenant
      tenants.forEach(tenant => {
        const targetPath = path.join(repoRoot, tenant, relPath);

        // Ensure target directory exists
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        // Copy file
        fs.copyFileSync(templatePath, targetPath);
        console.log(`Synced ${relPath} -> ${tenant}/${relPath}`);
      });
    }
  });
}

syncTemplates(templateRoot);
