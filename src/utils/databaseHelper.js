const SupabaseDatabase = require("../database/supabase");
const EnhancedSupabaseDatabase = require("../database/enhancedSupabase");

/**
 * Tạo database instance phù hợp dựa trên cấu hình Kafka
 * @returns {SupabaseDatabase|EnhancedSupabaseDatabase}
 */
function createDatabaseInstance() {
  const useKafka = process.env.KAFKA_ENABLED !== "false";
  return useKafka ? new EnhancedSupabaseDatabase() : new SupabaseDatabase();
}

/**
 * Khởi tạo database instance và connect
 * @returns {Promise<SupabaseDatabase|EnhancedSupabaseDatabase>}
 */
async function getInitializedDatabase() {
  const database = createDatabaseInstance();
  await database.init();
  return database;
}

module.exports = {
  createDatabaseInstance,
  getInitializedDatabase,
};
