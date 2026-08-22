import { expect, test } from "@playwright/test";
import { api, getAdminToken, loginAsAdmin } from "./helpers";

/**
 * Media / R2 E2E tests:
 *   - Upload image via API
 *   - Metadata saved correctly
 *   - Image accessible via public proxy
 *   - Upload validation (size, type)
 *   - Media listing
 *   - Delete media
 */

const VALID_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("media / R2", () => {
  let token: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();
  });

  test("upload image — R2 stores it, metadata saved", async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/v1/admin/media/upload", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "qa-test.png",
          mimeType: "image/png",
          buffer: Buffer.from(VALID_PNG, "base64"),
        },
        folder: "articles",
      },
    });
    expect(res.status()).toBe(201);
    const data = (await res.json()) as { data: { url: string; secureUrl?: string } };
    const url = data.data.secureUrl || data.data.url;
    expect(url).toBeTruthy();
    expect(url).toContain("https://");
  });

  test("upload rejects non-image file", async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/v1/admin/media/upload", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "test.exe",
          mimeType: "application/octet-stream",
          buffer: Buffer.from("not-an-image"),
        },
        folder: "articles",
      },
    });
    // Should reject with 400 or 415
    expect([400, 415]).toContain(res.status());
  });

  test("upload without auth is rejected", async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/v1/admin/media/upload", {
      multipart: {
        file: {
          name: "test.png",
          mimeType: "image/png",
          buffer: Buffer.from(VALID_PNG, "base64"),
        },
        folder: "articles",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("media library returns paginated list of uploaded files", async ({ request }) => {
    const res = await api(request, "/admin/media", token);
    expect(res.status).toBe(200);
    const data = res.data as { items: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("R2 bucket is accessible and images are served", async ({ request }) => {
    // Get a media item and try to access its image URL
    const mediaList = await api(request, "/admin/media", token);
    expect(mediaList.status).toBe(200);
    const media = mediaList.data as { items: { url: string }[] };
    if (media.items.length > 0) {
      const imageUrl = media.items[0].url;
      // URL may be absolute (https://media.galaxytv4k.online/...) or relative (/media/...)
      const fullUrl = imageUrl.startsWith("http") ? imageUrl : `http://localhost:4000${imageUrl}`;
      const imgRes = await request.get(fullUrl);
      expect(imgRes.status()).toBe(200);
    }
  });

  test("delete media works", async ({ request }) => {
    // Upload first
    const upload = await request.post("http://localhost:4000/api/v1/admin/media/upload", {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: {
          name: "delete-test.png",
          mimeType: "image/png",
          buffer: Buffer.from(VALID_PNG, "base64"),
        },
        folder: "articles",
      },
    });
    expect(upload.status()).toBe(201);

    // Find and delete via the media list
    const list = await api(request, "/admin/media", token);
    const items = (list.data as { items: { id: number; filename: string }[] }).items;
    const item = items.find((i) => i.filename === "delete-test.png");
    if (item) {
      const del = await api(request, `/admin/media/${item.id}`, token, { method: "DELETE" });
      expect([200, 204]).toContain(del.status);
    }
  });
});
