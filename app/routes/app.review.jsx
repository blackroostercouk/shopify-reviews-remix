import React, { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, DataTable, Thumbnail } from "@shopify/polaris";
import { Spinner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { firestoreAdmin } from "../utils/firebase-admin";

export const loader = async ({ request }) => {
  console.log("[REVIEW LOADER] loader called for URL:", request.url);
  const { admin } = await authenticate.admin(request);
  if (!admin || !admin.graphql) {
    return json({ reviews: [], error: "Shopify admin GraphQL client not available." }, { status: 401 });
  }

  // Support filtering by productId query param
  const url = new URL(request.url);
  const filterProductId = url.searchParams.get("productId");
  console.log("[REVIEW LOADER] filterProductId:", filterProductId);

  // Get all product reviews from Firestore
  const reviewsSnapshot = await firestoreAdmin.collection("reviews").get();
  const reviews = [];

  for (const productDoc of reviewsSnapshot.docs) {
    const productId = productDoc.id;
    console.log("[REVIEW LOADER] Found productId:", productId);
    if (filterProductId && String(productId) !== String(filterProductId)) continue;
    console.log(productId);
    const itemsSnapshot = await firestoreAdmin.collection(`reviews/${productId}/items`).get();
    const items = itemsSnapshot.docs.map(doc => doc.data());
    console.log(items);
    // Fetch product image from Shopify GraphQL
    const gid = `gid://shopify/Product/${productId}`;
    console.log(gid);
    const query = await admin.graphql(`
      query MyQuery {
        product(id: "${gid}") {
          images(first: 1) {
            edges {
              node {
                src
                altText
              }
            }
          }
        }
      }
    `);
    let imageUrl = null;
    const responseJson = await query.json();
    imageUrl = responseJson.data.product.images.edges[0].node.src;
    for (const item of items) {
      reviews.push({
        productId,
        imageUrl,
        ...item,
      });
    }
  }

  console.log("[REVIEW LOADER] Returning reviews:", reviews);
  return json({ reviews });
};

import { useSearchParams } from "@remix-run/react";

export default function ReviewPage() {
  const { reviews } = useLoaderData();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  console.log("[ReviewPage] rendered with productId:", productId);
  console.log(reviews); 
  // Format rows for Polaris DataTable
  const rows = (reviews || []).map(r => [
    r.imageUrl ? <Thumbnail size="small" source={r.imageUrl} alt="Product image" /> : <span>—</span>,
    r.productId,
    r.comment || "",
    r.createdAt && r.createdAt.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : ""),
    r.rating || ""
  ]);

  return (
    <Page title={productId ? `Reviews for ${productId}` : "All Product Reviews"}>

      <Card sectioned>
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "numeric"]}
          headings={["Image", "Product ID", "Comment", "Created At", "Rating"]}
          rows={rows}
          emptyState="No reviews found."
        />
      </Card>
    </Page>
  );
}
