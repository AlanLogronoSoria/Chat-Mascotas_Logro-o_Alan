import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function ConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando tu cuenta...");

  useEffect(() => {
    const hash = window.location.hash;
    const accessToken = searchParams.get("access_token") || 
      (hash && new URLSearchParams(hash.substring(1)).get("access_token"));
    const refreshToken = searchParams.get("refresh_token") ||
      (hash && new URLSearchParams(hash.substring(1)).get("refresh_token"));
    const type = searchParams.get("type");

    async function confirm() {
      try {
        if (type === "signup" || type === "email" || accessToken) {
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }

          setStatus("success");
          setMessage("¡Cuenta confirmada exitosamente! Puedes volver a la app e iniciar sesión.");
          setTimeout(() => navigate("/"), 5000);
        } else {
          setStatus("error");
          setMessage("Enlace de confirmación inválido. Intenta iniciar sesión nuevamente.");
        }
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message || "Error al confirmar la cuenta. Intenta nuevamente.");
      }
    }

    confirm();
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#070B14', color: '#fff', fontFamily: 'system-ui, sans-serif',
      textAlign: 'center', padding: 24
    }}>
      <div style={{
        fontSize: status === "loading" ? 40 : 48, marginBottom: 24,
        color: status === "success" ? '#22c55e' : status === "error" ? '#ef4444' : '#00F0FF'
      }}>
        {status === "loading" ? "⏳" : status === "success" ? "✓" : "✗"}
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
        {status === "loading" ? "Confirmando..." : status === "success" ? "¡Listo!" : "Error"}
      </h1>
      <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 12, maxWidth: 320, lineHeight: 1.6 }}>
        {message}
      </p>
      {status === "success" && (
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
          Redirigiendo en unos segundos...
        </p>
      )}
    </div>
  );
}
