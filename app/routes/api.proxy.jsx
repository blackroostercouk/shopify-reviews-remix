

export const loader = async ({ request }) => {
  const { firestoreAdmin } = await import("../utils/firebase-admin");
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");
  if (!productId) {
    return new Response("No product_id", { status: 400, headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    }});
  }
  // Fetch reviews for this product
  const { firestoreAdmin } = await import("~/utils/firebase-admin");
  const itemsSnapshot = await firestoreAdmin.collection(`reviews/${productId}/items`).get();
  const items = itemsSnapshot.docs.map(doc => doc.data());
  const averageRating = items.length
    ? items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length
    : 0;
  // Sort reviews by createdAt (descending)
  const sorted = items.sort((a, b) => {
    const aDate = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
    const bDate = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
    return bDate - aDate;
  });
  const latestReviews = sorted.slice(0, 3);
  const reviewsHtml = latestReviews.length
    ? `<div style='margin-top:8px;'>${latestReviews.map(r => `
        <div style='border-bottom:1px solid #eee;padding:6px 0;'>
          <span style='color:#f4b400;'>${"★".repeat(r.rating || 0)}${"☆".repeat(5 - (r.rating || 0))}</span>
          <span style='margin-left:8px;'>${r.comment ? r.comment.replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</span>
        </div>`).join('')}</div>`
    : "<div style='margin-top:8px;color:#888'>No reviews yet.</div>";

  return new Response(
    `<div style='font-family:inherit'>
      <span style='font-size:1.2em;'>${"★".repeat(Math.round(averageRating))}${"☆".repeat(5 - Math.round(averageRating))}</span>
      <span>(${items.length} reviews)</span>
      ${reviewsHtml}
      <div id="firebase-auth-container"></div>
      <form id="review-form" style="margin-top:12px;display:none;">
        <label>
          Rating:
          <select name="rating">
            <option value="5">★★★★★</option>
            <option value="4">★★★★☆</option>
            <option value="3">★★★☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="1">★☆☆☆☆</option>
          </select>
        </label>
        <br>
        <label>
          Comment:
          <input name="comment" required maxlength="200" />
        </label>
        <button type="submit">Submit Review</button>
      </form>
      <div id="review-message"></div>
      <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
      <script>
        // 1. Initialize Firebase (replace with your config)
        const firebaseConfig = {
          apiKey: "AIzaSyDvL3LDJi2yZ3PjLyimoStDuj8RuSeA5rg",
          authDomain: "shopify-review-761fb.firebaseapp.com",
          projectId: "shopify-review-761fb",
          storageBucket: "shopify-review-761fb.firebasestorage.app",
          messagingSenderId: "851495741423",
          appId: "1:851495741423:web:1bf37573b29b8f9b8fb81a"
        };
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        // 2. Auth UI
        const authContainer = document.getElementById('firebase-auth-container');
        const reviewForm = document.getElementById('review-form');
        const reviewMessage = document.getElementById('review-message');

        firebase.auth().onAuthStateChanged(user => {
          if (user) {
            reviewForm.style.display = '';
            authContainer.innerHTML = 'Signed in as ' + user.email + ' <button id="signout">Sign Out</button>';
            document.getElementById('signout').onclick = () => firebase.auth().signOut();
          } else {
            reviewForm.style.display = 'none';
            authContainer.innerHTML = '<button id="signin">Sign in with Google</button>';
            document.getElementById('signin').onclick = () => {
              firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
            };
          }
        });

        // 3. Submit Review
        reviewForm.onsubmit = async e => {
          e.preventDefault();
          const user = firebase.auth().currentUser;
          if (!user) return;
          const token = await user.getIdToken();
          const rating = reviewForm.rating.value;
          const comment = reviewForm.comment.value;
          const res = await fetch('https://anti-younger-enhancement-zope.trycloudflare.com/api/submit-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: "${productId}",
              rating,
              comment,
              idToken: token
            })
          });
          if (res.ok) {
            reviewMessage.innerText = 'Review submitted!';
            reviewForm.reset();
            // Optionally, reload the widget or reviews
          } else {
            reviewMessage.innerText = 'Failed to submit review';
          }
        };
      <\/script>
    </div>`,
    {
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    }
  );
};

// Handle OPTIONS preflight for CORS
export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
};
