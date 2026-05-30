export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      style={{ background: '#2D6A4F', color: '#fff' }}
    >
      Skip to main content
    </a>
  );
}
