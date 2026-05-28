import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Web Auxiliar de PetAdopt</h1>
      <p>Servicio de autenticación funcionando</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/confirm" element={<ConfirmPage />} /> */}
        {/* <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
