import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import "./LoginPage.css";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const response = await login({ username, password });
      localStorage.setItem("token", response.token);
      navigate("/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("STATUS:", error.response?.status);
        console.log("DATA:", error.response?.data);
        console.log("URL:", error.config?.baseURL, error.config?.url);
      }

      alert("Nie udało się zalogować");
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-card__header">
          <h1 className="login-card__title">Logowanie</h1>
          <p className="login-card__subtitle">
            System transportu medycznego
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form__field">
            <label className="login-form__label">Nazwa użytkownika</label>
            <input
              className="login-form__input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="login-form__field">
            <label className="login-form__label">Hasło</label>
            <input
              className="login-form__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button className="login-form__button" type="submit">
            Zaloguj
          </button>
        </form>
      </section>
    </main>
  );
}