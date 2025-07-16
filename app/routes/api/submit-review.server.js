export const action = async ({ request }) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const { product_id, rating, comment, idToken } = await request.json();
    if (!product_id || !rating || !comment || !idToken) {
      return new Response("Missing fields", { status: 400 });
    }
    // Dynamically import admin and firestoreAdmin
    const admin = await import("firebase-admin");
    const decoded = await admin.auth().verifyIdToken(idToken);
    const userEmail = decoded.email || "anonymous";
    const review = {
      rating: Number(rating),
      comment,
      createdAt: new Date(),
      user: userEmail,
    };
    const { firestoreAdmin } = await import("~/utils/firebase-admin");
    const itemsRef = firestoreAdmin.collection(`reviews/${product_id}/items`);
    await itemsRef.add(review);
    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response("Unauthorized", { status: 401 });
  }
};
