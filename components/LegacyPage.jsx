/**
 * Renders the approved, server-rendered HTML page content migrated from the
 * original Pulse & Life HTML website. Interactive behaviour lives in public/app.js.
 */
export default function LegacyPage({ html }) {
  return <div className="legacy-site" dangerouslySetInnerHTML={{ __html: html }} />;
}
