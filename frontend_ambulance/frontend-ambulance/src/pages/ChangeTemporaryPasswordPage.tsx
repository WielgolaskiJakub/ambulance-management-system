import { useState, type SyntheticEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
    changeTemporaryPassword
} from "../api/userApi"
import "./ChangeTemporaryPasswordPage.css"
import { Eye, EyeOff } from "lucide-react";

type JwtPayload = {
    role: "ADMIN" | "MANAGER" | "DRIVER" | "SANITARY";
};

export function ChangeTemporaryPasswordPage() {

    const [temporaryPassword, setTemporaryPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmedNewPassword, setConfirmedNewPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const mustChangePassword = localStorage.getItem("mustChangePassword") === "true";

    if (!token) {
        return <Navigate to="/login" replace />
    }

    if (!mustChangePassword) {
        return <Navigate to="/" replace />
    }
    const decodedToken = jwtDecode<JwtPayload>(token);

    async function handleSumbit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage("");

        if (newPassword !== confirmedNewPassword) {
            setErrorMessage("Nowe hasła muszą być takie same.");
            return;
        }

        setSubmitting(true);


        try {
            await changeTemporaryPassword({
                temporaryPassword,
                newPassword
            });
            localStorage.removeItem("mustChangePassword");

            if (
                decodedToken.role === "ADMIN" ||
                decodedToken.role === "MANAGER"
            ) {
                navigate("/manager/dashboard", { replace: true });
                return
            }
            navigate("/dashboard", { replace: true });
        } catch {
            setErrorMessage(
                "Nie udało się ustawic nowego hasła. Sprawdź hasło tymczasowe."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="change-password-page">
            <section className="change-password-card">
                <header className="change-password-card__header">
                    <h1>Ustaw własne hasło</h1>
                    <p>
                        To konto ma hasło tymczasowe. Ustaw nowe własne hasło.
                    </p>
                </header>

                <form
                    className="change-password-form"
                    onSubmit={handleSumbit}
                >

                    <div className="change-password-form__field">
                        <label htmlFor="temporary-password">
                            Hasło tymczasowe
                        </label>

                        <div className="change-password-form__password-input">
                            <input
                                id="temporary-password"
                                type={showTemporaryPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={temporaryPassword}
                                onChange={(event) =>
                                    setTemporaryPassword(event.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="change-password-form__toggle-password"
                                onClick={() => setShowTemporaryPassword((current) => !current)}
                                aria-label={
                                    showTemporaryPassword ? "Ukryj hasło" : "Pokaż hasło"
                                }
                                title={showTemporaryPassword ? "Ukryj hasło" : "Pokaż hasło"}
                            >
                                {showTemporaryPassword ? (
                                    <EyeOff size={20} aria-hidden="true" />
                                ) : (
                                    <Eye size={20} aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>


                    <div className="change-password-form__field">
                        <label htmlFor="new-password">Nowe hasło</label>

                        <div className="change-password-form__password-input">
                            <input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="change-password-form__toggle-password"
                                onClick={() => setShowNewPassword((current) => !current)}
                                aria-label={
                                    showNewPassword ? "Ukryj hasło" : "Pokaż hasło"
                                }
                                title={showNewPassword ? "Ukryj hasło" : "Pokaż hasło"}
                            >
                                {showNewPassword ? (
                                    <EyeOff size={20} aria-hidden="true" />
                                ) : (
                                    <Eye size={20} aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="change-password-form__field">
                        <label htmlFor="confirm-new-password">
                            Powtórz nowe hasło
                        </label>

                        <div className="change-password-form__password-input">
                            <input
                                id="confirm-new-password"
                                type={showConfirmedPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={confirmedNewPassword}
                                onChange={(event) =>
                                    setConfirmedNewPassword(event.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="change-password-form__toggle-password"
                                onClick={() => setShowConfirmedPassword((current) => !current)}
                                aria-label={
                                    showConfirmedPassword ? "Ukryj hasło" : "Pokaż hasło"
                                }
                                title={showConfirmedPassword ? "Ukryj hasło" : "Pokaż hasło"}
                            >
                                {showConfirmedPassword ? (
                                    <EyeOff size={20} aria-hidden="true" />
                                ) : (
                                    <Eye size={20} aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>


                    {errorMessage && (
                        <p className="change-password-form__error" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Zapisywanie..." : "Ustaw nowe hasło"}
                    </button>
                </form>
            </section>
        </main>
    )
}