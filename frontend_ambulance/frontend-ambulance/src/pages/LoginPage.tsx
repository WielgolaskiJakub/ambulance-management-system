import { useState } from "react";
import axios from "axios";
import { login } from "../api/authApi";
import {useNavigate} from "react-router-dom";

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
    <main>
      <h1>Logowanie</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nazwa użytkownika</label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div>
          <label>Hasło</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit">Zaloguj</button>
      </form>
    </main>
  );
}