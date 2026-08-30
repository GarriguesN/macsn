// app/page.tsx — landing text for the backend
export default function Home() {
  return (
    <section style={{ marginTop: 24 }}>
      <h2>Available endpoints</h2>
      <ul>
        <li>
          <code>GET&nbsp;&nbsp;/api/health</code>
        </li>
        <li>
          <code>POST&nbsp;/api/scan</code>
        </li>
        <li>
          <code>GET&nbsp;&nbsp;/api/meals</code> ·{" "}
          <code>POST /api/meals</code>
        </li>
        <li>
          <code>GET /api/meals/[id]</code> ·{" "}
          <code>PATCH /api/meals/[id]</code> ·{" "}
          <code>DELETE /api/meals/[id]</code>
        </li>
        <li>
          <code>GET&nbsp;&nbsp;/api/meals/totals?date=YYYY-MM-DD</code>
        </li>
      </ul>
    </section>
  );
}
