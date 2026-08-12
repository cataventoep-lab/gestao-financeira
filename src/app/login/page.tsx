"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconMail, IconLock, IconEye, IconEyeOff } from "@/components/Icons";
import { LogoCatavento } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="login-bg">
      <form onSubmit={handleSubmit} className="login-card">
        <div className="login-head">
          <div className="login-logo">
            <LogoCatavento />
          </div>
          <div className="login-divider"></div>
          <h2>Controle Financeiro</h2>
          <p>Acesso interno</p>
        </div>

        {error && <div className="badge b-neg" style={{ whiteSpace: "normal", textAlign: "center", marginBottom: "16px", padding: "8px 12px", width: "100%", justifyContent: "center" }}>{error}</div>}

        <div className="field" style={{ marginBottom: "16px" }}>
          <label htmlFor="email" style={{ color: "#1A2E44", fontWeight: 600 }}>E-mail</label>
          <div className="input-icon-wrap">
            <IconMail />
            <input 
              type="email" 
              id="email" 
              className="input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Digite seu e-mail"
              required 
            />
          </div>
        </div>

        <div className="field" style={{ marginBottom: "16px" }}>
          <label htmlFor="password" style={{ color: "#1A2E44", fontWeight: 600 }}>Senha</label>
          <div className="input-icon-wrap">
            <IconLock />
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              className="input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Digite sua senha"
              required 
            />
            <button 
              type="button" 
              className="btn-eye" 
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        <div className="login-options">
          <label>
            <input type="checkbox" />
            Lembrar acesso
          </label>
          <a href="#">Esqueci minha senha</a>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: "12px", fontSize: "15px", borderRadius: "8px" }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
