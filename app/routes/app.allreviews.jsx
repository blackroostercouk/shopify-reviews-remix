import React from "react";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { Card, Page, Layout, Thumbnail } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { firestoreAdmin } from "../utils/firebase-admin";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  if (!admin || !admin.graphql) {
    return json({ products: [], error: "Shopify admin GraphQL client not available." }, { status: 401 });
  }

  const reviewsSnapshot = await firestoreAdmin.collection("reviews").get();
  const products = [];

  for (const productDoc of reviewsSnapshot.docs) {
    const productId = productDoc.id;
    const itemsSnapshot = await firestoreAdmin.collection(`reviews/${productId}/items`).get();
    const items = itemsSnapshot.docs.map(doc => doc.data());
    if (items.length === 0) continue;
    const averageRating = items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
    const reviewCount = items.length;
    // Fetch product image from Shopify GraphQL
    const gid = `gid://shopify/Product/${productId}`;
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
    products.push({
      productId,
      imageUrl,
      averageRating,
      reviewCount
    });
  }
  return json({ products });
};

export default function AllReviewsPage() {
  const { products } = useLoaderData();
  const navigate = useNavigate();
  return (
    <Page title="All Product Reviews">
      <Layout>
        <Layout.Section>
          {/* Minimal test link for navigation debugging */}
          <Link to="/app/review?productId=TEST" style={{fontWeight: 'bold', color: 'blue', marginBottom: 20, display: 'inline-block'}}>Go to Review TEST (Debug Link)</Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
            {products.map(product => (
              <button
                key={product.productId}
                type="button"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  width: 300,
                  cursor: 'pointer',
                  display: 'block',
                  border: '1px solid #dfe3e8',
                  borderRadius: 12,
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  padding: 16,
                  height: '100%',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  transition: 'box-shadow 0.2s',
                }}
                onClick={() => {
  console.log('[AllReviewsPage] Card clicked for productId:', product.productId);
  navigate(`/app/review?productId=${product.productId}`);
}}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/app/review?productId=${product.productId}`);
                  }
                }}
                tabIndex={0}
                aria-label={`Go to reviews for product ${product.productId}`}
              >
                <img
                  src={product.imageUrl || ''}
                  alt="Product image"
                  style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, background: '#f6f6f7' }}
                />
                <div style={{ marginTop: 8 }}>
                  <p>Average Rating: {product.averageRating.toFixed(2)}</p>
                  <p>Reviews: {product.reviewCount}</p>
                </div>
              </button>
            ))}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
