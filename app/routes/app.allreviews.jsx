import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { Card, Page, Layout, Thumbnail } from "@shopify/polaris";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
  // Fetch review HTML from the API endpoint (all reviews)
  const apiUrl = `https://shopify-reviews-remix.vercel.app/api/proxy`;
  const response = await fetch(apiUrl);
  const reviewsHtml = await response.text();

  return json({ reviewsHtml });
};

export default function AllReviewsPage() {
  const { reviewsHtml } = useLoaderData();
  return (
    <Page title="All Product Reviews">
      <div dangerouslySetInnerHTML={{ __html: reviewsHtml }} />
    </Page>
  );
}
