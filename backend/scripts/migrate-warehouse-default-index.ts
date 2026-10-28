import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database";
import { WarehouseModel } from "../src/modules/warehouses/warehouse.model";

async function migrateWarehouseDefaultIndex(): Promise<void> {
  await connectDatabase();

  const collection = WarehouseModel.collection;

  try {
    const duplicateDefaults = await collection
      .aggregate([
        { $match: { isDefault: true } },
        {
          $group: {
            _id: "$isDefault",
            count: { $sum: 1 },
            warehouses: {
              $push: {
                _id: "$_id",
                name: "$name",
                code: "$code",
                status: "$status",
              },
            },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicateDefaults.length > 0) {
      console.error("Migration stopped: multiple default warehouses exist.");
      console.dir(duplicateDefaults, { depth: null });
      process.exitCode = 1;
      return;
    }

    const indexes = await collection.indexes();

    const targetIndex = indexes.find(
      (index) =>
        index.name === "uniq_default_warehouse" ||
        (index.key?.isDefault === 1 &&
          index.unique === true &&
          index.partialFilterExpression?.isDefault === true),
    );

    if (targetIndex) {
      console.log("Unique default-warehouse index already exists.");
      return;
    }

    const oldIndex = indexes.find(
      (index) => index.name === "warehouse_default_lookup",
    );

    if (oldIndex) {
      console.log("Existing warehouse_default_lookup index found.");
      console.log(
        "Leaving the existing index untouched; creating the new index first.",
      );
    }

    await collection.createIndex(
      { isDefault: 1 },
      {
        unique: true,
        name: "uniq_default_warehouse",
        partialFilterExpression: { isDefault: true },
      },
    );

    console.log("Created uniq_default_warehouse successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

migrateWarehouseDefaultIndex().catch((error: unknown) => {
  console.error("Warehouse index migration failed:", error);
  process.exitCode = 1;
});
