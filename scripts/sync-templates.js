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
    cognito: {
      tenantId: "11111114",
      clientId: "1d4lt0fb6f6mqp16l9r2aab9gu"
    },
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
    cognito: {
      tenantId: "11111113",
      clientId: "4ae59e92sdj533otuufagtuqeo"
    },
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
    cognito: {
      tenantId: "11111111",
      clientId: "m6umrvmdmt4tutvs3d6k7h91k"
    },
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

          // --- AuthProxy/appsettings.json overrides ---
          if (relPath.endsWith("AuthProxy/appsettings.json")) {
            if (!json.AllowedOrigins) json.AllowedOrigins = {};
            json.AllowedOrigins.IPs = [tenantConfig[tenant].ip];
          }

          // --- WebAPI/cognito-users.json overrides ---
          if (relPath.endsWith("WebAPI/cognito-users.json")) {
            if (json.tenants && json.tenants.length > 0) {
              json.tenants[0].tenantId = tenantConfig[tenant].tenantId;
            }
          }

          // --- WebAPI/AdeptTenantLicense.json overrides ---
          if (relPath.endsWith("WebAPI/AdeptTenantLicense.json")) {
            const licenseOverrides = tenantConfig[tenant].license;
            json.tenantName = licenseOverrides.tenantName;
            json.tenantId = licenseOverrides.tenantId;
            json.expirationDate = licenseOverrides.expirationDate;
            json.authCode = licenseOverrides.authCode;
          }

          // --- WebAPI/appsettings.json overrides (Cognito section) ---
          if (relPath.endsWith("WebAPI/appsettings.json")) {
            const cog = tenantConfig[tenant].cognito;
            json.Cognito = {
              Tenants: {
                [cog.tenantId]: {
                  Authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CrQTXzuRI",
                  ClientId: cog.clientId,
                  Scope: "openid email"
                }
              }
            };
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
