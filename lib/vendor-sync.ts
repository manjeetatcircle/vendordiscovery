import { prisma } from "@/lib/prisma";
import { fetchZipVendors } from "@/lib/zip-api";

export type SyncSummary = {
  syncRunId: number;
  recordsProcessed: number;
  status: "SUCCESS" | "FAILED";
  errorMessage: string | null;
};

export async function syncVendorsFromZip(): Promise<SyncSummary> {
  const run = await prisma.syncRun.create({
    data: {
      status: "RUNNING"
    }
  });

  try {
    const records = await fetchZipVendors();
    let processed = 0;

    for (const record of records) {
      const vendorId = String(record.id);
      if (!record.name) {
        continue;
      }

      await prisma.vendor.upsert({
        where: {
          vendorId
        },
        create: {
          vendorId,
          vendorName: record.name,
          vendorDescription: record.description,
          requestTitle: record.request_title,
          requestDescription: record.request_description,
          requestorName: record.requestor_name,
          requestorEmail: record.requestor_email,
          requestId: record.request_id ? String(record.request_id) : null,
          department: record.department,
          category: record.category,
          subcategory: record.subcategory,
          status: record.status,
          sourceLastUpdatedAt: record.updated_at ? new Date(record.updated_at) : null
        },
        update: {
          vendorName: record.name,
          vendorDescription: record.description,
          requestTitle: record.request_title,
          requestDescription: record.request_description,
          requestorName: record.requestor_name,
          requestorEmail: record.requestor_email,
          requestId: record.request_id ? String(record.request_id) : null,
          department: record.department,
          category: record.category,
          subcategory: record.subcategory,
          status: record.status,
          sourceLastUpdatedAt: record.updated_at ? new Date(record.updated_at) : null
        }
      });

      processed += 1;
    }

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        recordsProcessed: processed
      }
    });

    return {
      syncRunId: run.id,
      recordsProcessed: processed,
      status: "SUCCESS",
      errorMessage: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message
      }
    });

    return {
      syncRunId: run.id,
      recordsProcessed: 0,
      status: "FAILED",
      errorMessage: message
    };
  }
}
