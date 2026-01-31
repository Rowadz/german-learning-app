import { HashRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { QuizzesPage } from "./pages/QuizzesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CategoryDetailPage } from "./pages/CategoryDetailPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ManagePage } from "./pages/ManagePage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-base-100">
        <Navbar />
        <main className="pb-6 sm:pb-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route
              path="/categories/:categoryId"
              element={<CategoryDetailPage />}
            />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/manage" element={<ManagePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
