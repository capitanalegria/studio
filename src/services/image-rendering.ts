
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
 * @param z The optional z-coordinate in the latent space (-1 to 1).
 * @param dimensions The desired dimensions of the image.
 * @returns A promise that resolves to a URL string pointing to a placeholder image.
 */
export async function getPlaceholderImage(
    x: number,
    y: number,
    z: number | undefined,
    dimensions: ImageDimensions
): Promise<string> {

  // Use a fixed seed based on coords for consistency during hover
  // Include z in the seed if it's defined
  const zString = z !== undefined ? `_${z.toFixed(4)}` : '';
  const seed = `latent_${x.toFixed(4)}_${y.toFixed(4)}${zString}`;


  // Construct the URL for picsum.photos
  const url = `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`;

  // Simulate network delay (slightly reduced for faster feedback)
  await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 100)); // 30-130ms delay

  return url;
}
