import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Error boundary: if anything throws, show a readable message instead of a blank screen.
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("App crash:", err, info); }
  render() {
    if (this.state.err) {
      return React.createElement("div", { style: {
        minHeight: "100vh", display: "grid", placeItems: "center", padding: 24,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", background: "#F2F4FB", color: "#0F172A" } },
        React.createElement("div", { style: {
          maxWidth: 420, background: "#fff", border: "1px solid #E9EBF5", borderRadius: 16,
          padding: 28, boxShadow: "0 10px 30px rgba(15,23,42,.08)", textAlign: "center" } },
          React.createElement("div", { style: { fontSize: 18, fontWeight: 800, marginBottom: 8 } }, "Something went wrong"),
          React.createElement("div", { style: { fontSize: 13.5, color: "#64748B", lineHeight: 1.5, marginBottom: 18 } },
            "The app hit an unexpected error and couldn't display this screen. Your data is safe. Reloading usually fixes it."),
          React.createElement("button", { onClick: () => window.location.reload(), style: {
            background: "#7C5CFA", color: "#fff", border: "none", borderRadius: 11, padding: "11px 20px",
            fontSize: 14, fontWeight: 700, cursor: "pointer" } }, "Reload"),
          React.createElement("div", { style: { fontSize: 11, color: "#94A3B8", marginTop: 14, wordBreak: "break-word" } },
            String(this.state.err && this.state.err.message || this.state.err))
        )
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
);
