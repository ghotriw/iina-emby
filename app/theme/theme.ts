import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
  primaryColor: "teal",
  defaultRadius: "sm",
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: "all 0.12s ease",
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        input: {
          backgroundColor: "var(--macos-bg-input)",
          borderColor: "var(--macos-border-control)",
          color: "var(--macos-text-primary)",
          borderRadius: "var(--radius-control)",
          height: "var(--height-input)",
          fontSize: "var(--font-size-sub)",
          fontFamily: "inherit",
          "&:focus": {
            borderColor: "var(--macos-border-focus)",
          },
        },
        label: {
          color: "var(--macos-text-secondary)",
          fontSize: "var(--font-size-caption)",
          fontWeight: 500,
          marginBottom: "0.25rem",
        },
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        input: {
          backgroundColor: "var(--macos-bg-input)",
          borderColor: "var(--macos-border-control)",
          color: "var(--macos-text-primary)",
          borderRadius: "var(--radius-control)",
          height: "var(--height-input)",
          fontSize: "var(--font-size-sub)",
          fontFamily: "inherit",
          "&:focus": {
            borderColor: "var(--macos-border-focus)",
          },
        },
        label: {
          color: "var(--macos-text-secondary)",
          fontSize: "var(--font-size-caption)",
          fontWeight: 500,
          marginBottom: "0.25rem",
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: "md",
        withCloseButton: false,
      },
      styles: {
        content: {
          backgroundColor: "var(--macos-bg-dialog)",
          backdropFilter: "blur(2rem)",
          WebkitBackdropFilter: "blur(2rem)",
          border: "1px solid var(--macos-border-control)",
          borderRadius: "var(--radius-dialog)",
          boxShadow: "0 1.25rem 2.5rem rgba(0, 0, 0, 0.6)",
        },
        header: {
          backgroundColor: "transparent",
        },
        title: {
          fontWeight: 600,
          fontSize: "var(--font-size-title)",
          color: "var(--macos-text-primary)",
        },
      },
    },
    Tooltip: {
      defaultProps: {
        radius: "sm",
      },
      styles: {
        tooltip: {
          backgroundColor: "rgba(30, 30, 36, 0.95)",
          color: "var(--macos-text-primary)",
          border: "1px solid var(--macos-border-control)",
          fontSize: "var(--font-size-caption)",
        },
      },
    },
  },
});
