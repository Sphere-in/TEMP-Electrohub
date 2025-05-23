import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquareText, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReviewEditModel from "@/components/User/ReviewEditModel";
import axios from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { Product } from "@/types/entityTypes";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import { ReviewSkeleton } from "@/components/User/UserSkeletons";

export interface ReviewType {
  id: number;
  content: string;
  rating: number;
  userId: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Array<ReviewType>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getAllReviews = async () => {
      try {
        const respone = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/products/review/reviews`
        );
        if (respone.status === 200 && respone.data.length > 0) {
          setReviews(respone.data);
        }
      } catch (error: any) {
        console.log(error);
        toast.error(error.message, {
          position: "top-center",
          theme: "dark",
        });
      } finally {
        setIsLoading(false);
      }
    };
    getAllReviews();
  }, []);

  const handleDelete = async (reviewId: number) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/user/products/review/${reviewId}`
      );
      if (response.status === 200) {
        toast.success("Review deleted successfully", {
          position: "top-center",
          theme: "dark",
        });
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      }
    } catch (error: any) {
      console.log(error);
      toast.error(error.message, {
        position: "top-center",
        theme: "dark",
      });
    }
  };

  return (
    <Card className="h-full flex flex-col rounded-xl shadow-md">
      <Helmet>
        <title>My Reviews - Electrohub</title>
        <meta
          name="description"
          content="View and manage your product reviews. Share your experience and help others make informed buying decisions."
        />
      </Helmet>

      <CardHeader>
        <h1 className="text-xl sm:text-2xl font-semibold">
          My Reviews ({reviews.length})
        </h1>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6">
        {!isLoading ? (
          reviews.length > 0 ? (
            reviews.map((review) => (
              <Card
                key={review.id}
                className="flex flex-col cursor-pointer sm:flex-row items-center p-5 justify-between border-b gap-4 border rounded-xl bg-slate-50/35 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-primary/5 hover:border-slate-500 dark:hover:border-primary/35 shadow-sm"
              >
                {/* Left Section (Image + Details) */}
                <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 w-full">
                  <img
                    src={review.product.images[0].url}
                    alt={review.product.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 object-contain rounded self-center"
                  />
                  <div className="flex-1 p-2 sm:p-5 text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-medium mb-2">
                      {review.product.name}
                    </h3>
                    <div className="flex justify-center sm:justify-start items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="ml-1 font-semibold">
                        {review.rating}.0/5
                      </span>
                    </div>
                    <p className="text-accent-foreground/90 text-sm sm:text-base mb-3">
                      {review.content}
                    </p>
                    <div className="flex justify-center sm:justify-start items-center gap-2 text-xs sm:text-sm text-accent-foreground/80 mb-3">
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section (Buttons) */}
                <div className="flex justify-center md:justify-end gap-2 w-full md:w-auto">
                  {/* Just an Edit Button with pencil icon */}
                  <ReviewEditModel
                    reviewId={review.id}
                    oldRating={review.rating}
                    content={review.content}
                    setReviews={setReviews}
                  />
                  <Button
                    onClick={() => handleDelete(review.id)}
                    className="bg-destructive dark:bg-red-700 dark:border-red-500 border rounded-xl text-destructive-foreground hover:bg-gray-100 flex items-center md:w-auto shadow-none"
                  >
                   Delete
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <MessageSquareText className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-2" />
              <h1 className="font-semibold text-2xl text-gray-700 dark:text-gray-300">
                No Reviews Yet
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Be the first to share your thoughts!
              </p>
            </div>
          )
        ) : (
          <ReviewSkeleton />
        )}
      </CardContent>
    </Card>
  );
};

export default Reviews;
