export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022, sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window:"readonly", document:"readonly", navigator:"readonly", console:"readonly", fetch:"readonly",
        localStorage:"readonly", sessionStorage:"readonly", setTimeout:"readonly", clearTimeout:"readonly",
        setInterval:"readonly", clearInterval:"readonly", crypto:"readonly", TextEncoder:"readonly",
        Uint8Array:"readonly", PushManager:"readonly", self:"readonly", caches:"readonly", process:"readonly",
        RegExp:"readonly", Intl:"readonly", Map:"readonly", Set:"readonly", CustomEvent:"readonly",
        Notification:"readonly", URL:"readonly", URLSearchParams:"readonly", Blob:"readonly", FileReader:"readonly",
        atob:"readonly", btoa:"readonly", alert:"readonly", confirm:"readonly", Image:"readonly", FormData:"readonly",
        requestAnimationFrame:"readonly"
      }
    },
    rules: { "no-undef":"error" }
  }
];
