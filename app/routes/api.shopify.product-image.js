import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return json({ imageUrl: null }, { status: 400 });
  }

  // Authenticate with Shopify
  const { admin } = await authenticate.admin(request);
  if (!admin || !admin.rest) {
    return json({ imageUrl: null, error: "Shopify admin REST client not available. Are you authenticated?" }, { status: 401 });
  }

  try {
    // Fetch product details from Shopify Admin API
    const product = await admin.rest.resources.Product.find({ id: productId });
    const imageUrl = product?.images?.[0]?.src || null;
    return json({ imageUrl });
  } catch (error) {
    console.error("Error fetching product image:", error);
    return json({ imageUrl: null, error: error.message || error.toString() }, { status: 500 });
  }
};
