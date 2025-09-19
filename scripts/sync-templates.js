const fs = require("fs");
const path = require("path");

// Tenants to sync
const tenants = ["devops", "feature", "synergis"];

// Root paths
const templateRoot = path.join(__dirname, "..", "_template");
const repoRoot = path.join(__dirname, "..");

// Tenant-specific overrides (can include nested keys)
const tenantOverrides = {
  "devops/Viewer/AuthProxy/appsettings.json": {
    AllowedOrigins: { IPs: ["10.1.1.10"] }
  },
  "feature/Viewer/AuthProxy/appsettings.json": {
    AllowedOrigins: { IPs: ["10.2.2.20"] }
  },
  "synergis/Viewer/AuthProxy/appsettings.json": {
    AllowedOrigins: { IPs: ["10.3.3.30"] }
  }
};

// Deep merge helper
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Recursive function to sync templates
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
        // Validate template JSON
        const content = JSON.parse(fs.readFileSync(templatePath, "utf8"));

        tenants.forEach(tenant => {
          const targetPath = path.join(repoRoot, tenant, relPath);
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });

          // Apply tenant-specific overrides (deep merge)
          const key = `${tenant}/${relPath.replace(/\\/g, "/")}`;
          let updated = { ...content };
          if (tenantOverrides[key]) {
            updated = deepMerge(updated, tenantOverrides[key]);
          }

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

// Start syncing
syncTemplates(templateRoot);
