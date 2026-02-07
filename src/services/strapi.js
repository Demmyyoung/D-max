// Strapi API Service
const STRAPI_URL = "http://localhost:1337";

/**
 * Fetch products from Strapi
 */
export const fetchProducts = async () => {
  try {
    const response = await fetch(`${STRAPI_URL}/api/products?populate=*`);
    if (!response.ok) throw new Error("Failed to fetch products");
    const data = await response.json();

    return data.data.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      size: item.size,
      image: item.image?.url
        ? `${STRAPI_URL}${item.image.url}`
        : "https://via.placeholder.com/400x500?text=No+Image",
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

/**
 * Fetch mockups (garments) from Strapi for Studio
 */
export const fetchMockups = async () => {
  try {
    const response = await fetch(`${STRAPI_URL}/api/mockups?populate=*`);
    if (!response.ok) throw new Error("Failed to fetch mockups");
    const data = await response.json();

    return data.data.map((item) => ({
      id: item.id,
      name: item.name,
      color: item.defaultColor || "#FFFFFF",
      image: item.image?.url
        ? `${STRAPI_URL}${item.image.url}`
        : "https://via.placeholder.com/400x500?text=Mockup",
    }));
  } catch (error) {
    console.error("Error fetching mockups:", error);
    return [];
  }
};

/**
 * Fetch graphics from Strapi for Studio
 */
export const fetchGraphics = async () => {
  try {
    const response = await fetch(`${STRAPI_URL}/api/graphics?populate=*`);
    if (!response.ok) throw new Error("Failed to fetch graphics");
    const data = await response.json();

    return data.data.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category || "general",
      src: item.image?.url
        ? `${STRAPI_URL}${item.image.url}`
        : "https://via.placeholder.com/80x80?text=Graphic",
    }));
  } catch (error) {
    console.error("Error fetching graphics:", error);
    return [];
  }
};
