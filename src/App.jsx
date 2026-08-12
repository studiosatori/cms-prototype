import { Routes, Route, Navigate } from "react-router-dom";
import TopNav from "./components/TopNav";
import Content from "./pages/Content";
import ContentDetail from "./pages/ContentDetail";
import Catalogue from "./pages/Catalogue";
import CatalogueItemDetail from "./pages/CatalogueItemDetail";
import ContentTypes from "./pages/ContentTypes";
import ContentTypeDetail from "./pages/ContentTypeDetail";
import Media from "./pages/Media";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-[#f7f7f8]">
      <TopNav />
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/content" replace />} />
          <Route path="/content" element={<Content />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/catalogue/item/:id" element={<CatalogueItemDetail />} />
          <Route path="/content-types" element={<ContentTypes />} />
          <Route path="/content-types/:id" element={<ContentTypeDetail />} />
          <Route path="/media" element={<Media />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
