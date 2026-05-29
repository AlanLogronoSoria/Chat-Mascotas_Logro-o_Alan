import { BrowserRouter, Routes, Route } from "react-router-dom";
import ConfirmPage from "./ConfirmPage";
import ResetPasswordPage from "./ResetPasswordPage";

function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#070B14', color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: '#00F0FF', letterSpacing: -1 }}>PetAdopt</h1>
      <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>Servicio de autenticación funcionando</p>
      <p style={{ color: '#64748b', fontSize: 12, marginTop: 16 }}>Redirecciona a la app móvil para continuar</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
