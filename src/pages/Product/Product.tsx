import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useMediaQuery } from "react-responsive";
import RelatedProducts from "@/components/product/RelatedProducts";
import FreeDeliveryIcon from "@/components/product/Free-Delivery-Icon";
import SpecialOffers from "@/components/product/Special-Offers";
import ProductSpects from "@/components/product/Product-Spects";
import ProductAddtocart from "@/components/product/Product-Addtocart";
import ProductPrice from "@/components/product/Product-Price";
import ProductTitleRating from "@/components/product/Product-Title-Rating";
import ProductImage from "@/components/product/Product-Image";
import ProductImageTablet from "@/components/product/Product-Image-Tablet";
import type { Product } from "@/types/entityTypes";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Separator } from "@radix-ui/react-select";
import ProductPageSkeleton, {
  ProductSpecsSkeleton,
} from "@/components/product/productSkeletons";

export default function ProductPage() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.user.isAuthenticated
  );
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(
    location.state?.product || null
  );
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<number>>(
    location.state?.wishlist || new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/products/${id}`
        );

        if (response.status === 200 && response.data) {
          setProduct(response.data);
        } else {
          setError("Failed to load product data");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("An error occurred while fetching the product.");
      } finally {
        setLoading(false);
      }
    };

    // Always fetch product on mount or when ID changes
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch wishlist data
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setWishlist(new Set());
        return;
      }

      try {
        const wishlistRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/wishlist/wishlistproducts`
        );

        if (wishlistRes.status === 200) {
          setWishlist(new Set(wishlistRes.data.wishlist || []));
        } else {
          setWishlist(new Set());
        }
      } catch (err) {
        console.error("Error fetching wishlist:", err);
        setWishlist(new Set());
      }
    };

    fetchWishlist();
  }, [isAuthenticated]);

  const getAverageProductRating = (): number => {
    if (!product || !product.reviews) return 0;

    const totalRating = product.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );
    return product.reviews.length > 0
      ? totalRating / product.reviews.length
      : 0;
  };

  // Error state
  if (error || !product) {
    return <ProductPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{product.name || "Loading..."}</title>
        <meta
          name="description"
          content={product.description || "Loading Product"}
        />
      </Helmet>
      <main className="px-4 py-20 md:py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {/* Product Image - Different for Tablets */}
            {isTablet ? (
              <ProductImageTablet
                images={product.images.map((image) => image.url)}
                title={product.name}
                loading={loading}
              />
            ) : (
              <ProductImage
                images={product.images.map((image) => image.url)}
                title={product.name}
                loading={loading}
              />
            )}
          </div>
          <div className="space-y-6">
            {/* Product Details */}
            <ProductTitleRating
              title={product.name}
              description={product.description}
              reviews={product.reviews}
              averageRating={
                !product.averageRating
                  ? getAverageProductRating()
                  : product.averageRating
              }
            />

            <div className="space-y-4">
              <ProductPrice
                price={product.price}
                offer={product.offerPercentage}
              />
              <FreeDeliveryIcon />
              <SpecialOffers />
              {isAuthenticated ? (
                <ProductAddtocart
                  id={product.id}
                  status={product?.status}
                  wishlist={wishlist}
                  setWishlist={setWishlist}
                  total={
                    product.price -
                    (product.price / 100) * product.offerPercentage
                  }
                  sellerId={product.sellerId}
                />
              ) : (
                <Button onClick={() => navigate("/user/auth/signin")}>
                  Login to Purchase
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Product Specifications and Related Products */}
        {loading ? (
          <ProductSpecsSkeleton />
        ) : (
          <ProductSpects
            reviews={product.reviews}
            details={product.productInfo?.details || []}
          />
        )}

        <Separator className="border" />
        <RelatedProducts
          wishlist={wishlist}
          setWishlist={setWishlist}
          category={product.categoryName}
          currentProductId={product.id}
        />
      </main>
    </div>
  );
}
