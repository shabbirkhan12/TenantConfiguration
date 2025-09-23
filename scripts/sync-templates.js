const fs = require("fs");
const path = require("path");

const tenants = ["devops", "feature", "synergis"];
const templateRoot = path.join(__dirname, "..", "_template");
const repoRoot = path.join(__dirname, "..");

// Per-tenant overrides
const tenantConfig = {
  devops: {
    ip: "10.6.46.82",
    tenantId: 11111114,
    license: {
      tenantName: "devops",
      tenantId: "11111114",
      expirationDate: "2025-12-09T00:00:00",
      authCode: "dGT95K4rsSFZy/NjxJTuSa9FGqA="
    }
  },
  feature: {
    ip: "10.6.46.83",
    tenantId: 11111113,
    license: {
      tenantName: "feature",
      tenantId: "11111113",
      expirationDate: "2026-08-01T00:00:00",
      authCode: "1ihO4wnFpicIpdxRXjG0we6Y2m4="
    }
  },
  synergis: {
    ip: "10.3.3.30",
    tenantId: 11111111,
    license: {
      tenantName: "synergis",
      tenantId: "11111111",
      expirationDate: "2025-11-14T00:00:00",
      authCode: "m1bQ2xl/OBEVx/kNKsrcR38OfbY="
    }
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

          // Override for WebAPI/AdeptTenantLicense.json
          if (relPath.endsWith("WebAPI/AdeptTenantLicense.json")) {
            const licenseOverrides = tenantConfig[tenant].license;
            json.tenantName = licenseOverrides.tenantName;
            json.tenantId = licenseOverrides.tenantId;
            json.expirationDate = licenseOverrides.expirationDate;
            json.authCode = licenseOverrides.authCode;
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
