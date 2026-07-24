/**
 * Helper to record a content/page view event to server visitor analytics.
 */
export async function recordVisitorView(params: {
  contentId?: string;
  title: string;
  contentType: 'Berita' | 'Foto' | 'Agenda' | 'Infografis' | 'Video' | 'Halaman' | 'Link';
}) {
  try {
    await fetch('/api/visitor/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.warn('Failed recording visitor view:', err);
  }
}
