import { Navigate, Route, Routes } from "react-router-dom";
import { PreviewLayout } from "./PreviewLayout";
import { PreviewPage } from "./PreviewPage";
import { defaultPreviewRoute, previews } from "./previews";

export default function App() {
  return (
    <Routes>
      <Route path="/previews" element={<PreviewLayout />}>
        <Route index element={<Navigate replace to={defaultPreviewRoute} />} />
        {previews.map((preview) => (
          <Route
            key={preview.id}
            path={preview.route}
            element={<PreviewPage preview={preview} />}
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate replace to={"/previews/" + defaultPreviewRoute} />} />
    </Routes>
  );
}
