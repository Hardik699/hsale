import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://admin:admin1@cluster0.a3duo.mongodb.net/?appName=Cluster0";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let connectionPromise: Promise<Db> | null = null;

async function getDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        family: 4,
      });

      await client.connect();
      console.log("✅ Connected to MongoDB for items");
      cachedClient = client;
      cachedDb = client.db("upload_system");
      return cachedDb;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connectionPromise = null;
      throw new Error(
        "Database connection failed: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  })();

  return connectionPromise;
}

// Create or get items collection
async function getItemsCollection() {
  const db = await getDatabase();
  return db.collection("items");
}

// Create or get dropdowns collection
async function getDropdownsCollection() {
  const db = await getDatabase();
  return db.collection("item_dropdowns");
}

// Get all items
export const handleGetItems: RequestHandler = async (req, res) => {
  try {
    const collection = await getItemsCollection();
    const items = await collection.find({}).toArray();

    if (items.length === 0) {
      console.warn("⚠️ No items found in database");
      return res.json([]);
    }

    console.log(`✅ Retrieved ${items.length} items from database`);

    // Log first item structure to debug field names
    console.log("First item fields:", Object.keys(items[0]));
    console.log(
      "Item IDs from DB:",
      items
        .map((i) => {
          const item = i as any;
          return `${item.itemId || item.itemName || "NO_ID"}`;
        })
        .join(", "),
    );

    // Ensure all items have itemId - if not, try to use shortCode or generate one
    const processedItems = items.map((item: any, index: number) => {
      if (!item.itemId) {
        console.warn(
          `⚠️ Item at index ${index} missing itemId, has fields:`,
          Object.keys(item),
        );
        // If itemId is missing, this item cannot be retrieved by ItemDetail page
        // Return it as-is so client can see the issue
      }
      return item;
    });

    res.json(processedItems);
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    res.status(500).json({
      error: "Failed to fetch items",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get a single item by ID
export const handleGetItemById: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ error: "itemId is required" });
    }

    const collection = await getItemsCollection();
    const item = await collection.findOne({ itemId });

    if (!item) {
      return res
        .status(404)
        .json({ error: `Item with ID "${itemId}" not found` });
    }

    console.log(`✅ Retrieved item ${itemId}: ${(item as any).itemName}`);
    res.json(item);
  } catch (error) {
    console.error("❌ Error fetching item:", error);
    res.status(500).json({
      error: "Failed to fetch item",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Create a new item
export const handleCreateItem: RequestHandler = async (req, res) => {
  try {
    const item = req.body;

    // Validate required fields
    if (!item.itemId || !item.itemName || !item.group || !item.category) {
      console.error("❌ Missing required fields:", {
        itemId: item.itemId,
        itemName: item.itemName,
        group: item.group,
        category: item.category,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    const collection = await getItemsCollection();

    // Check if item already exists
    const existing = await collection.findOne({ itemId: item.itemId });
    if (existing) {
      console.warn(`⚠️ Item ${item.itemId} already exists`);
      return res
        .status(409)
        .json({ error: "Item with this ID already exists" });
    }

    const documentToInsert = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`📝 Inserting item ${item.itemId}:`, {
      itemName: item.itemName,
      group: item.group,
      category: item.category,
      variations: item.variations?.length || 0,
    });

    const result = await collection.insertOne(documentToInsert);

    console.log(
      `✅ Item ${item.itemId} created with MongoDB ID:`,
      result.insertedId,
    );
    console.log(`📝 Response includes itemId:`, item.itemId);

    // Ensure itemId is included in the response
    const responseItem = { ...item, _id: result.insertedId };
    console.log(`📤 Sending response:`, {
      itemId: responseItem.itemId,
      itemName: responseItem.itemName,
    });

    res.status(201).json(responseItem);
  } catch (error) {
    console.error("❌ Error creating item:", error);
    res.status(500).json({
      error: "Failed to create item",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Update an item
export const handleUpdateItem: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const collection = await getItemsCollection();

    const result = await collection.updateOne(
      { itemId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Delete an item
export const handleDeleteItem: RequestHandler = async (req, res) => {
  try {
    const { itemId } = req.params;

    const collection = await getItemsCollection();

    const result = await collection.deleteOne({ itemId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// Migrate all items to add GS1 channel to variations
export const handleAddGS1Channel: RequestHandler = async (req, res) => {
  try {
    const collection = await getItemsCollection();

    // Find all items with variations
    const items = await collection.find({}).toArray();

    let updatedCount = 0;
    let variationsUpdated = 0;

    for (const item of items) {
      if (item.variations && Array.isArray(item.variations)) {
        let hasChanges = false;

        // Update each variation to add GS1 channel if it doesn't exist
        const updatedVariations = item.variations.map((variation: any) => {
          if (!variation.channels) {
            variation.channels = {};
          }

          if (!("GS1" in variation.channels)) {
            variation.channels.GS1 = 0;
            hasChanges = true;
            variationsUpdated++;
          }

          return variation;
        });

        // If changes were made, update the item in the database
        if (hasChanges) {
          await collection.updateOne(
            { _id: item._id },
            { $set: { variations: updatedVariations, updatedAt: new Date() } },
          );
          updatedCount++;
        }
      }
    }

    console.log(
      `✅ Migration complete: Updated ${updatedCount} items, added GS1 channel to ${variationsUpdated} variations`,
    );

    res.json({
      success: true,
      message: `Successfully added GS1 channel to ${variationsUpdated} variations across ${updatedCount} items`,
      updatedItems: updatedCount,
      variationsUpdated,
    });
  } catch (error) {
    console.error("Error adding GS1 channel:", error);
    res.status(500).json({
      error: "Failed to add GS1 channel",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// Get all dropdown options (groups, categories, HSN codes, variation values)
export const handleGetDropdowns: RequestHandler = async (req, res) => {
  try {
    const collection = await getDropdownsCollection();

    const dropdowns = await collection.findOne({ _id: "main" } as any);

    if (!dropdowns) {
      return res.json({
        groups: [],
        categories: [],
        hsnCodes: [],
        variationValues: [],
      });
    }

    res.json({
      groups: dropdowns.groups || [],
      categories: dropdowns.categories || [],
      hsnCodes: dropdowns.hsnCodes || [],
      variationValues: dropdowns.variationValues || [],
    });
  } catch (error) {
    console.error("Error fetching dropdowns:", error);
    res.status(500).json({ error: "Failed to fetch dropdowns" });
  }
};

// Add a new group
export const handleAddGroup: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const collection = await getDropdownsCollection();

    const result = await collection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { groups: name.trim() },
        $setOnInsert: {
          categories: [],
          hsnCodes: [],
          variationValues: [],
        },
      },
      { upsert: true },
    );

    res.status(201).json({ message: "Group added successfully" });
  } catch (error) {
    console.error("Error adding group:", error);
    res.status(500).json({ error: "Failed to add group" });
  }
};

// Add a new category
export const handleAddCategory: RequestHandler = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const collection = await getDropdownsCollection();

    await collection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { categories: name.trim() },
        $setOnInsert: {
          groups: [],
          hsnCodes: [],
          variationValues: [],
        },
      },
      { upsert: true },
    );

    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Failed to add category" });
  }
};

// Add a new HSN code
export const handleAddHsnCode: RequestHandler = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "HSN code is required" });
    }

    const collection = await getDropdownsCollection();

    await collection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { hsnCodes: code.trim() },
        $setOnInsert: {
          groups: [],
          categories: [],
          variationValues: [],
        },
      },
      { upsert: true },
    );

    res.status(201).json({ message: "HSN code added successfully" });
  } catch (error) {
    console.error("Error adding HSN code:", error);
    res.status(500).json({ error: "Failed to add HSN code" });
  }
};

// Add a new variation value
export const handleAddVariationValue: RequestHandler = async (req, res) => {
  try {
    const { value } = req.body;

    if (!value || !value.trim()) {
      return res.status(400).json({ error: "Variation value is required" });
    }

    const collection = await getDropdownsCollection();

    await collection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { variationValues: value.trim() },
        $setOnInsert: {
          groups: [],
          categories: [],
          hsnCodes: [],
        },
      },
      { upsert: true },
    );

    res.status(201).json({ message: "Variation value added successfully" });
  } catch (error) {
    console.error("Error adding variation value:", error);
    res.status(500).json({ error: "Failed to add variation value" });
  }
};

// Get group categories
export const handleGetGroupCategories: RequestHandler = async (req, res) => {
  try {
    const { groupName } = req.params;

    if (!groupName) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const db = await getDatabase();
    const collection = db.collection("group_categories");

    const groupData = await collection.findOne({ groupName: decodeURIComponent(groupName) });

    if (!groupData) {
      return res.json({ categories: [] });
    }

    res.json({ categories: groupData.categories || [] });
  } catch (error) {
    console.error("Error fetching group categories:", error);
    res.status(500).json({ error: "Failed to fetch group categories" });
  }
};

// Update a group
export const handleUpdateGroup: RequestHandler = async (req, res) => {
  try {
    const { groupName } = req.params;
    const { newName, categories } = req.body;

    const decodedGroupName = decodeURIComponent(groupName);

    const db = await getDatabase();
    const dropdownsCollection = await getDropdownsCollection();
    const groupCategoriesCollection = db.collection("group_categories");

    // If group name is being changed, update it in the groups array
    if (newName && newName !== decodedGroupName) {
      await dropdownsCollection.updateOne(
        { _id: "main" } as any,
        {
          $pull: { groups: decodedGroupName },
          $addToSet: { groups: newName },
        } as any,
      );

      // Also update the group categories mapping
      await groupCategoriesCollection.updateOne(
        { groupName: decodedGroupName },
        { $set: { groupName: newName, categories: categories || [] } },
        { upsert: true },
      );

      // Update all items that reference this group
      const itemsCollection = await getItemsCollection();
      await itemsCollection.updateMany(
        { group: decodedGroupName },
        { $set: { group: newName } },
      );
    } else {
      // Just update the categories for the group
      await groupCategoriesCollection.updateOne(
        { groupName: decodedGroupName },
        { $set: { categories: categories || [] } },
        { upsert: true },
      );
    }

    res.json({ message: "Group updated successfully" });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
};

// Update a category
export const handleUpdateCategory: RequestHandler = async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { newName } = req.body;

    const decodedCategoryName = decodeURIComponent(categoryName);

    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: "New category name is required" });
    }

    const dropdownsCollection = await getDropdownsCollection();
    const itemsCollection = await getItemsCollection();

    // Update in dropdowns
    await dropdownsCollection.updateOne(
      { _id: "main" } as any,
      {
        $pull: { categories: decodedCategoryName },
      } as any
    );
    await dropdownsCollection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { categories: newName.trim() },
      } as any
    );

    // Update all items that reference this category
    await itemsCollection.updateMany(
      { category: decodedCategoryName },
      { $set: { category: newName.trim() } }
    );

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Update an HSN code
export const handleUpdateHsnCode: RequestHandler = async (req, res) => {
  try {
    const { code } = req.params;
    const { newCode } = req.body;

    const decodedCode = decodeURIComponent(code);

    if (!newCode || !newCode.trim()) {
      return res.status(400).json({ error: "New HSN code is required" });
    }

    const dropdownsCollection = await getDropdownsCollection();
    const itemsCollection = await getItemsCollection();

    // Update in dropdowns
    await dropdownsCollection.updateOne(
      { _id: "main" } as any,
      {
        $pull: { hsnCodes: decodedCode },
      } as any
    );
    await dropdownsCollection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { hsnCodes: newCode.trim() },
      } as any
    );

    // Update all items that reference this HSN code
    await itemsCollection.updateMany(
      { hsnCode: decodedCode },
      { $set: { hsnCode: newCode.trim() } }
    );

    res.json({ message: "HSN code updated successfully" });
  } catch (error) {
    console.error("Error updating HSN code:", error);
    res.status(500).json({ error: "Failed to update HSN code" });
  }
};

// Update a variation value
export const handleUpdateVariationValue: RequestHandler = async (req, res) => {
  try {
    const { value } = req.params;
    const { newValue } = req.body;

    const decodedValue = decodeURIComponent(value);

    if (!newValue || !newValue.trim()) {
      return res.status(400).json({ error: "New variation value is required" });
    }

    const dropdownsCollection = await getDropdownsCollection();
    const itemsCollection = await getItemsCollection();

    // Update in dropdowns
    await dropdownsCollection.updateOne(
      { _id: "main" } as any,
      {
        $pull: { variationValues: decodedValue },
      } as any
    );
    await dropdownsCollection.updateOne(
      { _id: "main" } as any,
      {
        $addToSet: { variationValues: newValue.trim() },
      } as any
    );

    // Update all items that have variations with this value
    // This is more complex because variations is an array of objects
    await itemsCollection.updateMany(
      { "variations.value": decodedValue },
      { $set: { "variations.$[elem].value": newValue.trim() } },
      { arrayFilters: [{ "elem.value": decodedValue }] }
    );

    res.json({ message: "Variation value updated successfully" });
  } catch (error) {
    console.error("Error updating variation value:", error);
    res.status(500).json({ error: "Failed to update variation value" });
  }
};
