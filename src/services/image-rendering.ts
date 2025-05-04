/**
 * Represents the dimensions of an image.
 */
export interface ImageDimensions {
  /**
   * The width of the image in pixels.
   */
  width: number;
  /**
   * The height of the image in pixels.
   */
  height: number;
}

/**
 * Asynchronously retrieves a placeholder image URL based on latent space coordinates
 * using picsum.photos for variety.
 *
 * @param x The x-coordinate in the latent space (-1 to 1).
 * @param y The y-coordinate in the latent space (-1 to 1).
 * @param dimensions The desired dimensions of the image.
 * @returns A promise that resolves to a URL string pointing to a placeholder image.
 */
export async function getPlaceholderImage(x: number, y: number, dimensions: ImageDimensions): Promise<string> {
  // Map coordinates (-1 to 1) to a large range for image ID variation
  // This is a simple mapping; a more sophisticated hash could be used.
  const seedVariation = Math.floor(((x + 1) / 2) * 500 + ((y + 1) / 2) * 500); // Range 0-1000

  // Adding a small random element to prevent identical images for very close coords sometimes
  // Use a fixed seed based on coords for consistency during hover
  const seed = `latent_${x.toFixed(4)}_${y.toFixed(4)}`; // Seed based on coords


  // Construct the URL for picsum.photos
  const url = `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`;

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150)); // 50-200ms delay

  return url;
}
