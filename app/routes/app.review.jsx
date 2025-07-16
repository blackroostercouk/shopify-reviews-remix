import React, { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, DataTable, Thumbnail } from "@shopify/polaris";
import { Spinner } from "@shopify/polaris";

import { useSearchParams } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  const url = new URL(request.url);
  const filterProductId = url.searchParams.get("productId");

  let apiUrl = `https://shopify-reviews-remix.vercel.app/api/proxy`;
  if (filterProductId) {
    apiUrl += `?product_id=${encodeURIComponent(filterProductId)}`;
  }
  const response = await fetch(apiUrl);
  const reviewsHtml = await response.text();

  return json({ reviewsHtml });
};

export default function ReviewPage() {
  const { reviewsHtml } = useLoaderData();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  console.log("[ReviewPage] rendered with productId:", productId);

  return (
    <Page title={productId ? `Reviews for ${productId}` : "All Product Reviews"}>
      <div dangerouslySetInnerHTML={{ __html: reviewsHtml }} />
    </Page>
  );
}
