const fs = require("fs");
const path = require("path");

const tenants = ["devops", "feature", "synergis"];
const templateRoot = path.join(__dirname, "..", "_template");
const repoRoot = path.join(__dirname, "..");

// Tenant-specific overrides
const tenantOverrides = {
  "devops/Viewer/AuthProxy/appsettings.json": {
    IPs: ["10.1.1.10"]
  },
  "feature/Viewer/AuthProxy/appsettings.json": {
    IPs: ["10.2.2.20"]
  },
  "synergis/Viewer/AuthProxy/appsettings.json": {
    IPs: ["10.3.3.30"]
  }
};

// Recursively walk through _template folder
function syncTemplates(dir, relativePath = "") {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const templatePath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stat = fs.statSync(templatePath);

    if (stat.isDirectory()) {
      syncTemplates(templatePath, relPath);
    } else if (item === "appsettings.json") {
      try {
        const content = JSON.parse(fs.readFileSync(templatePath, "utf8"));

        tenants.forEach(tenant => {
          const targetPath = path.join(repoRoot, tenant, relPath);

          fs.mkdirSync(path.dirname(targetPath), { recursive: true });

          // Merge template + tenant overrides
          const key = `${tenant}/${relPath.replace(/\\/g, "/")}`;
          const updated = {
            ...content,
            ...(tenantOverrides[key] || {})
          };

          fs.writeFileSync(targetPath, JSON.stringify(updated, null, 2));
          console.log(`Synced ${relPath} -> ${tenant}/${relPath}`);
        });

      } catch (err) {
        console.error(`❌ Invalid JSON in ${templatePath}: ${err.message}`);
        process.exit(1);
      }
    }
  });
}

syncTemplates(templateRoot);
