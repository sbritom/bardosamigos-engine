import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "../AppShell";
import { plugins } from "../../../core/registry/plugins";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {plugins.map((plugin) => (
            <Route
              key={plugin.id}
              path={plugin.path}
              element={plugin.element}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}