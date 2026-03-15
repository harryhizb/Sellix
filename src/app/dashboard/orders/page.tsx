import { Suspense } from "react";
import OrdersList from "./OrdersList";
import { getOrders } from "@/app/actions/order-actions";

// Status config with SaaS dark theme colors
const statusConfig = {
  PENDING: {
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    label: "Pending"
  },
  CONFIRMED: {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Confirmed"
  },
  PROCESSING: {
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    label: "Processing"
  },
  SHIPPED: {
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    label: "Shipped"
  },
  DELIVERED: {
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    label: "Delivered"
  },
  CANCELLED: {
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Cancelled"
  },
  REFUNDED: {
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    label: "Refunded"
  }
};

type OrderStatus = keyof typeof statusConfig;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const initialData = await getOrders({
    page: typeof params.page === "string" ? parseInt(params.page) : 1,
    limit: typeof params.limit === "string" ? parseInt(params.limit) : 20,
    status: typeof params.status === "string" ? params.status : undefined,
    type: typeof params.type === "string" ? params.type : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    startDate: typeof params.startDate === "string" ? params.startDate : undefined,
    endDate: typeof params.endDate === "string" ? params.endDate : undefined,
  });

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OrdersList
        initialOrders={initialData.orders}
        initialStatistics={initialData.statistics}
        initialPagination={initialData.pagination}
        statusConfig={statusConfig}
      />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
    </div>
  );
}
