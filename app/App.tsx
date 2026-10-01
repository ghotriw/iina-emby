import { MantineProvider } from "@mantine/core";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import { IINABridgeProvider } from "./hooks/useIINABridge";
import HomeRoute from "./routes/home";
import ItemDetailRoute from "./routes/item";
import ServersRoute from "./routes/servers";
import { mantineTheme } from "./theme/theme";

export function App() {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
      <IINABridgeProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/item/:id" element={<ItemDetailRoute />} />
            <Route path="/servers" element={<ServersRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </IINABridgeProvider>
    </MantineProvider>
  );
}
