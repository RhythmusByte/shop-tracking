"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#17121f", color: "#ede9fe" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1rem",
          }}
        >
          <p style={{ color: "#f87171", fontWeight: 500, marginBottom: "0.5rem" }}>Something went wrong</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            The application failed to load
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem", maxWidth: 380 }}>
            A critical error occurred. Try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
