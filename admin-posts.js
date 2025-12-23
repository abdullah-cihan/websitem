const WORKER_URL = "https://github-posts-api.abdullahcihan21.workers.dev";

async function savePostToServer(post) {
  const adminKey = sessionStorage.getItem("admin_key"); // login sonrası set edeceğiz

  const res = await fetch(`${WORKER_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-ADMIN-KEY": adminKey
    },
    body: JSON.stringify(post)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}
