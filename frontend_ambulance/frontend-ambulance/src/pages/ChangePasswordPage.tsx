import { useState, type SyntheticEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
    changePasswordByUser
} from "../api/userApi"
import { useToast } from "../toast/UseToast";



export function ChangePasswordPage() {

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmedNewPassword, setConfirmedNewPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);

    const { showToast } = useToast();


    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage("");

        if (newPassword !== confirmedNewPassword) {
            setErrorMessage("Nowe hasła muszą być takie same.");
            return;
        }
        if (oldPassword === newPassword) {
            setErrorMessage("Nowe hasło musi różnić się od obecnego.");
            return;
        }

        setSubmitting(true);

        try {
            await changePasswordByUser({
                oldPassword,
                newPassword
            });
            showToast("Sukces! Hasło poprawnie zmienione.", "success");
            setOldPassword("");
            setNewPassword("");
            setConfirmedNewPassword("");
        } catch {
            showToast("Nie udało się ustawić nowego hasła", "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="change-password-page">
            <section className="change-password-card">
                <header className="change-password-card__header">
                    <h1>Ustaw nowe hasło</h1>
                    <p>
                        W tym miejscu możesz zmienić hasło.
                    </p>
                </header>

                <form
                    className="change-password-form"
                    onSubmit={handleSubmit}
                >

                    <div className="change-password-form__field">
                        <label htmlFor="old-password">
                            Obecne hasło
                        </label>

                        <div className="change-password-form__password-input">
                            <input
                                id="old-password"
                                type={showOldPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={oldPassword}
                                onChange={(event) =>
                                    setOldPassword(event.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="change-password-form__toggle-password"
                                onClick={() => setShowOldPassword((current) => !current)}
                                aria-label={
                                    showOldPassword ? "Ukryj hasło" : "Pokaż hasło"
                                }
                                title={showOldPassword ? "Ukryj hasło" : "Pokaż hasło"}
                            >
                                {showOldPassword ? (
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