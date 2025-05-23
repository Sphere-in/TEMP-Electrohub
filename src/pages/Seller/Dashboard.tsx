import { useEffect, useMemo, useState } from "react";
import { Search, CalendarCheck, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Category, Order, OrderItem } from "@/types/entityTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { formatPrice } from "@/utils/FormatPrice";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
} from "recharts";
import { ChartPie } from "@/components/Admin/Chart-Pie";
import AnimatedCounter from "@/components/Common/AnimatedCounter";
import axios from "@/lib/axios";
import { DynamicSkeleton } from "@/components/Seller/Skeletons";

import { Helmet } from "react-helmet-async";
import { assets } from "@/assets/assets";

interface Stat {
  label: string;
  value: number;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Independent loading states for each component
  const [statsLoading, setStatsLoading] = useState(true);
  const [salesChartLoading, setSalesChartLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Data states
  const [orders, setOrders] = useState<Array<Order>>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [categories, setCategories] = useState<
    Array<Category & { productCount: string }>
  >([]);
  const [salesGraph, setSalesGraph] = useState<
    Array<{ date: string; amount: number }>
  >([]);

  // UI states
  const [productsPerPage, setProductsPerPage] = useState(5);
  const [selectedTab, setSelectedTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Load orders and stats independently
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const ordersResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/seller/orders`
        );

        if (ordersResponse.status === 200) {
          setOrders(ordersResponse.data?.orders);

          // Set stats from orders data
          setStats([
            {
              label: "Total Orders",
              value: ordersResponse.data?.orders?.length,
            },
            {
              label: "Order Items Overtime",
              value: ordersResponse.data?.orders?.reduce(
                (acc: number, order: Order) => acc + order.orderItems.length,
                0
              ),
            },
            {
              label: "Returns",
              value: ordersResponse.data?.orders?.reduce(
                (acc: number, order: Order) =>
                  acc +
                  order.orderItems.filter(
                    (item: OrderItem) => item.status === "Returned"
                  ).length,
                0
              ),
            },
            {
              label: "Fulfilled Orders Overtime",
              value: ordersResponse.data?.orders?.reduce(
                (acc: number, order: Order) =>
                  acc +
                  order.orderItems.filter(
                    (item: OrderItem) => item.status === "Delivered"
                  ).length,
                0
              ),
            },
          ]);

          // Mark orders and stats as loaded
          setStatsLoading(false);
          setOrdersLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setStatsLoading(true);
        setOrdersLoading(true);
      }
    };

    loadOrders();
  }, []);

  // Load sales statistics independently
  useEffect(() => {
    const loadSalesStats = async () => {
      try {
        const salesResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/seller/salesstatistics`
        );

        if (salesResponse.status === 200) {
          // Update sales graph data
          setSalesGraph(
            salesResponse.data?.weeklySales.map(
              (item: { date: Date; sales: number }) => {
                return {
                  date: formatDate(item.date).substring(0, 6),
                  amount: item.sales,
                };
              }
            )
          );
          setSalesChartLoading(false);

          // Update categories data
          setCategories(salesResponse.data?.categories);
          setCategoriesLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
        setSalesChartLoading(false);
        setCategoriesLoading(false);
      }
    };

    loadSalesStats();
  }, []);

  const highestProductCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return categories.reduce(
      (
        max: Category & { productCount: string },
        category: Category & { productCount: string }
      ) =>
        Number(category.productCount) > Number(max.productCount)
          ? category
          : max
    );
  }, [categories]);

  const allOrderItems = useMemo(
    () => orders.flatMap((order) => order.orderItems),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    let result = [...allOrderItems];

    if (selectedTab !== "All") {
      result = result.filter((item) => item.status === selectedTab);
    }

    if (searchTerm) {
      result = result.filter((orderItem) => {
        const productName = orderItem.product?.name || "Product Deleted";
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return result;
  }, [allOrderItems, searchTerm, selectedTab]);

  const totalPages = Math.ceil(filteredOrders?.length / productsPerPage);
  const paginatedOrders = (filteredOrders || []).slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  return (
    <div className="space-y-5">
      <Helmet
        title="Dashboard | Seller"
        meta={[
          {
            name: "og:url",
            property: "og:url",
            content: `${import.meta.env.VITE_APP_URL}/seller/dashboard`,
          },
        ]}
      />

      {/* Stats Section */}
      <div className="border border-primary/75 bg-primary/5 dark:bg-gradient-to-br from-primary/5 via-slate-900/25 to-primary/5 rounded-xl p-4 space-y-4 animate__animated animate__fadeIn shadow-sm">
        <h2 className="text-2xl text-primary font-semibold">Orders</h2>
        {statsLoading ? (
          <DynamicSkeleton type="stats" />
        ) : (
          <Card className="w-full lg:w-[95%] flex flex-nowrap gap-4 text-secondary-foreground bg-primary/10 border-primary/70 shadow-none rounded-lg overflow-x-auto whitespace-nowrap scrollbar-x mx-auto">
            <div className="flex items-center pl-6 space-x-2 text-primary">
              <CalendarCheck className="w-6 h-6" />
              <span className="font-semibold text-lg">Today</span>
            </div>
            {stats?.map((stat) => (
              <div
                key={stat.label}
                className="p-3 px-4 pr-10 border-l-2 border-primary/45 min-w-[200px] flex flex-col"
              >
                <div className="text-sm">{stat.label}</div>
                <AnimatedCounter end={String(stat.value)} duration={500} />
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Statistics */}
        {salesChartLoading ? (
          <DynamicSkeleton type="chart" showHeader={true} />
        ) : (
          <Card className="border-primary/75 bg-primary/5 dark:bg-gradient-to-br from-primary/10 via-slate-900/20 to-primary/5">
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
              <CardDescription>Order values over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesGraph}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    formatter={(value) => [
                      `₹${formatPrice(Number(value))}`,
                      "Amount",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pie Chart */}
        {categoriesLoading ? (
          <DynamicSkeleton type="pie" showHeader={true} />
        ) : (
          <div>
            <ChartPie
              loading={false}
              categories={categories}
              highest={highestProductCategory}
            />
          </div>
        )}
      </div>

      {/* Orders Management Section */}
      <div className="space-y-3 border border-primary/75 bg-primary/5 dark:bg-gradient-to-br from-primary/5 via-slate-900/30 to-primary/5 p-3 rounded-xl shadow-sm animate__animated animate__fadeIn">
        <h2 className="text-xl pl-2 text-primary font-semibold">
          Orders Management
        </h2>

        {/* Search and filters */}
        <div className="flex flex-nowrap gap-2 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-foreground" />
            <Input
              placeholder="Search Order..."
              className="pl-8 bg-white dark:bg-black border-primary/30 rounded-full transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={ordersLoading}
            />
          </div>
        </div>

        {/* Tabs for order filtering */}
        {ordersLoading ? (
          <DynamicSkeleton type="tabs" />
        ) : (
          <Tabs
            defaultValue="All"
            onValueChange={setSelectedTab}
            className="w-full lg:w-[85%]"
          >
            <div className="w-full overflow-x-auto scrollbar-x">
              <TabsList className="flex min-w-max items-center justify-start bg-transparent rounded-none overflow-y-hidden whitespace-nowrap">
                {[
                  "All",
                  "OrderConfirmed",
                  "Shipped",
                  "Delivered",
                  "Cancelled",
                  "Returned",
                ].map((item) => (
                  <TabsTrigger
                    key={item}
                    className="px-4 py-2 border-b-8 text-sm w-[140px] rounded-none shadow-none border-transparent 
                      data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:border-primary/20 
                      data-[state=active]:border-primary data-[state=active]:text-primary"
                    value={item}
                  >
                    {item === "OrderConfirmed" ? "Confirmed" : item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        )}

        {/* Orders table */}
        {ordersLoading ? (
          <Card className="p-2 md:p-4 border border-primary/30 rounded-xl overflow-hidden">
            <DynamicSkeleton type="table" rows={5} />
          </Card>
        ) : paginatedOrders?.length === 0 ? (
          <div className="bg-primary/5 rounded-xl border border-primary/75 p-6 text-muted-foreground text-lg italic text-center">
            Orders not available
          </div>
        ) : (
          <Card className="p-2 md:p-4 border border-primary/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-primary overflow-hidden">
                  <TableRow className="rounded-3xl border-none hover:bg-transparent">
                    <TableHead className="text-primary-foreground font-semibold rounded-tl-lg rounded-bl-lg">
                      Order
                    </TableHead>
                    <TableHead className="text-primary-foreground font-semibold">
                      Customer
                    </TableHead>
                    <TableHead className="text-primary-foreground font-semibold">
                      Date
                    </TableHead>
                    <TableHead className="text-primary-foreground font-semibold">
                      Total
                    </TableHead>
                    <TableHead className="text-primary-foreground font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-primary-foreground font-semibold rounded-br-lg rounded-tr-lg">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders?.map((orderItem: OrderItem) => (
                    <TableRow
                      key={orderItem.id}
                      onClick={() =>
                        navigate(`/seller/dashboard/orders/${orderItem.id}`, {
                          state: {
                            user: orders.find(
                              (order) => order.id === orderItem.orderId
                            )?.user,
                            orderItem,
                          },
                        })
                      }
                      className="border-b-primary/30 cursor-pointer h-[60px] hover:bg-primary/5"
                    >
                      <TableCell>
                        <div className="flex items-center gap-5">
                          {/* Check if product is null */}
                          {orderItem.product ? (
                            <>
                              <img
                                src={
                                  orderItem.product.images[0]?.url ||
                                  assets.shoppingBoyGif
                                }
                                alt="Product"
                                width={48}
                                height={48}
                                className="w-16"
                              />
                              <div className="text-sm line-clamp-2 w-56">
                                {orderItem.product.name}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-red-500">
                              Product Deleted
                            </span> // Show message if product is null
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap">
                        <span className="p-1.5 border bg-primary/10 text-primary font-semibold rounded-full">
                          {orders.find(
                            (order) => order.id === orderItem.orderId
                          )?.user?.name
                            ? orders
                                .find(
                                  (order) => order.id === orderItem.orderId
                                )!
                                .user.name.split(" ")
                                .map((letter: string) => letter[0])
                                .join("")
                                .toUpperCase()
                            : "UN"}
                        </span>
                        <span>
                          {orders.find(
                            (order) => order.id === orderItem.orderId
                          )?.user?.name || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(orderItem.createdAt)}
                      </TableCell>
                      <TableCell>
                        ₹
                        {orderItem.product
                          ? formatPrice(
                              (orderItem.product.price -
                                (orderItem.product.price / 100) *
                                  orderItem.product.offerPercentage) *
                                orderItem.quantity
                            )
                          : "N/A"}{" "}
                        {/* Show "N/A" for deleted products */}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-[10px] font-medium rounded-md ${
                            orderItem.status === "Confirmed"
                              ? "bg-yellow-100 text-yellow-800"
                              : orderItem.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : orderItem.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : orderItem.status === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : orderItem.status === "Returned"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          {orderItem.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          className="hover:bg-accent"
                          onClick={() =>
                            navigate(
                              `/seller/dashboard/orders/${orderItem.id}`,
                              {
                                state: {
                                  user: orders.find(
                                    (order) => order.id === orderItem.orderId
                                  )?.user,
                                  orderItem,
                                },
                              }
                            )
                          }
                        >
                          <ChevronRight />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {ordersLoading ? (
        <DynamicSkeleton type="pagination" />
      ) : (
        <div className="flex p-2 items-center justify-between">
          <div className="flex whitespace-nowrap space-x-2 items-center justify-start">
            <label className="text-sm">Items per page</label>
            <Select
              onValueChange={(value) => setProductsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder={String(productsPerPage)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {totalPages > 1 && (
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem  key={page}>
                      <PaginationLink
                        href="#"
                        className="hidden md:flex"
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
