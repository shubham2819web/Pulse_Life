import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-card">
        <span className="eyebrow"><i /> PULSE &amp; LIFE</span>
        <h1>Page not found</h1>
        <p>The page you are looking for may have moved or is no longer available.</p>
        <Link className="btn btn-primary" href="/">Back to home <span>↗</span></Link>
      </div>
    </main>
  );
}
