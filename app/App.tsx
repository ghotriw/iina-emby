import { HashRouter, Navigate, Route, Routes } from "react-router";
import { IINABridgeProvider } from "./hooks/useIINABridge";
import ContinueWatchingRoute from "./routes/continue-watching";
import HomeRoute from "./routes/home";
import ItemDetailRoute from "./routes/item";
import SectionRoute from "./routes/section";
import ServersRoute from "./routes/servers";
import SettingsRoute from "./routes/settings";

export function App() {
  return (
    <IINABridgeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/continue-watching" element={<ContinueWatchingRoute />} />
          <Route path="/section/:id" element={<SectionRoute />} />
          <Route path="/item/:id" element={<ItemDetailRoute />} />
          <Route path="/servers" element={<ServersRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </IINABridgeProvider>
  );
}
