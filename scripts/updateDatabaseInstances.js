const fs = require("fs");
const path = require("path");

const filesToUpdate = [
  "src/handlers/buttonHandlers.js",
  "src/handlers/selectMenuHandlers.js",
  "src/commands/admin.js",
  "src/commands/myorders.js",
  "src/commands/pay.js",
];

function updateFile(filePath) {
  console.log(`\nUpdating ${filePath}...`);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // Replace import statement
  const oldImport = 'const SupabaseDatabase = require("../database/supabase");';
  const newImport =
    'const { getInitializedDatabase } = require("../utils/databaseHelper");';

  if (content.includes(oldImport) && !content.includes(newImport)) {
    content = content.replace(oldImport, newImport);
    changed = true;
    console.log("✅ Updated import statement");
  }

  // Replace database instantiation
  const oldPattern =
    /const database = new SupabaseDatabase\(\);\s*await database\.init\(\);/g;
  const newPattern = "const database = await getInitializedDatabase();";

  const beforeCount = (content.match(oldPattern) || []).length;
  content = content.replace(oldPattern, newPattern);
  const afterCount = (
    content.match(/const database = await getInitializedDatabase\(\);/g) || []
  ).length;

  if (beforeCount > 0) {
    console.log(`✅ Updated ${beforeCount} database instantiations`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Successfully updated ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

function main() {
  console.log("🚀 Starting database instance updates...");

  filesToUpdate.forEach(updateFile);

  console.log("\n✅ Database instance update completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Install kafkajs: npm install");
  console.log("2. Update your .env file with Kafka configuration");
  console.log("3. Set KAFKA_ENABLED=false to disable Kafka initially");
  console.log("4. Start your bot and verify it works");
  console.log("5. Set up Kafka broker and enable KAFKA_ENABLED=true");
}

if (require.main === module) {
  main();
}

module.exports = { updateFile };
