const fs = require("fs");
const path = require("path");

const tenants = ["devops", "feature", "synergis"];
const templateRoot = path.join(__dirname, "..", "_template");
const repoRoot = path.join(__dirname, "..");

// Per-tenant overrides
const tenantConfig = {
  devops: {
    ip: "10.6.46.82",
    tenantId: 11111114
  },
  feature: {
    ip: "10.6.46.83",
    tenantId: 11111113
  },
  synergis: {
    ip: "10.3.3.30",
    tenantId: 11111111
  }
};

function syncTemplates(dir, relativePath = "") {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const templatePath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stat = fs.statSync(templatePath);

    if (stat.isDirectory()) {
      syncTemplates(templatePath, relPath);
    } else if (item.endsWith(".json")) {
      tenants.forEach(tenant => {
        const targetPath = path.join(repoRoot, tenant, relPath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        let content = fs.readFileSync(templatePath, "utf8");

        try {
          let json = JSON.parse(content);

          // Override for AuthProxy/appsettings.json
          if (relPath.endsWith("AuthProxy/appsettings.json")) {
            if (!json.AllowedOrigins) json.AllowedOrigins = {};
            json.AllowedOrigins.IPs = [tenantConfig[tenant].ip];
          }

          // Override for WebAPI/cognito-users.json
          if (relPath.endsWith("WebAPI/cognito-users.json")) {
            if (json.tenants && json.tenants.length > 0) {
              json.tenants[0].tenantId = tenantConfig[tenant].tenantId;
            }
          }

          content = JSON.stringify(json, null, 2);
        } catch (err) {
          console.error(`❌ Failed to parse JSON in ${templatePath}`, err);
        }

        fs.writeFileSync(targetPath, content, "utf8");
        console.log(`✅ Synced ${relPath} -> ${tenant}/${relPath}`);
      });
    }
  });
}

syncTemplates(templateRoot);
