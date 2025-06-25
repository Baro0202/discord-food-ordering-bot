require("dotenv").config();

async function runTests() {
  console.log("🚀 Starting Kafka Integration Test...\n");

  // Test 1: Kafka Config
  console.log("1️⃣ Testing Kafka Configuration...");
  try {
    const { kafkaConfig, topics } = require("../src/kafka/config");
    console.log("✅ Kafka config loaded successfully");
    console.log(`   - Client ID: ${kafkaConfig.clientId}`);
    console.log(`   - Brokers: ${kafkaConfig.brokers.join(", ")}`);
    console.log(`   - Topics: ${Object.values(topics).join(", ")}`);
  } catch (error) {
    console.log("❌ Kafka config failed:", error.message);
    process.exit(1);
  }

  // Test 2: Kafka Producer (without connecting)
  console.log("\n2️⃣ Testing Kafka Producer...");
  try {
    const {
      KafkaProducer,
      getKafkaProducer,
    } = require("../src/kafka/producer");

    // Test với Kafka disabled
    process.env.KAFKA_ENABLED = "false";
    const producer = getKafkaProducer();
    console.log("✅ Kafka producer created (disabled mode)");

    // Test publish event (should not fail)
    const result = await producer.orderCreated({
      id: 123,
      user_id: "test",
      total_amount: 50000,
    });
    console.log("✅ Event publish test (disabled):", result.reason);
  } catch (error) {
    console.log("❌ Kafka producer failed:", error.message);
    process.exit(1);
  }

  // Test 3: Enhanced Database
  console.log("\n3️⃣ Testing Enhanced Database...");
  try {
    const EnhancedSupabaseDatabase = require("../src/database/enhancedSupabase");

    // Test với Kafka disabled
    process.env.KAFKA_ENABLED = "false";
    const db = new EnhancedSupabaseDatabase();
    console.log("✅ Enhanced database created");
    console.log(`   - Kafka enabled: ${process.env.KAFKA_ENABLED}`);
    console.log(`   - Instance type: ${db.constructor.name}`);
  } catch (error) {
    console.log("❌ Enhanced database failed:", error.message);
    process.exit(1);
  }

  // Test 4: Database Helper
  console.log("\n4️⃣ Testing Database Helper...");
  try {
    const {
      createDatabaseInstance,
      getInitializedDatabase,
    } = require("../src/utils/databaseHelper");

    // Test với Kafka disabled
    process.env.KAFKA_ENABLED = "false";
    const standardDb = createDatabaseInstance();
    console.log("✅ Standard database instance:", standardDb.constructor.name);

    // Test với Kafka enabled
    process.env.KAFKA_ENABLED = "true";
    const enhancedDb = createDatabaseInstance();
    console.log("✅ Enhanced database instance:", enhancedDb.constructor.name);
  } catch (error) {
    console.log("❌ Database helper failed:", error.message);
    process.exit(1);
  }

  // Test 5: Environment Variables
  console.log("\n5️⃣ Testing Environment Variables...");
  const requiredEnvVars = [
    "DISCORD_TOKEN",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    console.log(
      "⚠️  Missing required environment variables:",
      missingVars.join(", ")
    );
    console.log("   Please create .env file from env.example");
  } else {
    console.log("✅ All required environment variables present");
  }

  // Test 6: Kafka Environment Variables
  console.log("\n6️⃣ Testing Kafka Environment Variables...");
  const kafkaEnvVars = ["KAFKA_ENABLED", "KAFKA_BROKERS", "KAFKA_CLIENT_ID"];

  kafkaEnvVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`ℹ️  ${varName}: not set (using default)`);
    }
  });

  console.log("\n🎉 All tests completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Set up your .env file if not done");
  console.log("2. Test with KAFKA_ENABLED=false: npm start");
  console.log("3. Set up Kafka broker for full testing");
  console.log("4. Test with KAFKA_ENABLED=true");

  // Test health check endpoint simulation
  console.log("\n7️⃣ Testing Health Check Simulation...");
  try {
    // Simulate what the health check would return
    const healthCheck = {
      status: "OK",
      uptime: process.uptime(),
      kafka: {
        enabled: process.env.KAFKA_ENABLED !== "false",
        healthy: process.env.KAFKA_ENABLED === "false" ? true : "unknown",
      },
    };

    console.log("✅ Health check response:");
    console.log(JSON.stringify(healthCheck, null, 2));
  } catch (error) {
    console.log("❌ Health check simulation failed:", error.message);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
