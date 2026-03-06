import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const DATASET = import.meta.env.VITE_SANITY_DATASET || "production";

// Validate project ID (must be alphanumeric and typically 8-10 chars)
const isValidProjectId =
  PROJECT_ID &&
  /^[a-z0-9]+$/i.test(PROJECT_ID) &&
  PROJECT_ID.length >= 8 &&
  PROJECT_ID !== "your_actual_id_here";

export let client = null;

try {
  if (isValidProjectId) {
    client = createClient({
      projectId: PROJECT_ID,
      dataset: DATASET,
      useCdn: true,
      apiVersion: "2024-03-06",
    });
  } else {
    console.warn(
      "Sanity: Invalid or missing Project ID. Running in offline mode.",
    );
  }
} catch (error) {
  console.error("Sanity initialization failed:", error);
}

const builder = client ? imageUrlBuilder(client) : null;

export function urlFor(source) {
  if (!source || !builder) return null;
  try {
    return builder.image(source);
  } catch (err) {
    return null;
  }
}

/**
 * Fetch products from Sanity
 */
export const fetchProducts = async () => {
  if (!client) return [];
  try {
    const query = `*[_type == "product"] {
      _id,
      name,
      price,
      size,
      "image": image.asset->url
    }`;
    const products = await client.fetch(query);
    return products.map((item) => ({
      id: item._id,
      name: item.name,
      price: item.price,
      size: item.size,
      image: item.image || "https://via.placeholder.com/400x500?text=No+Image",
    }));
  } catch (error) {
    console.error("Error fetching products from Sanity:", error);
    return [];
  }
};

/**
 * Fetch graphics from Sanity for Studio
 */
export const fetchGraphics = async () => {
  if (!client) return [];
  try {
    const query = `*[_type == "graphic"] {
      _id,
      name,
      category,
      "src": image.asset->url
    }`;
    const graphics = await client.fetch(query);
    return graphics.map((item) => ({
      id: item._id,
      name: item.name,
      category: item.category || "general",
      src: item.src || "https://via.placeholder.com/80x80?text=Graphic",
    }));
  } catch (error) {
    console.error("Error fetching graphics from Sanity:", error);
    return [];
  }
};
