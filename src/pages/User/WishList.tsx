import { ShoppingCart, Trash2, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assets } from "@/assets/assets";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Product } from "@/types/entityTypes";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { formatPrice } from "@/utils/FormatPrice";
import { WishlistSkeleton } from "@/components/User/UserSkeletons";

export function Wishlist() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<Array<Product>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getAllWishlistItems = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/wishlist`
        );
        if (response.status === 200) {
          setWishlistItems(response.data.products);
        }
      } catch (error: any) {
        toast.error(error.message, {
          position: "top-center",
          theme: "dark",
        });
      } finally {
        setIsLoading(false);
      }
    };
    getAllWishlistItems();
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/cart/add/${productId}`,
        { quantity: "1" }
      );
      if (response.status === 200) {
        toast.success(response.data?.message, {
          position: "top-center",
          theme: "dark",
        });
      }
    } catch (error: any) {
      toast.error(error.message, {
        position: "top-center",
        theme: "dark",
      });
    }
  };

  const handleDelete = async (productId: number) => {
    setWishlistItems((prev) => prev?.filter((item) => item.id !== productId));
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/wishlist/${productId}`
      );

      if (response.status === 200) {
        toast.success(response.data.message, {
          position: "bottom-center",
          theme: "dark",
        });
      } else {
        toast.error("Error updating wishlist", {
          position: "bottom-center",
          theme: "dark",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating wishlist", {
        position: "top-center",
        theme: "dark",
      });
    }
  };

  return (
    <Card className="h-full flex flex-col rounded-xl shadow-md">
      <Helmet
        title="Wishlist | Electrohub"
        meta={[
          {
            name: "description",
            content: "All Wishlist products Of You",
          },
        ]}
      />
      <CardHeader>
        <div className="flex items-center gap-4 mb-6">
          <img
            src={assets.wishList || "/placeholder.svg"}
            alt="Wishlist Icon"
            className="w-16 h-16"
          />
          <h1 className="text-2xl font-bold">Your Wishlist</h1>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <WishlistSkeleton />
        ) : wishlistItems.length > 0 ? (
          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center gap-4 p-3 md:p-4 border rounded-xl bg-slate-50/35 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-primary/5 hover:border-slate-500 dark:hover:border-primary/35 shadow-sm"
              >
                {/* Product Image */}
                <img
                  onClick={() => navigate(`/product/${item.id}`)}
                  src={item.images[0].url || "/placeholder.svg"}
                  alt={item.name}
                  className="w-48 h-48 sm:w-32 sm:h-32 cursor-pointer object-contain rounded-lg"
                />

                {/* Product Details */}
                <div
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="flex-1 text-center sm:text-left cursor-pointer"
                >
                  <h3 className="font-medium text-lg mb-1">{item.name}</h3>
                  <span className="text-lg font-bold">
                    ₹
                    {formatPrice(
                      item.price * 1 - (item.offerPercentage / 100) * item.price
                    )}
                  </span>
                  <div
                    className={`text-sm font-medium ${
                      item.status !== "OutOfStock"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {item.status !== "OutOfStock" ? "In Stock" : "Out of Stock"}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {item.status !== "OutOfStock" && (
                    <Button
                      variant="outline"
                      className="p-2 px-4 hover:bg-green-100 dark:hover:bg-green-700/20 border-green-700/30 dark:border-green-900 rounded-xl"
                      aria-label="Add to Cart"
                      onClick={() => handleAddToCart(item.id)}
                    >
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                      <span className="text-green-900 font-semibold dark:text-green-700">
                        Add to Cart
                      </span>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-700/20 border-red-700/30 dark:border-red-900 rounded-xl"
                    aria-label="Remove from Wishlist"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <HeartOff className="h-24 w-24 text-red-500 bg-red-100/75 dark:bg-red-700/30 shadow-sm p-4 rounded-full mb-4" />

            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Oops! Your Wishlist is Empty
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Start adding your favorite products and save them for later!
            </p>

            <Button
              onClick={() => navigate("/")}
              className="mt-5 px-6 py-3 bg-primary hover:bg-primary/90 transition-all text-white font-bold rounded-lg shadow-md"
            >
              Browse Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
