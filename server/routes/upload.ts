import { RequestHandler } from "express";
import { MongoClient, Db } from "mongodb";
import { UPLOAD_FORMATS, validateFileFormat } from "../../shared/formats";

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

  // Prevent multiple simultaneous connection attempts
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 30000,
        family: 4, // Use IPv4
      });

      await client.connect();
      console.log("✅ Connected to MongoDB");
      cachedClient = client;
      cachedDb = client.db("upload_system");
      return cachedDb;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connectionPromise = null; // Reset for next attempt
      throw new Error("Database connection failed: " + (error instanceof Error ? error.message : String(error)));
    }
  })();

  return connectionPromise;
}

// Helper function to normalize area to lowercase
function normalizeArea(area: string, orderType?: string): "zomato" | "swiggy" | "dining" | "parcel" {
  const areaLower = area?.toLowerCase().trim() || "";
  const orderTypeLower = orderType?.toLowerCase().trim() || "";

  console.log(`  [AREA DEBUG] input area="${area}" | areaLower="${areaLower}" | orderType="${orderType}"`);

  // Check for Zomato variations
  if (areaLower.includes("zomato")) {
    console.log(`  [AREA DEBUG] ✓ Matched ZOMATO`);
    return "zomato";
  }

  // Check for Swiggy variations
  if (areaLower.includes("swiggy")) {
    console.log(`  [AREA DEBUG] ✓ Matched SWIGGY`);
    return "swiggy";
  }

  // Check for Parcel/Delivery variations
  if (areaLower.includes("parcel") || areaLower.includes("home delivery") || areaLower.includes("pickup")) {
    console.log(`  [AREA DEBUG] ✓ Matched PARCEL`);
    return "parcel";
  }

  // Check order type as fallback
  if (orderTypeLower.includes("pickup") || orderTypeLower.includes("home delivery")) {
    console.log(`  [AREA DEBUG] ✓ Matched PARCEL (via orderType)`);
    return "parcel";
  }
  if (orderTypeLower.includes("delivery")) {
    console.log(`  [AREA DEBUG] ✓ Matched PARCEL (via delivery orderType)`);
    return "parcel";
  }

  // Default to dining
  console.log(`  [AREA DEBUG] → DEFAULT to DINING`);
  return "dining";
}

// Helper function to parse Excel serial date
function parseExcelDate(serialDate: number): Date | null {
  if (!serialDate || isNaN(serialDate)) return null;

  // Excel serial dates start from January 1, 1900 = 1
  // There's a leap year bug in Excel (Feb 29, 1900 doesn't exist but Excel counts it)
  const excelEpoch = new Date(1900, 0, 1).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Account for Excel's leap year bug (dates after Feb 28, 1900 are off by 1)
  let adjustedSerial = serialDate;
  if (serialDate > 60) {
    adjustedSerial = serialDate - 1; // Subtract 1 for the non-existent Feb 29, 1900
  }

  const timestamp = excelEpoch + (adjustedSerial - 1) * msPerDay;
  const date = new Date(timestamp);

  return isNaN(date.getTime()) ? null : date;
}

// Helper function to parse date string
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const str = String(dateStr).trim();

  // Try YYYY-MM-DD format FIRST (from HTML date input)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]);
    const day = parseInt(isoMatch[3]);
    return new Date(year, month - 1, day);
  }

  // Try other date formats (DD-MM-YYYY or DD/MM/YYYY)
  const formats = [
    { regex: /^(\d{2})-(\d{2})-(\d{4})$/, order: "DMY" }, // DD-MM-YYYY
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: "DMY" }, // DD/MM/YYYY
  ];

  for (const { regex, order } of formats) {
    const match = str.match(regex);
    if (match) {
      let year, month, day;
      if (order === "DMY") {
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      if (year >= 1900 && year <= 2099) {
        return new Date(year, month - 1, day);
      }
    }
  }

  // Only try to parse as Excel serial number if it contains NO "/" or "-" characters
  if (!str.includes("/") && !str.includes("-")) {
    const numVal = parseFloat(str);
    if (!isNaN(numVal) && numVal > 0 && numVal < 100000) {
      const excelDate = parseExcelDate(numVal);
      if (excelDate) {
        return excelDate;
      }
    }
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    const { type, year, month, data, rows, columns, validRowIndices } = req.body;

    if (!type || !year || !month || !data || !rows || !columns) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof type !== 'string' || typeof year !== 'number' || typeof month !== 'number') {
      return res.status(400).json({ error: "Invalid field types" });
    }

    // Validate upload type exists
    if (!Object.keys(UPLOAD_FORMATS).includes(type)) {
      return res.status(400).json({ error: `Invalid upload type: ${type}` });
    }

    // Validate file format
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const headers = data[0] as string[];
    const validation = validateFileFormat(headers, type as any);

    if (!validation.valid) {
      return res.status(400).json({
        error: `Invalid file format. Missing columns: ${validation.missing.join(", ")}`,
        missingColumns: validation.missing
      });
    }

    // Filter data if validRowIndices provided (remove invalid rows)
    let finalData = data;
    let finalRows = rows;
    if (Array.isArray(validRowIndices) && validRowIndices.length > 0) {
      // validRowIndices are 1-indexed from the UI (row 2, row 3, etc.)
      // data[0] is headers, so we need to map indices correctly
      finalData = [headers, ...validRowIndices.map(idx => data[idx])];
      finalRows = validRowIndices.length;
    }

    const db = await getDatabase();
    const collection = db.collection(type);

    // Check if data already exists for this month/year
    const existingData = await collection.findOne({ year, month });
    if (existingData) {
      return res.status(409).json({
        error: "Data already exists for this month",
        exists: true
      });
    }

    // Save the data
    const result = await collection.insertOne({
      year,
      month,
      rows: finalRows,
      columns,
      data: finalData,
      uploadedAt: new Date(),
      status: "uploaded"
    });

    // Data is stored in petpooja collection and will be fetched directly from DB when needed
    // No need to process and duplicate data in item variations

    res.json({
      success: true,
      id: result.insertedId,
      message: `Data uploaded successfully (${finalRows} rows)`,
      rowsUploaded: finalRows
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload data";
    res.status(500).json({ error: errorMessage });
  }
};


export const handleGetUploads: RequestHandler = async (req, res) => {
  try {
    const { type, year } = req.query;

    if (!type) {
      return res.status(400).json({ error: "Type is required" });
    }

    const db = await getDatabase();
    const collection = db.collection(type as string);

    // Filter by year if provided, otherwise use current year
    const filterYear = year ? parseInt(year as string) : new Date().getFullYear();

    const data = await collection.find({ year: filterYear }).toArray();

    // Create a map of uploaded months
    const uploadedMonths: Record<number, boolean> = {};
    data.forEach((doc: any) => {
      if (typeof doc.month === 'number') {
        uploadedMonths[doc.month] = true;
      }
    });

    // Fill in months 1-12 with status
    const monthsStatus = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      status: uploadedMonths[i + 1] ? "uploaded" : "pending" as const
    }));

    res.json({ data: monthsStatus });
  } catch (error) {
    console.error("Get uploads error:", error);
    // Return default empty status on error
    const monthsStatus = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      status: "pending" as const
    }));
    res.json({ data: monthsStatus });
  }
};

export const handleUpdateUpload: RequestHandler = async (req, res) => {
  try {
    const { type, year, month, data, rows, columns, validRowIndices } = req.body;

    if (!type || !year || !month || !data) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Filter data if validRowIndices provided
    let finalData = data;
    let finalRows = rows;
    if (Array.isArray(validRowIndices) && validRowIndices.length > 0) {
      const headers = data[0];
      finalData = [headers, ...validRowIndices.map((idx: number) => data[idx])];
      finalRows = validRowIndices.length;
    }

    const db = await getDatabase();
    const collection = db.collection(type);

    const result = await collection.updateOne(
      { year, month },
      {
        $set: {
          rows: finalRows,
          columns,
          data: finalData,
          updatedAt: new Date(),
          status: "updated"
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ success: true, message: `Data updated successfully (${finalRows} rows)` });
  } catch (error) {
    console.error("Update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update data";
    res.status(500).json({ error: errorMessage });
  }
};

export const handleGetData: RequestHandler = async (req, res) => {
  try {
    const { type, year, month } = req.query;

    if (!type || !year || !month) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const db = await getDatabase();
    const collection = db.collection(type as string);

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum)) {
      return res.status(400).json({ error: "Invalid year or month" });
    }

    const doc = await collection.findOne({
      year: yearNum,
      month: monthNum
    });

    if (!doc) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json(doc);
  } catch (error) {
    console.error("Get data error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch data";
    res.status(500).json({ error: errorMessage });
  }
};

// Validate data against database before upload
export const handleValidateUpload: RequestHandler = async (req, res) => {
  try {
    const { type, data, isMinimal, originalIndices } = req.body;

    console.log("📋 Validation request received:", {
      type,
      rowCount: Array.isArray(data) ? data.length : 0,
      isMinimal: !!isMinimal
    });

    if (!type || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid request data" });
    }

    if (type !== "petpooja") {
      return res.json({
        success: true,
        validCount: data.length - 1,
        invalidCount: 0,
        validRows: data.slice(1).map((row, i) => ({ rowIndex: i + 2, data: row })),
        invalidRows: []
      });
    }

    console.log("🔗 Connecting to database for validation...");
    const db = await getDatabase();
    const itemsCollection = db.collection("items");

    // Get all items and build SAP code map
    console.log("📊 Fetching items to build SAP code map...");
    const items = await itemsCollection.find({}, { projection: { "variations.sapCode": 1 } }).toArray();
    console.log(`✅ Found ${items.length} items`);

    const sapCodeMap: { [key: string]: boolean } = {};

    for (const item of items) {
      if (item.variations && Array.isArray(item.variations)) {
        item.variations.forEach((v: any) => {
          if (v.sapCode) {
            sapCodeMap[v.sapCode.trim()] = true;
          }
        });
      }
    }

    console.log(`🔍 Built SAP code map with ${Object.keys(sapCodeMap).length} codes`);

    const headers = data[0] as string[];
    const dataRows = data.slice(1);

    // Find column indices
    let restaurantIdx: number;
    let sapCodeIdx: number;

    if (isMinimal && originalIndices) {
      // In minimal mode, data rows only have 2 columns: [restaurant, sapCode]
      // headers still contains original headers to keep index discovery logic if needed,
      // but here we know the mapping is always [0, 1]
      restaurantIdx = 0;
      sapCodeIdx = 1;
    } else {
      const getColumnIndex = (name: string) =>
        headers.findIndex((h) => h?.toLowerCase().trim() === name.toLowerCase().trim());

      restaurantIdx = getColumnIndex("restaurant_name");
      sapCodeIdx = getColumnIndex("sap_code");
    }

    console.log(`📍 Using column indices - restaurant: ${restaurantIdx}, sapCode: ${sapCodeIdx}`);

    const validRows = [];
    const invalidRows = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const restaurant = row[restaurantIdx]?.toString().trim() || "";
      const sapCode = row[sapCodeIdx]?.toString().trim() || "";

      let isValid = true;
      let reason = "";

      if (!restaurant) {
        isValid = false;
        reason = "No restaurant name found in row";
      } else if (!sapCode) {
        isValid = false;
        reason = "No SAP code found in row";
      } else if (!sapCodeMap[sapCode]) {
        isValid = false;
        reason = `SAP code "${sapCode}" not found in database`;
      }

      const rowResult = {
        rowIndex: i + 2,
        data: isMinimal ? [restaurant, sapCode] : row
      };

      if (isValid) {
        validRows.push(rowResult);
      } else {
        invalidRows.push({ ...rowResult, reason });
      }
    }

    console.log(`✅ Validation complete: ${validRows.length} valid, ${invalidRows.length} invalid rows`);

    res.json({
      success: true,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    });
  } catch (error) {
    console.error("❌ Validation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to validate data";
    res.status(500).json({ error: errorMessage });
  }
};

// DELETE /api/upload/delete - Delete upload data for a specific month with password protection
export const handleDeleteUpload: RequestHandler = async (req, res) => {
  try {
    const { type, year, month, password } = req.body;

    // Validate required fields
    if (!type || !year || !month || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Simple password validation (in production, use bcrypt)
    const DELETION_PASSWORD = process.env.DELETION_PASSWORD || "admin123";

    if (password !== DELETION_PASSWORD) {
      console.warn(`⚠️ Invalid deletion password attempt for ${type}/${year}/${month}`);
      return res.status(401).json({ error: "Invalid password" });
    }

    console.log(`🗑️ Deleting ${type} data for month ${month}/${year}`);

    const db = await getDatabase();
    const collection = db.collection(type);

    // Find and delete the upload record
    const result = await collection.deleteOne({
      year,
      month
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No data found for this month" });
    }

    console.log(`✅ Successfully deleted ${type} data for month ${month}/${year}`);

    res.json({
      success: true,
      message: `Data for ${month}/${year} has been deleted successfully`
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete data";
    res.status(500).json({ error: errorMessage });
  }
};
