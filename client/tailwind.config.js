/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        screens: {
          xxxl: "1600px",
          xxl: "1400px",
          xs: "375px",
        },
        fontFamily: {
          inter: ["Inter", "sans-serif"],
          poppins: ['"Poppins"', "sans-serif"],
          blackops: ['"Black Ops One"', "system-ui"],
        },
        container: {
          center: "true",
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        colors: {
          afPrimary: "#111827",
          afWhite: "#FFFFFF",
          afBlack: "#000000",
          afLightGold: "#CBA334",
          afHarvestGold: "#FFAE02",
          afDarkPurple: "#0F172A",
          lightblue: "rgba(100, 116, 139, 1)",
  
          bluelight: "rgba(75, 85, 99, 1)",
          snowwhite: "rgba(255, 255, 255, 1)",
          snowdark: "rgba(15, 23, 42, 1)",
          lightbodercolor: "rgba(203, 213, 225, 1)",
          darkgrey: "#111827",
          afLightGray: "#F0F0F0",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          e_challenge_hea: "rgba(17, 24, 39, 1)",
          e_challenge_para: "rgba(229, 231, 235, 1)",
          e_challenge_btn: "rgba(255, 174, 2, 1)",
          e_challenge_nav: "rgba(241, 245, 249, 1)",
          e_challenge_div: "rgba(240, 240, 240, 1)",
          e_challenge_title: "rgba(0, 0, 0, 1)",
          e_challenge_inner: "rgba(17, 24, 39, 0.6)",
          e_challenge_rewa: "rgba(17, 24, 39, 1)",
          e_challenge_btncom: "rgba(220, 252, 231, 1)",
          e_challenge_btnpen: "rgba(254, 249, 195, 1)",
          e_challenge_btnpenin: "rgba(202, 138, 4, 1)",
          e_challenge_btncoml: "rgba(22, 163, 74, 1)",
          e_reward_para: "rgba(0, 0, 0, 0.7)",
          e_rewarddiv: "rgba(246, 246, 246, 1)",
          e_rewardnow: "rgba(16, 24, 40, 0.05) ",
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          chart: {
            1: "hsl(var(--chart-1))",
            2: "hsl(var(--chart-2))",
            3: "hsl(var(--chart-3))",
            4: "hsl(var(--chart-4))",
            5: "hsl(var(--chart-5))",
          },
          sidebar: {
            DEFAULT: "hsl(var(--sidebar-background))",
            foreground: "hsl(var(--sidebar-foreground))",
            primary: "hsl(var(--sidebar-primary))",
            "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
            accent: "hsl(var(--sidebar-accent))",
            "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
            border: "hsl(var(--sidebar-border))",
            ring: "hsl(var(--sidebar-ring))",
          },
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  };