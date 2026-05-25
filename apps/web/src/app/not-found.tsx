export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-forge-text">
      <div className="text-7xl font-extrabold text-forge-orange leading-none">404</div>
      <p className="text-[#9CA3AF] m-0">Page not found.</p>
      <a href="/" className="text-forge-orange no-underline text-sm font-semibold mt-1">
        Go home
      </a>
    </div>
  );
}
