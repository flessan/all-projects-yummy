import { getStore } from "@netlify/blobs";
import type { Context, Config } from "@netlify/functions";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: string;
}

export default async (req: Request, context: Context) => {
  const store = getStore("articles");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const method = req.method;

  try {
    if (method === "GET") {
      if (id) {
        const article = await store.get(id, { type: "json" });
        if (!article) return new Response("Not Found", { status: 404 });
        return new Response(JSON.stringify(article), { headers: { "Content-Type": "application/json" } });
      } else {
        const { blobs } = await store.list();
        const articles = await Promise.all(
            blobs.map(async (blob) => {
                return await store.get(blob.key, { type: "json" });
            })
        );
        // Sort by date desc
        const sorted = (articles.filter(Boolean) as Article[]).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return new Response(JSON.stringify(sorted), { headers: { "Content-Type": "application/json" } });
      }
    } else if (method === "POST") {
      const data = await req.json();
      if (!data.id) {
          data.id = Date.now().toString();
          data.createdAt = new Date().toISOString();
      }
      await store.setJSON(data.id, data);
      return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    } else if (method === "DELETE") {
       if (!id) return new Response("Missing ID", { status: 400 });
       await store.delete(id);
       return new Response("Deleted", { status: 200 });
    }
    
    return new Response("Method Not Allowed", { status: 405 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};

export const config: Config = {
  path: "/api/articles"
};
