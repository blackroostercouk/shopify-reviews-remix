import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    console.log("Shop context:", session?.shop);
    const products = await admin.rest.resources.Product.all({ limit: 1 });
    return json({ ok: true, product: products?.[0] || null });
  } catch (error) {
    let errorMsg = "";
    try {
      console.error("Shopify API error object:", error);
      if (error instanceof Response) {
        errorMsg = await error.text();
      } else if (error && error.message) {
        errorMsg = error.message;
      } else {
        errorMsg = JSON.stringify(error);
      }
    } catch (e) {
      errorMsg = "Unknown error";
    }
    return json({ ok: false, error: errorMsg }, { status: 500 });
  }
};