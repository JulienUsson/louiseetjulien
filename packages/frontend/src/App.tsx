import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { SaveTheDate } from "./SaveTheDate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/save-the-date"
          element={
            <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 flex items-center justify-center px-4">
              <SaveTheDate />
            </div>
          }
        />
        <Route path="/" element={<Navigate to="/save-the-date" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
