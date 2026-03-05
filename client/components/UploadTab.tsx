import { useState, useEffect } from "react";
import { Upload, FileUp, AlertCircle, CheckCircle2, X, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { UPLOAD_FORMATS, validateFileFormat } from "@shared/formats";
import type { UploadType } from "@shared/formats";
import UploadLoader from "./UploadLoader";
import ConfirmUploadDialog from "./ConfirmUploadDialog";
import DeleteDataDialog from "./DeleteDataDialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthStatus {
  month: number;
  status: "uploaded" | "pending";
}

interface UploadTabProps {
  type: UploadType | string;
}

interface ValidationResult {
  validCount: number;
  invalidCount: number;
  validRows: any[];
  invalidRows: any[];
}

export default function UploadTab({ type }: UploadTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthsStatus, setMonthsStatus] = useState<MonthStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const [fileData, setFileData] = useState<any>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedValidRowIndices, setSelectedValidRowIndices] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMonth, setDeleteMonth] = useState<number | null>(null);
  const [deleteYear, setDeleteYear] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Fetch month statuses when type or selectedYear changes
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const fetchMonthStatus = async () => {
      const controller = new AbortController();

      try {
        console.log(`Fetching month status for ${type} year ${selectedYear}`);

        // Add a timeout for the fetch request (30 seconds)
        timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000);

        const response = await fetch(`/api/uploads?type=${type}&year=${selectedYear}`, {
          signal: controller.signal
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          console.warn(`API returned status ${response.status}`);
          if (isMounted) {
            setMonthsStatus(Array.from({ length: 12 }, (_, i) => ({
              month: i + 1,
              status: "pending" as const
            })));
          }
          return;
        }

        const data = await response.json();
        if (isMounted && data.data && Array.isArray(data.data)) {
          setMonthsStatus(data.data);
        }
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (error instanceof Error && error.name === "AbortError") {
          // Silently ignore abort errors (timeout or cleanup)
          return;
        }

        // Only log if not cleaned up
        if (isMounted) {
          console.error("Failed to fetch month status:", error);
          // Set default pending status on fetch error - don't block UI
          setMonthsStatus(Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            status: "pending" as const
          })));
        }
      }
    };

    fetchMonthStatus();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [type, selectedYear]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          setMessage({ type: "error", text: "CSV/Excel file must contain at least header row and 1 row of data" });
          return;
        }

        // Get headers from first row
        const headers = jsonData[0] as string[];

        // Validate file format
        const validation = validateFileFormat(headers, type as UploadType);

        if (!validation.valid) {
          setMessage({
            type: "error",
            text: `Invalid file format. Missing columns: ${validation.missing.join(", ")}. Expected columns: ${UPLOAD_FORMATS[type as UploadType].requiredColumns.join(", ")}`
          });
          return;
        }

        const parsedFileData = {
          rows: jsonData.length - 1,
          columns: jsonData[0]?.length || 0,
          data: jsonData
        };

        setFileData(parsedFileData);
        setShowUploadForm(true);

        // Validate data against database
        if (type === "petpooja") {
          await validateData(jsonData);
        } else {
          setMessage(null);
        }
      } catch (error) {
        setMessage({ type: "error", text: "Failed to parse file. Please use valid CSV/Excel format." });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const simulateProgress = (duration: number = 3000) => {
    setUploadProgress(0);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Use a curve that progresses faster initially then slows down
      const progress = Math.min((elapsed / duration) * 100, 90);
      setUploadProgress(Math.round(progress));
      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 200);
  };

  // Compress JSON data for network transfer (can reduce by 60-80%)
  const compressData = (data: any): string => {
    const json = JSON.stringify(data);
    // Browser-native compression would require compression library
    // For now, we'll use JSON minification by removing whitespace
    return json;
  };

  const validateData = async (fullData: any[], retryCount = 0) => {
    try {
      setIsValidating(true);
      setMessage(null);

      if (!fullData || fullData.length < 2) {
        setIsValidating(false);
        return;
      }

      const headers = fullData[0] as string[];

      // Find indices of columns we need for validation
      const getColumnIndex = (name: string) =>
        headers.findIndex((h) => h?.toLowerCase().trim() === name.toLowerCase().trim());

      const restaurantIdx = getColumnIndex("restaurant_name");
      const sapCodeIdx = getColumnIndex("sap_code");

      if (restaurantIdx === -1 || sapCodeIdx === -1) {
        console.warn("Validation columns not found in file");
        setIsValidating(false);
        return;
      }

      // Create a minimal version of the data for validation to save bandwidth/memory
      // For very large files (>100k rows), sample every Nth row to speed up validation
      const dataRowCount = fullData.length - 1;
      const sampleRate = dataRowCount > 100000 ? Math.ceil(dataRowCount / 100000) : 1;

      const minimalData = fullData.map((row, idx) => {
        if (idx === 0) return headers; // Keep headers
        // Sample large datasets to reduce validation time
        if (sampleRate > 1 && idx % sampleRate !== 0) {
          return null; // Will be filtered out
        }
        return [row[restaurantIdx], row[sapCodeIdx]];
      }).filter(row => row !== null);

      const dataRowCount_sampled = minimalData.length - 1;
      const attemptText = retryCount > 0 ? ` (attempt ${retryCount + 1})` : "";
      const sampledText = sampleRate > 1 ? ` [sampled ${sampleRate}:1]` : "";
      console.log(`Starting validation for ${dataRowCount_sampled}/${dataRowCount} rows${sampledText}${attemptText}`);

      const controller = new AbortController();
      // Increase timeout based on data size: 10 seconds per 1000 rows, minimum 30 seconds, maximum 60 minutes
      const estimatedTimeMs = Math.max(30000, Math.min(3600000, (dataRowCount / 1000) * 10000 + 30000));
      console.log(`⏱️ Setting validation timeout to ${(estimatedTimeMs / 1000).toFixed(0)} seconds for ${dataRowCount} rows`);
      const timeoutId = setTimeout(() => {
        console.warn(`⏱️ Validation timeout after ${estimatedTimeMs}ms - aborting`);
        controller.abort();
      }, estimatedTimeMs);

      // Show that validation is in progress
      const statusText = retryCount > 0
        ? `Retrying validation of ${dataRowCount.toLocaleString()} rows (attempt ${retryCount + 1})...`
        : `Validating ${dataRowCount.toLocaleString()} rows... This may take a moment for large files.`;
      setMessage({ type: "warning", text: statusText });

      const response = await fetch("/api/upload/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-Size": String(dataRowCount)
        },
        body: JSON.stringify({
          type,
          data: minimalData,
          isMinimal: true,
          originalIndices: { restaurantIdx, sapCodeIdx }
        }),
        signal: controller.signal
      });

      if (timeoutId) clearTimeout(timeoutId);

      console.log(`Response received: status=${response.status}, ok=${response.ok}, headers=${JSON.stringify(Object.fromEntries(response.headers))}`);

      if (!response.ok) {
        let errorText = "Validation failed";
        let isRetryable = false;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
          isRetryable = errorData.retryable === true;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }

        // Retry if the error is retryable and we haven't exceeded retry limit
        if (isRetryable && retryCount < 2) {
          console.log(`Server returned retryable error (attempt ${retryCount + 2}/3). Retrying...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return validateData(fullData, retryCount + 1);
        }

        setMessage({ type: "error", text: errorText });
        setIsValidating(false);
        return;
      }

      let result;
      try {
        result = await response.json();
        console.log(`Validation response parsed: validCount=${result.validCount}, invalidCount=${result.invalidCount}`);
      } catch (parseError) {
        console.error("Failed to parse validation response:", parseError);
        throw new Error("Failed to parse validation response: " + String(parseError));
      }

      if (result.invalidCount > 0) {
        // Map minimal row data back to original row data for display
        const mappedInvalidRows = result.invalidRows.map((invalidRow: any) => {
          const originalRow = fullData[invalidRow.rowIndex - 1]; // rowIndex is 1-based
          return {
            ...invalidRow,
            data: originalRow
          };
        });

        setValidationResult({
          ...result,
          invalidRows: mappedInvalidRows
        });

        // Select all valid rows by default
        setSelectedValidRowIndices(result.validRows.map((r: any) => r.rowIndex));
        setMessage({
          type: "warning",
          text: `Found ${result.invalidCount} invalid row(s) that will be removed on upload. Review and confirm below.`
        });
      } else {
        setValidationResult(null);
        setSelectedValidRowIndices([]);
        setMessage({ type: "success", text: "All rows validated successfully! Ready to upload." });
      }
      setIsValidating(false);
    } catch (error) {
      console.error("Validation error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

      const isFetchError = error instanceof TypeError && error.message.includes("Failed to fetch");
      const isAbortError = error instanceof Error && error.name === "AbortError";
      const isNetworkError = isFetchError || isAbortError;

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error classification:", { isFetchError, isAbortError, isNetworkError, errorMessage });

      // Retry logic for network errors
      if (isNetworkError) {
        if (retryCount < 2) {
          const waitTime = 2000 + (retryCount * 1000); // Exponential backoff: 2s, 3s, 4s
          console.log(`Retrying validation (attempt ${retryCount + 2}/3) after ${waitTime}ms...`);
          setMessage({
            type: "warning",
            text: `${isAbortError ? "Request timeout" : "Connection error"}. Retrying (attempt ${retryCount + 2}/3)...`
          });
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return validateData(fullData, retryCount + 1);
        }

        // All retries failed
        setMessage({
          type: "error",
          text: `Validation failed after 3 attempts (${isAbortError ? "timeout" : "connection error"}). Try: 1) Checking your internet connection, 2) Using a smaller file, 3) Uploading without validation by clicking "Upload anyway"`
        });
      } else {
        setMessage({
          type: "error",
          text: `Validation failed: ${errorMessage}. You can still try uploading without validation.`
        });
      }
      setIsValidating(false);
    }
  };

  // Highly optimized chunked upload with parallel transfers and larger chunks
  const uploadInChunks = async (
    uploadBody: any,
    isUpdate: boolean = false
  ): Promise<boolean> => {
    const totalRows = uploadBody.rows;
    const CHUNK_SIZE = 25000; // Increased from 5000 to 25000 rows per chunk = 5x faster
    const MAX_PARALLEL = 4; // Upload 4 chunks in parallel for 4x speedup
    const data = uploadBody.data as any[];
    const headers = data[0];
    const dataRows = data.slice(1);

    console.log(`📦 Starting optimized chunked upload: ${totalRows} total rows, chunk size: ${CHUNK_SIZE}, parallel: ${MAX_PARALLEL}`);

    // Calculate number of chunks
    const numChunks = Math.ceil(dataRows.length / CHUNK_SIZE);

    try {
      // Prepare all chunk bodies upfront
      const chunks = [];
      for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, dataRows.length);
        const chunkData = dataRows.slice(startIdx, endIdx);
        const chunkRows = chunkData.length;

        const chunkBody = {
          ...uploadBody,
          data: [headers, ...chunkData],
          rows: chunkRows,
          chunkIndex,
          totalChunks: numChunks,
          isChunked: numChunks > 1
        };

        // Only use validRowIndices for first chunk
        if (chunkIndex > 0) {
          delete chunkBody.validRowIndices;
        }

        chunks.push({ index: chunkIndex, body: chunkBody });
      }

      // Upload chunks in parallel batches
      let uploadedChunks = 0;
      for (let batchStart = 0; batchStart < chunks.length; batchStart += MAX_PARALLEL) {
        const batchEnd = Math.min(batchStart + MAX_PARALLEL, chunks.length);
        const batch = chunks.slice(batchStart, batchEnd);

        console.log(`📤 Uploading parallel batch: chunks ${batchStart + 1}-${batchEnd} of ${numChunks}`);

        // Upload batch in parallel
        const batchPromises = batch.map(async (chunk) => {
          const controller = new AbortController();
          const timeoutMs = 180000; // 3 minutes per chunk
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          try {
            const method = isUpdate && chunk.index === 0 ? "PUT" : "POST";
            const endpoint = isUpdate && chunk.index === 0 ? "/api/upload" : "/api/upload/chunk";

            const response = await fetch(endpoint, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(chunk.body),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              let errorText = "Chunk upload failed";
              try {
                const errorData = await response.json();
                errorText = errorData.error || errorText;
              } catch (e) {}
              throw new Error(`${errorText} (chunk ${chunk.index + 1}/${numChunks})`);
            }

            return chunk.index;
          } catch (chunkError) {
            console.error(`❌ Chunk ${chunk.index + 1} failed:`, chunkError);
            throw chunkError;
          }
        });

        // Wait for batch to complete
        await Promise.all(batchPromises);
        uploadedChunks += batch.length;

        // Update progress
        const progress = Math.round((uploadedChunks / numChunks) * 100);
        setUploadProgress(progress);
        setMessage({
          type: "warning",
          text: `Uploading... ${progress}% complete (${uploadedChunks}/${numChunks} chunks)`
        });
      }

      return true;
    } catch (error) {
      console.error("❌ Chunked upload failed:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedYear || !selectedMonth || !fileData) {
      setMessage({ type: "error", text: "Please select year, month and upload a file" });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setMessage({ type: "warning", text: `Uploading ${fileData.rows} rows... Please wait.` });

    try {
      const startTime = Date.now();
      console.log("🚀 Starting optimized upload for", type, selectedYear, selectedMonth, "with", fileData.rows, "rows");

      // Prepare upload body
      const uploadBody: any = {
        type,
        year: selectedYear,
        month: selectedMonth,
        rows: fileData.rows,
        columns: fileData.columns,
        data: fileData.data
      };

      // If there are invalid rows, pass the valid row indices
      if (validationResult && selectedValidRowIndices.length > 0) {
        uploadBody.validRowIndices = selectedValidRowIndices;
      }

      // Use chunked upload for large files (>10000 rows), single request for small files
      // This ensures better parallelization and faster uploads
      let result;
      if (fileData.rows > 10000) {
        await uploadInChunks(uploadBody, false);
        // After all chunks uploaded successfully, finalize
        const finalizeResponse = await fetch("/api/upload/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            year: selectedYear,
            month: selectedMonth
          })
        });

        if (!finalizeResponse.ok) {
          throw new Error("Failed to finalize upload");
        }
        result = await finalizeResponse.json();
      } else {
        // Small file - use single request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploadBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok && response.status !== 409) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        result = await response.json();

        if (response.status === 409) {
          setIsLoading(false);
          setShowConfirmDialog(true);
          setMessage(null);
          return;
        }
      }

      const elapsedMs = Date.now() - startTime;
      const speedRowsPerSec = Math.round((fileData.rows / elapsedMs) * 1000);

      setUploadProgress(100);
      setMessage({
        type: "success",
        text: `✅ Uploaded ${fileData.rows.toLocaleString()} rows in ${(elapsedMs / 1000).toFixed(1)}s (${speedRowsPerSec} rows/sec)`
      });

      setFileData(null);
      setSelectedMonth(null);
      setShowUploadForm(false);
      setIsLoading(false);

      // Fetch updated status to refresh table immediately
      try {
        const statusResponse = await fetch(`/api/uploads?type=${type}&year=${selectedYear}`);
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          if (data.data) {
            setMonthsStatus(data.data);
          }
        }
      } catch (statusError) {
        console.error("Failed to refresh status:", statusError);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsLoading(false);

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        setMessage({
          type: "error",
          text: "Cannot connect to server. Please check your internet connection and try again."
        });
      } else if (error instanceof Error && error.name === "AbortError") {
        setMessage({
          type: "error",
          text: "Upload chunk timed out. Please try again or use a smaller file."
        });
      } else {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setMessage({
          type: "error",
          text: `Upload failed: ${errorMsg}`
        });
      }
    }
  };

  const handleConfirmUpdate = async () => {
    if (!selectedYear || !selectedMonth || !fileData) {
      setMessage({ type: "error", text: "Please select year, month and upload a file" });
      return;
    }

    setIsUpdatingExisting(true);
    setUploadProgress(0);
    setMessage({ type: "warning", text: `Updating ${fileData.rows} rows... Please wait.` });

    try {
      const startTime = Date.now();
      console.log("🔄 Starting optimized update for", type, selectedYear, selectedMonth, "with", fileData.rows, "rows");

      // Prepare update body
      const updateBody: any = {
        type,
        year: selectedYear,
        month: selectedMonth,
        rows: fileData.rows,
        columns: fileData.columns,
        data: fileData.data
      };

      // If there are invalid rows, pass the valid row indices
      if (validationResult && selectedValidRowIndices.length > 0) {
        updateBody.validRowIndices = selectedValidRowIndices;
      }

      // Use chunked upload for large files (>10000 rows), single request for small files
      let result;
      if (fileData.rows > 10000) {
        await uploadInChunks(updateBody, true);
        // After all chunks uploaded successfully, finalize
        const finalizeResponse = await fetch("/api/upload/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            year: selectedYear,
            month: selectedMonth,
            isUpdate: true
          })
        });

        if (!finalizeResponse.ok) {
          throw new Error("Failed to finalize update");
        }
        result = await finalizeResponse.json();
      } else {
        // Small file - use single request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

        const response = await fetch("/api/upload", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Update failed with status ${response.status}`);
        }
        result = await response.json();
      }

      const elapsedMs = Date.now() - startTime;
      const speedRowsPerSec = Math.round((fileData.rows / elapsedMs) * 1000);

      setUploadProgress(100);
      setShowConfirmDialog(false);
      setMessage({
        type: "success",
        text: `✅ Updated ${fileData.rows.toLocaleString()} rows in ${(elapsedMs / 1000).toFixed(1)}s (${speedRowsPerSec} rows/sec)`
      });

      setFileData(null);
      setSelectedMonth(null);
      setShowUploadForm(false);
      setIsUpdatingExisting(false);

      // Fetch updated status to refresh table immediately
      try {
        const statusResponse = await fetch(`/api/uploads?type=${type}&year=${selectedYear}`);
        if (statusResponse.ok) {
          const data = await statusResponse.json();
          if (data.data) {
            setMonthsStatus(data.data);
          }
        }
      } catch (statusError) {
        console.error("Failed to refresh status:", statusError);
      }
    } catch (error) {
      console.error("Update error:", error);
      setShowConfirmDialog(false);
      setIsUpdatingExisting(false);

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        setMessage({
          type: "error",
          text: "Cannot connect to server. Please check your internet connection and try again."
        });
      } else if (error instanceof Error && error.name === "AbortError") {
        setMessage({
          type: "error",
          text: "Update chunk timed out. Please try again or use a smaller file."
        });
      } else {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        setMessage({
          type: "error",
          text: `Update failed: ${errorMsg}`
        });
      }
    }
  };

  const getMonthStatus = (monthNum: number) => {
    return monthsStatus.find(m => m.month === monthNum)?.status || "pending";
  };

  const format = UPLOAD_FORMATS[type as UploadType];

  const getDemoData = () => {
    const headers = UPLOAD_FORMATS.petpooja.requiredColumns;
    const demoRows = [
      ["Hanuram", "INV001", "2026-02-15", "2026-02-15", "12:30", "UPI", "Swiggy", "Completed", "South Delhi", "Hanuram", "Main", "Staff", "9876543210", "John Doe", "South Delhi", "2", "", "850", "100", "50", "0", "0", "20", "0", "0", "0", "1020", "Butter Chicken", "Main Course", "SAP001", "450", "1", "450", "1020"],
      ["Hanuram", "INV002", "2026-02-15", "2026-02-15", "13:15", "Cash", "Zomato", "Completed", "East Delhi", "Hanuram", "Main", "Staff", "9876543211", "Jane Smith", "East Delhi", "1", "", "650", "80", "30", "0", "0", "15", "0", "0", "0", "775", "Paneer Tikka", "Appetizer", "SAP002", "350", "2", "700", "775"],
      ["Hanuram", "INV003", "2026-02-15", "2026-02-15", "14:45", "Card", "Dining", "Completed", "West Delhi", "Hanuram", "Main", "Staff", "9876543212", "Mike Johnson", "West Delhi", "3", "", "1200", "150", "80", "0", "0", "30", "0", "0", "0", "1460", "Biryani", "Rice", "SAP003", "500", "1", "500", "1460"],
      ["Hanuram", "INV004", "2026-02-16", "2026-02-16", "11:20", "UPI", "Parcel", "Completed", "North Delhi", "Hanuram", "Main", "Staff", "9876543213", "Sarah Lee", "North Delhi", "2", "", "950", "120", "60", "0", "0", "25", "0", "0", "0", "1155", "Tandoori Chicken", "Main Course", "SAP001", "450", "1.5", "675", "1155"],
      ["Hanuram", "INV005", "2026-02-16", "2026-02-16", "15:30", "Cash", "Swiggy", "Completed", "Central Delhi", "Hanuram", "Main", "Staff", "9876543214", "Robert Brown", "Central Delhi", "1", "", "750", "95", "40", "0", "0", "18", "0", "0", "0", "903", "Dal Makhani", "Main Course", "SAP004", "400", "1.5", "600", "903"]
    ];

    return { headers, demoRows };
  };

  const downloadDemoData = () => {
    if (type !== "petpooja") {
      setMessage({ type: "error", text: "Demo data only available for Petpooja upload" });
      return;
    }

    const { headers, demoRows } = getDemoData();

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...demoRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `demo_petpooja_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setMessage({ type: "success", text: "Demo file downloaded successfully!" });
  };

  const handleDeleteData = async (password: string) => {
    if (!deleteMonth || !deleteYear) {
      setMessage({ type: "error", text: "Invalid month or year" });
      return;
    }

    try {
      setIsDeleting(true);
      console.log(`🗑️ Deleting ${type} data for ${deleteMonth}/${deleteYear}`);

      const response = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          year: deleteYear,
          month: deleteMonth,
          password
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ Data deleted successfully");
        setMessage({ type: "success", text: "Data deleted successfully!" });
        setShowDeleteDialog(false);
        setIsDeleting(false);

        // Refresh month status
        try {
          const statusResponse = await fetch(`/api/uploads?type=${type}&year=${deleteYear}`);
          if (statusResponse.ok) {
            const data = await statusResponse.json();
            if (data.data) {
              setMonthsStatus(data.data);
            }
          }
        } catch (statusError) {
          console.error("Failed to refresh status:", statusError);
        }
      } else {
        throw new Error(result.error || "Failed to delete data");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setIsDeleting(false);
      throw error;
    }
  };

  const openDeleteDialog = (monthNum: number) => {
    setDeleteMonth(monthNum);
    setDeleteYear(selectedYear);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upload Loader Animation */}
      <UploadLoader isVisible={isLoading || isUpdatingExisting} progress={uploadProgress} />

      {/* Confirm Update Dialog */}
      <ConfirmUploadDialog
        isVisible={showConfirmDialog}
        month={selectedMonth ? MONTHS[selectedMonth - 1] : ""}
        year={selectedYear}
        onConfirm={handleConfirmUpdate}
        onCancel={() => {
          setShowConfirmDialog(false);
          setIsUpdatingExisting(false);
        }}
        isLoading={isUpdatingExisting}
      />

      {/* Delete Data Dialog */}
      <DeleteDataDialog
        isVisible={showDeleteDialog}
        month={deleteMonth ? MONTHS[deleteMonth - 1] : ""}
        year={deleteYear || selectedYear}
        type={type}
        onConfirm={handleDeleteData}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeleteMonth(null);
          setDeleteYear(null);
        }}
        isLoading={isDeleting}
      />

      {/* Upload Section */}
      <div className="overflow-hidden transition-all duration-300 border border-gray-800 rounded-xl shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-600/50 transition-all duration-300">
        {/* Header with Green Background */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 sm:px-8 py-5 sm:py-6 rounded-t-xl border-b border-slate-600">
          <div className="flex items-start gap-4">
            <div className="bg-slate-500/50 p-2.5 rounded-lg mt-0.5">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Upload Data</h2>
              <p className="text-slate-300 text-sm font-normal">Import your data securely</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-6 transition-colors duration-300 bg-gray-950">
          {/* Year and Month Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-sm font-normal text-gray-300 mb-3">
                📅 Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-700 text-white text-sm font-semibold transition-all duration-300 hover:border-slate-500 cursor-pointer shadow-sm"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="group">
              <label className="block text-sm font-normal text-gray-300 mb-3">
                📆 Select Month
              </label>
              <select
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3.5 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-700 text-white text-sm font-semibold transition-all duration-300 hover:border-slate-500 cursor-pointer shadow-sm"
              >
                <option value="">-- Choose Month --</option>
                {MONTHS.map((month, idx) => (
                  <option key={month} value={idx + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-normal text-gray-300 mb-3">
              📂 Upload CSV/Excel File
            </label>
            <div className="border-2 border-dashed border-green-600 rounded-xl p-7 text-center hover:border-green-500 hover:bg-slate-700 transition-all duration-300 cursor-pointer group relative overflow-hidden bg-slate-800">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block relative z-10">
                <div className="bg-green-900/40 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm group-hover:shadow-md">
                  <FileUp className="w-8 h-8 text-green-400 group-hover:animate-bounce" />
                </div>
                <p className="text-white font-bold text-sm transition-colors duration-300 tracking-wide">Click to upload or drag & drop</p>
                <p className="text-slate-400 text-xs mt-1 transition-colors duration-300 font-medium">CSV or Excel files up to 50MB</p>
              </label>
            </div>
            <div className="mt-4">
              <button
                onClick={downloadDemoData}
                className="w-full px-4 py-2.5 bg-blue-600/20 border border-blue-600/60 text-blue-300 font-semibold rounded-lg hover:bg-blue-600/30 hover:border-blue-500 transition-all duration-300 text-sm shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-500/40"
              >
                📥 Download Demo File
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

          {/* File Info - Modern Card */}
          {fileData && (
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-3 transition-colors duration-300 shadow-sm">
              <p className="text-xs sm:text-sm text-slate-100 transition-colors duration-300 font-semibold">
                <span className="text-green-400">✓</span> File loaded: <span className="font-extrabold text-green-300">{fileData.rows}</span> rows, <span className="font-extrabold text-green-300">{fileData.columns}</span> columns
              </p>
            </div>
          )}

          {/* Validation Results */}
          {validationResult && validationResult.invalidCount > 0 && (
            <div className="space-y-3">
              <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg transition-colors duration-300 shadow-sm">
                <div className="flex gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-red-200 transition-colors duration-300">
                      {validationResult.invalidCount} row(s) don't match the database
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5 transition-colors duration-300 font-medium">
                      Only {validationResult.validCount} valid row(s) will be uploaded.
                    </p>
                  </div>
                </div>
              </div>

              {/* Invalid Rows List */}
              {validationResult.invalidRows.length > 0 && (
                <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50 transition-colors duration-300 shadow-sm">
                  <div className="bg-slate-900 px-3 py-2.5 border-b border-slate-700">
                    <p className="text-xs font-bold text-white tracking-wider">Invalid Rows</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {validationResult.invalidRows.map((row: any, idx: number) => (
                      <div key={idx} className="px-3 py-2 border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors text-xs">
                        <div className="flex items-start gap-2">
                          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 font-bold" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white">Row {row.rowIndex}</p>
                            <p className="text-red-300 mt-0.5 font-semibold">{row.reason}</p>
                            <p className="text-slate-400 font-mono truncate bg-slate-700 p-1 rounded mt-1 text-[10px]">
                              {row.data.slice(0, 3).join(" | ")}...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {message && (
            <div className={`p-3 rounded-lg flex gap-2.5 border transition-colors duration-300 shadow-sm ${
              message.type === "success" ? "bg-green-900/20 border-green-600" :
              message.type === "error" ? "bg-red-900/20 border-red-600" :
              "bg-amber-900/20 border-amber-600"
            }`}>
              {message.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0" />}
              {message.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0" />}
              {message.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0" />}
              <p className={`text-xs sm:text-sm transition-colors duration-300 font-semibold ${
                message.type === "success" ? "text-green-200" :
                message.type === "error" ? "text-red-200" :
                "text-amber-200"
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isLoading || !fileData || !selectedMonth}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm shadow-lg shadow-blue-600/50 hover:shadow-xl hover:shadow-blue-500/80 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group tracking-wide"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
            <div className="relative flex items-center justify-center gap-1.5">
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>UPLOADING...</span>
                </>
              ) : (
                <>
                  <span className="text-base">🚀</span>
                  <span>UPLOAD DATA</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Months Status */}
      <div className="overflow-hidden transition-all duration-300 border border-gray-800 rounded-xl shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-600/50 transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 sm:px-8 py-5 sm:py-6 rounded-t-xl border-b border-slate-600">
          <div className="flex items-start gap-4">
            <div className="bg-slate-500/50 p-2.5 rounded-lg mt-0.5">
              <span className="text-xl">📊</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">Upload Status</h2>
              <p className="text-slate-300 text-sm font-normal">Overview for {selectedYear}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-gray-950">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MONTHS.map((month, idx) => {
              const monthNum = idx + 1;
              const status = getMonthStatus(monthNum);
              const isUploaded = status === "uploaded";

              const isBlueCard = idx % 2 === 0;
              return (
                <div
                  key={month}
                  className={`relative group rounded-xl p-4 sm:p-5 border backdrop-blur-sm transition-all duration-300 cursor-default overflow-hidden shadow-lg ${
                    isUploaded
                      ? isBlueCard
                        ? `bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/50 hover:border-blue-400/70 hover:shadow-xl hover:shadow-blue-500/40 hover:bg-gradient-to-br hover:from-blue-900/60 hover:to-blue-800/40`
                        : `bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-500/50 hover:border-orange-400/70 hover:shadow-xl hover:shadow-orange-500/40 hover:bg-gradient-to-br hover:from-orange-900/60 hover:to-orange-800/40`
                      : `bg-gradient-to-br from-slate-800/40 to-slate-700/20 border-slate-600/40 hover:border-slate-500/60 hover:shadow-xl hover:shadow-slate-500/20 hover:bg-gradient-to-br hover:from-slate-800/50 hover:to-slate-700/30`
                  }`}
                >
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                    background: isUploaded ? (isBlueCard ? 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.15), transparent)' : 'radial-gradient(circle at 100% 0%, rgba(234, 88, 12, 0.15), transparent)') : 'none'
                  }}></div>

                  <div className="flex flex-col h-full relative z-10">
                    <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 transition-colors duration-300 ${
                      isUploaded
                        ? isBlueCard
                          ? "text-blue-100 group-hover:text-blue-50"
                          : "text-orange-100 group-hover:text-orange-50"
                        : "text-white group-hover:text-slate-100"
                    }`}>{month}</p>
                    <div className="flex items-center gap-2.5 mb-4 flex-grow">
                      {isUploaded ? (
                        <>
                          <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${
                            idx % 3 === 0 ? "bg-blue-400 shadow-blue-400/80" : idx % 3 === 1 ? "bg-orange-400 shadow-orange-400/80" : "bg-green-400 shadow-green-400/80"
                          }`}></div>
                          <span className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                            idx % 3 === 0 ? "text-blue-300" : idx % 3 === 1 ? "text-orange-300" : "text-green-300"
                          }`}>Uploaded</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 rounded-full bg-slate-500 group-hover:animate-pulse transition-all duration-300"></div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-400 group-hover:text-slate-300 transition-colors duration-300">Pending</span>
                        </>
                      )}
                    </div>
                    {isUploaded && (
                      <button
                        onClick={() => openDeleteDialog(monthNum)}
                        disabled={isDeleting}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-300 w-full disabled:opacity-50 active:scale-95 border ${
                          isBlueCard
                            ? "text-blue-300 hover:text-blue-100 hover:bg-blue-500/25 border-blue-500/40 hover:border-blue-400/70"
                            : "text-orange-300 hover:text-orange-100 hover:bg-orange-500/25 border-orange-500/40 hover:border-orange-400/70"
                        }`}
                        title="Delete this month's data"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
