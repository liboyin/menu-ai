import { ProcessedMenu } from '@/types/menu';

/**
 * Uploads menu image files to /api/process-menu and returns the parsed menu.
 *
 * Isolates the browser-side network call so the page component holds only UI
 * state. The empty-items case is treated as a failure because an
 * unrecognizable photo yields a 200 with no items, which the diner needs to
 * be told about rather than shown a blank menu.
 *
 * Args:
 *   files: The image files selected by the user.
 *
 * Returns:
 *   The ProcessedMenu parsed from the API response.
 *
 * Throws:
 *   Error with a user-facing message when the request fails or the response
 *   contains no menu items.
 */
export async function processMenuRequest(files: File[]): Promise<ProcessedMenu> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/process-menu', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process menu images');
  }

  const result = await response.json();
  if (!result.items || result.items.length === 0) {
    throw new Error(
      'Could not identify any menu items in this image. Please upload a clear photo of a restaurant menu.'
    );
  }

  return result;
}
