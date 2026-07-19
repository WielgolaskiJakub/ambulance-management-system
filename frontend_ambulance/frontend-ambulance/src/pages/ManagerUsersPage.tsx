import type { UserResponse, UserRole } from "../types/user";
import {
    createUser,
    getAllUsers,
    updateUserByPatchAdmin
} from "../api/userApi";

import axios from "axios";
import {
    useEffect,
    useState,
    type FormEvent
} from "react";
import { getCurrentUserRole } from "../utils/auth";
import "./ManagerUsersPage.css"


type AddNewUserFormState = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    temporaryPassword: string;
    userRole: UserRole;
    canWorkAsSanitary: boolean;
};

type EmployeeEditFormState = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    userRole: UserRole;
    active: boolean;
    canWorkAsSanitary: boolean;
};

const initialFormState: AddNewUserFormState = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    temporaryPassword: "",
    userRole: "DRIVER",
    canWorkAsSanitary: false
};

function hasText(value: string): boolean {
    return value.trim().length > 0;
}


export function ManagerUsersPage() {

    const currentUserRole = getCurrentUserRole();
    const isAdmin = currentUserRole === "ADMIN";


    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [users, setUsers] = useState<UserResponse[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

    const [form, setForm] = useState<AddNewUserFormState>(initialFormState);
    const [adding, setAdding] = useState(false);
    const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

    const [editedUserId, setEditedUserId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<EmployeeEditFormState | null>(null);
    const [updating, setUpdating] = useState(false);
    const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadUsers() {
            try {
                setLoading(true);
                setErrorMessage(null);

                const usersData = await getAllUsers();

                setUsers(usersData);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setErrorMessage(
                        `Błąd pobierania użytkowników: ${error.response?.status ?? "brak odpowiedzi"

                        }`
                    );
                    return;
                }
                setErrorMessage("Nieznany błąd pobierania użytkowników.")
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    },
        []);


    useEffect(() => {
        if (successMessage === null) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 3500);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [successMessage]);

    if (loading) {
        return <p>Ładowanie pracowników...</p>;
    }

    if (errorMessage) {
        return <p>{errorMessage}</p>
    }

    async function handleAddEmployee(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!hasText(form.firstName)) {
            setFormErrorMessage("Podaj imię pracownika.");
            return
        }

        if (!hasText(form.lastName)) {
            setFormErrorMessage("Podaj nazwisko pracownika.");
            return
        }

        if (!hasText(form.username)) {
            setFormErrorMessage("Podaj login pracownika.");
            return;
        }

        if (!hasText(form.temporaryPassword)) {
            setFormErrorMessage("Podaj tymczasowe hasło pracownika.");
            return;
        }
        try {
            setAdding(true);
            setFormErrorMessage(null);
            setSuccessMessage(null);

            const createdEmployee = await
                createUser({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    username: form.username.trim(),
                    email: form.email.trim() || null,
                    temporaryPassword: form.temporaryPassword.trim(),
                    userRole: form.userRole,
                    canWorkAsSanitary: form.canWorkAsSanitary
                });

            setUsers((currentUsers) => [
                ...currentUsers,
                createdEmployee,

            ]);

            setForm(initialFormState);
            setSuccessMessage("Pracownik został pomyślnie dodany.");

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setFormErrorMessage(
                    error.response?.data?.message ??
                    `Nie udało się dodać pracownika. Kod ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return
            }
            setFormErrorMessage("Wystąpił nieznany błąd podczas dodawania pracownika.")
        } finally {
            setAdding(false);
        }
    }

    function openEditForm(user: UserResponse) {
        setEditedUserId(user.id);

        setEditForm({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email ?? "",
            userRole: user.userRole,
            active: user.active,
            canWorkAsSanitary: user.canWorkAsSanitary
        });
        setEditErrorMessage(null);
    }

    function closeEditForm() {
        setEditedUserId(null);
        setEditForm(null);
        setEditErrorMessage(null);
    }

    async function handleUpdateEmployee(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (editedUserId === null || editForm === null) {
            return;
        }

        if (!hasText(editForm.firstName)) {
            setEditErrorMessage("Podaj imię pracownika.");
            return;
        }

        if (!hasText(editForm.lastName)) {
            setEditErrorMessage("Podaj nazwisko pracownika.")
            return;
        }

        if (!hasText(editForm.username)) {
            setEditErrorMessage("Podaj login pracownika.");
            return;
        }
        try {
            setUpdating(true);
            setEditErrorMessage(null);
            setSuccessMessage(null);

            const updatedUser = await updateUserByPatchAdmin(
                editedUserId,
                {
                    firstName: editForm.firstName.trim(),
                    lastName: editForm.lastName.trim(),
                    username: editForm.username.trim(),
                    email: editForm.email.trim(),
                    userRole: editForm.userRole,
                    active: editForm.active,
                    canWorkAsSanitary: editForm.canWorkAsSanitary,
                }
            );

            setUsers((currentUsers) =>
                currentUsers.map((user) =>
                    user.id === updatedUser.id ? updatedUser : user
                )
            );
            setSelectedUser((currentUser) =>
                currentUser?.id === updatedUser.id
                    ? updatedUser
                    : currentUser
            );
            setSuccessMessage("Dane pracownika zostały zapisane.")
            closeEditForm();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setEditErrorMessage(
                    error.response?.data?.message ??
                    `Nie udalo się zaaktualizować pracownika.
                     Kod: ${error.response?.status ?? "brak odpowiedzi"
                    }`
                );
                return;
            }
            setEditErrorMessage("Wystąpił nieznany błąd podczas edycji.");
        } finally {
            setUpdating(false);
        }
    }


    function canEditUser(user: UserResponse): boolean {
        if (isAdmin) {
            return true;
        }

        return (
            user.userRole !== "ADMIN" &&
            user.userRole !== "MANAGER"
        );
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    const filteredUsers = users.filter((user) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const username = user.username.toLowerCase();
        const email = user.email?.toLowerCase() ?? "";

        const matchesSearch =
            fullName.includes(normalizedSearchTerm) ||
            username.includes(normalizedSearchTerm) ||
            email.includes(normalizedSearchTerm);

        const matchesRole =
            roleFilter === "ALL" || user.userRole === roleFilter;

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && user.active) ||
            (statusFilter === "INACTIVE" && !user.active);

        return matchesSearch && matchesRole && matchesStatus;

    });


    return (
        <main className="employees-page">
            <div className="employees-page__header">
                <div>
                    <h1>Pracownicy</h1>
                    <p>Zarządzaj pracownikami i ich uprawnieniami</p>
                </div>
            </div>

            {successMessage && (
                <div
                    className="employees-success-message"
                    role="status"
                    aria-live="polite"
                >
                    {successMessage}
                </div>
            )}

            <section className="employees-card">
                <h2>Dodaj pracownika</h2>

                <form className="employee-form"
                    onSubmit={handleAddEmployee}
                    autoComplete="off">

                    <div className="employee-form__field">
                        <label htmlFor="employee-first-name">Imię</label>
                        <input
                            id="employee-first-name"
                            type="text"
                            value={form.firstName}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    firstName: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="employee-form__field">
                        <label htmlFor="employee-last-name">Nazwisko</label>
                        <input
                            id="employee-last-name"
                            type="text"
                            value={form.lastName}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    lastName: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="employee-form__field">
                        <label htmlFor="employee-username">Login</label>
                        <input
                            id="employee-username"
                            name="newEmployeeUsername"
                            type="text"
                            autoComplete="off"
                            required
                            value={form.username}
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    username: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="employee-form__field">
                        <label htmlFor="employee-email">Email</label>
                        <input
                            id="employee-email"
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    email: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="employee-form__field">
                        <label htmlFor="employee-temporary-password">Hasło tymczasowe</label>
                        <input
                            id="employee-temporary-password"
                            name="newEmployeeTemporaryPassword"
                            type="password"
                            required
                            autoComplete="new-password"
                            value={form.temporaryPassword}
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    temporaryPassword: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="employee-form__field">
                        <label htmlFor="employee-role">Rola</label>
                        <select
                            id="employee-role"
                            value={form.userRole}
                            required
                            onChange={(event) =>
                                setForm((currentForm) => ({
                                    ...currentForm,
                                    userRole: event.target.value as UserRole,
                                    canWorkAsSanitary:
                                        event.target.value === "DRIVER"
                                            ? currentForm.canWorkAsSanitary
                                            : false,
                                }))
                            }
                        >
                            <option value="DRIVER">Kierowca</option>
                            <option value="SANITARY">Sanitariusz</option>
                            <option value="DOCTOR">Lekarz</option>
                            {isAdmin && (
                            <option value="MANAGER">Kierownik</option>
                            )}
                             {isAdmin && (
                            <option value="ADMIN">Administrator</option>
                            )}
                        </select>
                    </div>

                    {form.userRole === "DRIVER" && (
                        <label className="employee-form__checkbox">
                            <input
                                type="checkbox"
                                checked={form.canWorkAsSanitary}
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        canWorkAsSanitary: event.target.checked,
                                    }))
                                }
                            />
                            Może pracować jako sanitariusz
                        </label>
                    )}

                    {formErrorMessage && (
                        <p className="employee-form__error"
                            role="alert">
                            {formErrorMessage}
                        </p>
                    )}
                    <button
                        className="employee-form__submit"
                        type="submit"
                        disabled={adding}>
                        {adding ? "Dodawanie..." : "Dodaj Pracownika"}
                    </button>
                </form>
            </section>

            <section className="employees-card">
                <div className="employees-toolbar">

                    <input
                        type="search"
                        placeholder="Szukaj po imieniu, nazwisku, loginie lub e-mailu"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)} />

                    <select
                        value={roleFilter}
                        onChange={(event) =>
                            setRoleFilter(event.target.value as UserRole | "ALL")
                        }>
                        <option value="ALL">Wszystkie role</option>
                        <option value="DRIVER">Kierowcy</option>
                        <option value="SANITARY">Sanitariusze</option>
                        <option value="MANAGER">Kierownicy</option>
                        <option value="DOCTOR">Lekarze</option>
                        {isAdmin && (
                            <option value="ADMIN">Administratorzy</option>
                        )}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE"

                            )
                        }
                    >
                        <option value="ALL">Wszystkie statusy</option>
                        <option value="ACTIVE"> Aktywni</option>
                        <option value="INACTIVE">Nieaktywni</option>
                    </select>
                </div>
                {filteredUsers.length === 0 ? (
                    <p>Brak pracowników.</p>
                ) : (
                    <div className="employees-table-wrapper">
                        <table className="employees-table">
                            <thead>
                                <tr>
                                    <th>Imię i nazwisko</th>
                                    <th>Login</th>
                                    <th>Rola</th>
                                    <th>E-mail</th>
                                    <th>Status</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td>{user.username}</td>
                                        <td>{user.userRole}</td>
                                        <td>{user.email ?? "Brak"}</td>
                                        <td>{user.active ? "Aktywny" : "Nieaktywny"}</td>
                                        <td>
                                            <button
                                                className="employees-table__details-button"
                                                type="button"
                                                onClick={() => setSelectedUser(user)}>
                                                Szczegóły
                                            </button>

                                            {canEditUser(user) && (
                                                <button
                                                    className="employees-table__edit-button"
                                                    type="button"
                                                    onClick={() => openEditForm(user)}
                                                >
                                                    Edytuj
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selectedUser && (
                <div className="employee-details-overlay">
                    <section
                        className="employee-details"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-details-title"
                    >
                        <div className="employee-details__header">
                            <div>
                                <h2 id="employee-details-title">
                                    Szczegóły pracownika
                                </h2>

                                <p>
                                    {selectedUser.firstName} {selectedUser.lastName}
                                </p>
                            </div>

                            <button
                                className="employee-details__close"
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                aria-label="Zamknij"
                            >
                                ×
                            </button>
                        </div>

                        <div className="employee-details__grid">
                            <div>
                                <span>Imię i nazwisko</span>
                                <strong>
                                    {selectedUser.firstName} {selectedUser.lastName}
                                </strong>
                            </div>

                            <div>
                                <span>Login</span>
                                <strong>{selectedUser.username}</strong>
                            </div>

                            <div>
                                <span>E-mail</span>
                                <strong>{selectedUser.email ?? "Brak"}</strong>
                            </div>

                            <div>
                                <span>Rola</span>
                                <strong>{selectedUser.userRole}</strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong
                                    className={
                                        selectedUser.active
                                            ? "employee-details__status employee-details__status--active"
                                            : "employee-details__status employee-details__status--inactive"
                                    }
                                >
                                    {selectedUser.active ? "Aktywny" : "Nieaktywny"}
                                </strong>
                            </div>

                            <div>
                                <span>Może pracować jako sanitariusz</span>
                                <strong>
                                    {selectedUser.canWorkAsSanitary ? "Tak" : "Nie"}
                                </strong>
                            </div>
                        </div>

                        <div className="employee-details__actions">
                            <button
                                className="employee-details__secondary-button"
                                type="button"
                                onClick={() => setSelectedUser(null)}
                            >
                                Zamknij
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {editForm && editedUserId !== null && (
                <div className="employee-details-overlay">
                    <section className="employee-edit">
                        <div className="employee-details__header">
                            <div>
                                <h2>Edytuj pracownika</h2>
                                <p>Zmień dane i uprawinienia użytkownika</p>
                            </div>

                            <button
                                className="employee-details__close"
                                type="button"
                                onClick={closeEditForm}
                                aria-label="Zamknij"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="employee-edit__form"
                            onSubmit={handleUpdateEmployee}
                        >
                            <div className="employee-form__field">
                                <label htmlFor="edit-first-name">Imię</label>
                                <input
                                    id="edit-first-name"
                                    type="text"
                                    value={editForm.firstName}
                                    onChange={(event) =>
                                        setEditForm((currentForm) =>
                                            currentForm
                                                ? {
                                                    ...currentForm,
                                                    firstName: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="employee-form__field">
                                <label htmlFor="edit-last-name">Nazwisko</label>
                                <input
                                    id="edit-last-name"
                                    type="text"
                                    value={editForm.lastName}
                                    onChange={(event) =>
                                        setEditForm((currentForm) =>
                                            currentForm
                                                ? {
                                                    ...currentForm,
                                                    lastName: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="employee-form__field">
                                <label htmlFor="edit-username">Login</label>
                                <input
                                    id="edit-username"
                                    type="text"
                                    value={editForm.username}
                                    onChange={(event) =>
                                        setEditForm((currentForm) =>
                                            currentForm
                                                ? {
                                                    ...currentForm,
                                                    username: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="employee-form__field">
                                <label htmlFor="edit-email">Email</label>
                                <input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(event) =>
                                        setEditForm((currentForm) =>
                                            currentForm
                                                ? {
                                                    ...currentForm,
                                                    email: event.target.value,
                                                } : null
                                        )
                                    }
                                />
                            </div>

                            <div className="employee-form__field">
                                <label htmlFor="edit-role">Rola</label>
                                <select
                                    id="edit-role"
                                    value={editForm.userRole}
                                    onChange={(event) =>
                                        setEditForm((currentForm) =>
                                            currentForm
                                                ? {
                                                    ...currentForm,
                                                    userRole:
                                                        event.target.value as UserRole,

                                                    canWorkAsSanitary:
                                                        event.target.value === "DRIVER"
                                                            ? currentForm.canWorkAsSanitary
                                                            : false,
                                                } : null
                                        )
                                    }
                                >
                                    <option value="DRIVER">Kierowca</option>
                                    <option value="SANITARY">Sanitariusz</option>
                                    <option value="DOCTOR">Lekarz</option>
                                    {isAdmin && (
                                    <option value="MANAGER">Kierownik</option>
                                    )}
                                      {isAdmin && (
                                    <option value="ADMIN">Administrator</option>
                                    )}
                                </select>
                            </div>

                            <div className="employee-edit__checkboxes">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={editForm.active}
                                        onChange={(event) =>
                                            setEditForm((currentForm) =>
                                                currentForm
                                                    ? {
                                                        ...currentForm,
                                                        active: event.target.checked,
                                                    } : null
                                            )
                                        }
                                    />
                                    Konto aktywne
                                </label>
                                {editForm.userRole === "DRIVER" && (
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={editForm.canWorkAsSanitary}
                                            onChange={(event) =>
                                                setEditForm((currentForm) =>
                                                    currentForm
                                                        ? {
                                                            ...currentForm,
                                                            canWorkAsSanitary: event.target.checked,
                                                        } : null
                                                )
                                            }
                                        />
                                        Może pracować jako sanitariusz
                                    </label>
                                )}
                            </div>

                            {editErrorMessage && (
                                <p className="employee-form__error">
                                    {editErrorMessage}
                                </p>
                            )}

                            <div className="employee-edit__actions">
                                <button
                                    type="button"
                                    className="employee-details__secondary-button"
                                    onClick={closeEditForm}>
                                    Anuluj
                                </button>

                                <button
                                    type="submit"
                                    className="employee-form__submit"
                                    disabled={updating}
                                >
                                    {updating ? "Zapisywanie..." : "Zapisz zmiany"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}