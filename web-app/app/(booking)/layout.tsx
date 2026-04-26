export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Leaflet CSS — loaded only on booking pages */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      {children}
    </>
  );
}
