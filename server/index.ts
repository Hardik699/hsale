import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleUpload,
  handleGetUploads,
  handleUpdateUpload,
  handleGetData,
  handleValidateUpload,
  handleDeleteUpload,
} from "./routes/upload";
import {
  handleDebugItemSales,
  handleUpdateItemShortCode,
  handleDebugSalesHistory,
} from "./routes/debug";
import {
  handleGetAllSapCodes,
  handleGetItemsWithSapCodes,
  handleSetItemSapCode,
  handleBatchSetSapCodes,
  handleMatchSapCodes,
  handleAutoMatchVariationSapCodes,
} from "./routes/sap-matching";
import {
  handleSapDebugInfo,
  handleDebugSalesForItem,
} from "./routes/sap-debug";
import {
  handleViewPetpooja,
  handleSearchSapCode,
} from "./routes/view-petpooja";
import { handleCheckAllData, handleShowSampleRows } from "./routes/check-data";
import {
  handleGetItems,
  handleGetItemById,
  handleCreateItem,
  handleUpdateItem,
  handleDeleteItem,
  handleGetDropdowns,
  handleAddGroup,
  handleAddCategory,
  handleAddHsnCode,
  handleAddVariationValue,
  handleAddGS1Channel,
  handleGetGroupCategories,
  handleUpdateGroup,
  handleUpdateCategory,
  handleUpdateHsnCode,
  handleUpdateVariationValue,
} from "./routes/items";
import {
  handleGetSales,
  handleGetItemSales,
  handleGetSalesSummary,
  handleRecordSale,
  handleGetMonthlySales,
  handleGetDailySales,
  handleGetRestaurants,
  handleResetItemSales,
  handleDebugItemSalesRaw,
  handleDebugParcelData,
  handleDebugAllData,
  handleClearAllPetpoojaData,
} from "./routes/sales";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ extended: true, limit: "200mb" }));

  // Increase timeout for large uploads (5 minutes = 300 seconds)
  app.use((req, res, next) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Debug endpoints
  app.get("/api/debug/item-sales", handleDebugItemSales);
  app.get("/api/debug/sales-history", handleDebugSalesHistory);
  app.post("/api/debug/update-shortcode", handleUpdateItemShortCode);

  // SAP Code matching endpoints
  app.get("/api/sap/all-codes", handleGetAllSapCodes);
  app.get("/api/sap/items-with-codes", handleGetItemsWithSapCodes);
  app.post("/api/sap/set-item-code", handleSetItemSapCode);
  app.post("/api/sap/batch-set-codes", handleBatchSetSapCodes);
  app.post("/api/sap/auto-match-variations", handleAutoMatchVariationSapCodes);
  app.get("/api/sap/match-analysis", handleMatchSapCodes);
  app.get("/api/sap/debug-info", handleSapDebugInfo);
  app.get("/api/sap/debug-sales", handleDebugSalesForItem);

  // View petpooja database
  app.get("/api/petpooja/view", handleViewPetpooja);
  app.get("/api/petpooja/search", handleSearchSapCode);

  // Check data
  app.get("/api/check-data", handleCheckAllData);
  app.get("/api/check-data/rows", handleShowSampleRows);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Upload routes
  app.post("/api/upload/validate", handleValidateUpload);
  app.delete("/api/upload/delete", handleDeleteUpload);
  app.post("/api/upload", handleUpload);
  app.get("/api/uploads", handleGetUploads);
  app.put("/api/upload", handleUpdateUpload);
  app.get("/api/data", handleGetData);

  // Items routes - more specific routes first
  app.get("/api/items/dropdowns", handleGetDropdowns);
  app.post("/api/items/groups", handleAddGroup);
  app.get("/api/items/groups/:groupName", handleGetGroupCategories);
  app.put("/api/items/groups/:groupName", handleUpdateGroup);
  app.post("/api/items/categories", handleAddCategory);
  app.put("/api/items/categories/:categoryName", handleUpdateCategory);
  app.post("/api/items/hsn-codes", handleAddHsnCode);
  app.put("/api/items/hsn-codes/:code", handleUpdateHsnCode);
  app.post("/api/items/variation-values", handleAddVariationValue);
  app.put("/api/items/variation-values/:value", handleUpdateVariationValue);
  app.post("/api/items/migrate/add-gs1", handleAddGS1Channel);
  app.get("/api/items", handleGetItems);
  app.get("/api/items/:itemId", handleGetItemById);
  app.post("/api/items", handleCreateItem);
  app.put("/api/items/:itemId", handleUpdateItem);
  app.delete("/api/items/:itemId", handleDeleteItem);

  // Sales routes
  app.get("/api/sales/debug-raw", handleDebugItemSalesRaw);
  app.get("/api/sales/debug-parcel/:itemId", handleDebugParcelData);
  app.get("/api/sales/debug-all/:itemId", handleDebugAllData);
  app.get("/api/sales", handleGetSales);
  app.get("/api/sales/restaurants", handleGetRestaurants);
  app.get("/api/sales/summary", handleGetSalesSummary);
  app.get("/api/sales/item/:itemId", handleGetItemSales);
  app.get("/api/sales/monthly/:itemId", handleGetMonthlySales);
  app.get("/api/sales/daily/:itemId/:month", handleGetDailySales);
  app.delete("/api/sales/item/:itemId", handleResetItemSales);
  app.delete("/api/sales/clear-all", handleClearAllPetpoojaData);
  app.post("/api/sales", handleRecordSale);

  // Error handling middleware
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Server error:", err);
      res
        .status(500)
        .json({ error: "Internal server error", message: err?.message });
    },
  );

  return app;
}
