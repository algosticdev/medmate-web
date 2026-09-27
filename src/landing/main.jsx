import React from "react";
import { createRoot } from "react-dom/client";
import Landing from "./Landing.jsx";
import "./landing.css";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <main style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page.</p>
        </main>
      );
    return this.props.children;
  }
}
createRoot(document.getElementById("landing-root")).render(
  <ErrorBoundary>
    <Landing />
  </ErrorBoundary>,
);
