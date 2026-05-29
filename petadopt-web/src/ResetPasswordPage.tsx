import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

type Status = "form" | "loading" | "success" | "error";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState<Status>("form");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      setStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const hash = window.location.hash;

      const hashParams = hash
        ? new URLSearchParams(hash.substring(1))
        : null;

      const accessToken =
        searchParams.get("access_token") ||
        hashParams?.get("access_token");

      const refreshToken =
        searchParams.get("refresh_token") ||
        hashParams?.get("refresh_token");

      if (!accessToken) {
        throw new Error(
          "Enlace de restablecimiento inválido o expirado."
        );
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      });

      if (sessionError) {
        throw sessionError;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage(
        "Contraseña actualizada correctamente. Ya puedes iniciar sesión en la app."
      );

      setTimeout(() => {
        navigate("/");
      }, 5000);
    } catch (e: unknown) {
      setStatus("error");

      if (e instanceof Error) {
        setMessage(e.message);
      } else {
        setMessage("Error al restablecer la contraseña.");
      }
    }
  };

  const showForm =
    status === "form" ||
    status === "error" ||
    status === "loading";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#070B14",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: "100%",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#00F0FF",
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          Restablecer contraseña
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: 14,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Ingresa tu nueva contraseña.
        </p>

        {showForm && (
          <>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 15,
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
                opacity: status === "loading" ? 0.7 : 1,
              }}
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 15,
                marginBottom: 16,
                outline: "none",
                boxSizing: "border-box",
                opacity: status === "loading" ? 0.7 : 1,
              }}
            />

            <button
              onClick={handleReset}
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background:
                  status === "loading"
                    ? "#374151"
                    : "linear-gradient(135deg, #00F0FF, #6A0DAD)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor:
                  status === "loading"
                    ? "default"
                    : "pointer",
                opacity: status === "loading" ? 0.6 : 1,
              }}
            >
              {status === "loading"
                ? "Actualizando..."
                : "Restablecer contraseña"}
            </button>
          </>
        )}

        {status === "success" && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.12)",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(34, 197, 94, 0.22)",
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 32,
                color: "#22c55e",
                marginBottom: 12,
              }}
            >
              ✓
            </div>

            <p
              style={{
                color: "#4ade80",
                fontSize: 14,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {message}
            </p>

            <p
              style={{
                color: "#64748b",
                fontSize: 12,
                marginTop: 12,
              }}
            >
              Redirigiendo...
            </p>
          </div>
        )}

        {status === "error" && message && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              borderRadius: 16,
              padding: 14,
              border: "1px solid rgba(239, 68, 68, 0.22)",
              marginTop: 8,
            }}
          >
            <p
              style={{
                color: "#fca5a5",
                fontSize: 13,
                margin: 0,
              }}
            >
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}