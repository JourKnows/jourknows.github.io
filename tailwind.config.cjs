function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    // Remove the following screen breakpoint or add other breakpoints
    // if one breakpoint is not enough for you
    screens: {
      sm: "640px",
    },

    extend: {
      colors: {
        "jk-primary": "#00046D",
        "jk-secondary": "#020269",
        "jk-accent": "#314DEB",
        "jk-orange": "#F8A42E",
        "jk-red": "#AE1914",
      },
      backgroundImage: {
        "jk-navy-grad": "linear-gradient(135deg,#000080 0%,#000055 100%)",
        "jk-footer-grad": "radial-gradient(ellipse at center,#00046d 0%,#080a5a 25%,#0f1146 50%,#171832 75%,#1e1e1e 100%)",
        "jk-btn-grad": "linear-gradient(to right,#00046d,#0007d3)",
      },
      textColor: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-fill"),
        },
      },
      backgroundColor: {
        skin: {
          fill: withOpacity("--color-fill"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-text-base"),
          card: withOpacity("--color-card"),
          "card-muted": withOpacity("--color-card-muted"),
        },
      },
      outlineColor: {
        skin: {
          fill: withOpacity("--color-accent"),
        },
      },
      borderColor: {
        skin: {
          line: withOpacity("--color-border"),
          fill: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
      },
      fill: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
        transparent: "transparent",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
        display: ["Montserrat", "sans-serif"],
      },
      keyframes: {
        glassFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0px)' },
        },
        cinematicZoom: {
          '0%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        }
      },
      animation: {
        glassFadeUp: 'glassFadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        cinematicZoom: 'cinematicZoom 7s cubic-bezier(0.16, 1, 0.3, 1) both',
      },

      typography: {
        DEFAULT: {
          css: {
            pre: {
              color: false,
            },
            code: {
              color: false,
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
