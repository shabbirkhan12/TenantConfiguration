const fs = require("fs");
const path = require("path");

// Tenants to sync
const tenants = ["devops", "feature", "synergis"];

// Root paths
const templateRoot = path.join(__dirname, "..", "_template");
const repoRoot = path.join(__dirname, "..");

// Tenant-specific overrides (add more overrides as needed)
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

// Recursive function to sync templates
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
      try {
        // Validate template JSON
        const content = JSON.parse(fs.readFileSync(templatePath, "utf8"));

        tenants.forEach(tenant => {
          const targetPath = path.join(repoRoot, tenant, relPath);

          // Ensure target directory exists
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });

          // Merge template + tenant overrides safely
          const key = `${tenant}/${relPath.replace(/\\/g, "/")}`;
          const updated = { ...content };
          if (tenantOverrides[key]) {
            Object.keys(tenantOverrides[key]).forEach(k => {
              updated[k] = tenantOverrides[key][k];
            });
          }

          // Write synced JSON
          fs.writeFileSync(targetPath, JSON.stringify(updated, null, 2));
          console.log(`✅ Synced ${relPath} -> ${tenant}/${relPath}`);
        });

      } catch (err) {
        console.error(`❌ Invalid JSON in ${templatePath}: ${err.message}`);
        process.exit(1); // stop workflow
      }
    }
  });
}

// Start syncing from _template
syncTemplates(templateRoot);
