import { createTheme, MantineProvider } from "@mantine/core";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import HomeRoute from "./routes/home";
import ItemDetailRoute from "./routes/item";
import ServersRoute from "./routes/servers";

const theme = createTheme({
  primaryColor: "teal",
  defaultRadius: "md",
});

export function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/item/:id" element={<ItemDetailRoute />} />
          <Route path="/servers" element={<ServersRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  );
}
