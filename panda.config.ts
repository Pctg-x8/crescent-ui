import { defineConfig, defineGlobalStyles } from "@pandacss/dev";

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {},
    tokens: {
      sizes: {
        content: {
          maxWidth: { value: "800px" },
        },
      },
    },
    semanticTokens: {
      colors: {
        app: {
          background: { value: "rgb(24, 28, 42)" },
          text: { value: "#ffe" },
          subtext: { value: "#ccc" },
        },
        appheader: {
          bottom: { value: "#046" },
          // TODO: これなんとかapp.backgroundからの派生の形で書けないか？
          background: { value: "rgba(24 28 42 / 60%)" },
        },
        menu: {
          background: { value: "{colors.app.background}" },
          activeLink: { value: "#75f" },
        },
        status: {
          background: {
            default: { value: "#222c40" },
            accent: { value: "#28304a" },
          },
          actions: {
            default: { value: "#67a" },
            lit: { value: "#8ac" },
          },
          border: { value: "#264958" },
        },
        label: {
          normal: {
            background: { value: "#9df" },
            text: { value: "{colors.app.background}" },
          },
        },
        button: {
          primary: {
            background: {
              default: { value: "#29d" },
              hover: { value: "#3af" },
              active: { value: "#058" },
              disabled: { value: "#999" },
            },
            text: {
              default: { value: "{colors.app.text}" },
              disabled: { value: "#ccc" },
            },
          },
        },
      },
    },
    breakpoints: {
      sm: "640px",
      lg: "1120px", // (800 + 320)px 800 is min-width of main content
      lgr: "1440px", // (1120 + 320)px 320px is rightside content
    },
  },
  globalCss: defineGlobalStyles({
    "html, body": {
      fontSize: "12px",
    },
    body: {
      color: "app.text",
      background: "app.background",
    },
  }),
  conditions: {
    extend: {
      deleted: '&[data-deleted="true"]',
      customActive: '&[data-active="true"]',
    },
  },

  // The output directory for your css system
  outdir: "styled-system",
  jsxFramework: "react",
});
