import { CircleChevronDown, Users } from "lucide-react";

import type { ExternalRouteMemberSource } from "../../api/routeMemberApi";
import type { CrewMemberOptionResponse } from "../../api/crewMemberApi";
import type { RouteResponse } from "../../types/route";
import type {
    RouteMemberResponse,
    RouteMemberRole,
} from "../../types/routeMember";
import {
    routeMemberRoleLabels,
    routeMemberSourceLabels,
} from "../../utils/routeMemberLabels";

export type AddRouteMemberMode = "SYSTEM_USER" | "EXTERNAL";

export type AddRouteMemberFormState = {
    mode: AddRouteMemberMode;
    userId: string;
    memberName: string;
    memberRole: RouteMemberRole;
    memberSource: ExternalRouteMemberSource;
};

export const initialAddRouteMemberForm: AddRouteMemberFormState = {
    mode: "SYSTEM_USER",
    userId: "",
    memberName: "",
    memberRole: "SANITARY_WORKER",
    memberSource: "SOR_STAFF",
};

const externalRouteMemberSources: ExternalRouteMemberSource[] = [
    "SOR_STAFF",
    "HOSPITAL_STAFF",
    "OTHER",
];

const manualRouteMemberRoles: RouteMemberRole[] = [
    "SANITARY_WORKER",
    "PARAMEDIC",
    "NURSE",
    "DOCTOR",
    "OTHER",
];

export function isAnonymousMedicalSource(
    source: ExternalRouteMemberSource
): source is "NPL" | "POZ" {
    return source === "NPL" || source === "POZ";
}

function getAutomaticMedicalMemberSource(
    route: RouteResponse
): "NPL" | "POZ" | null {
    const orderSources = route.transportOrders.map((order) => order.source);

    if (orderSources.includes("NIGHT_MEDICAL_ASSISTANCE")) {
        return "NPL";
    }

    if (orderSources.includes("PRIMARY_HEALTH_CARE")) {
        return "POZ";
    }

    return null;
}

function getAvailableExternalRouteMemberSources(
    route: RouteResponse
): ExternalRouteMemberSource[] {
    const orderSources = new Set(
        route.transportOrders.map((order) => order.source)
    );

    return externalRouteMemberSources.filter((source) => {
        if (source === "NPL") {
            return orderSources.has("NIGHT_MEDICAL_ASSISTANCE");
        }

        if (source === "POZ") {
            return orderSources.has("PRIMARY_HEALTH_CARE");
        }

        return true;
    });
}

type RouteCrewSectionProps = {
    route: RouteResponse;
    routeMembers: RouteMemberResponse[];
    candidates: CrewMemberOptionResponse[];
    form: AddRouteMemberFormState;
    isExpanded: boolean;
    isAddFormExpanded: boolean;
    isAdding: boolean;
    onToggle: () => void;
    onToggleAddForm: () => void;
    onFormChange: (partialForm: Partial<AddRouteMemberFormState>) => void;
    onAddMember: () => void;
    onDeleteMember: (memberId: number) => void;
};

export function RouteCrewSection({
    route,
    routeMembers,
    candidates,
    form,
    isExpanded,
    isAddFormExpanded,
    isAdding,
    onToggle,
    onToggleAddForm,
    onFormChange,
    onAddMember,
    onDeleteMember,
}: RouteCrewSectionProps) {
    return (
        <section className="my-route-card__collapsible-section">
            <button
                type="button"
                className="my-route-card__collapsible-toggle"
                aria-expanded={isExpanded}
                onClick={onToggle}
            >
                <span className="my-route-card__collapsible-label">
                    <span className="my-route-card__collapsible-title">
                        <Users size={18} aria-hidden="true" />
                        <strong>Załoga trasy</strong>
                    </span>
                    <small>{routeMembers.length} os.</small>
                </span>

                <CircleChevronDown
                    size={22}
                    aria-hidden="true"
                    className={
                        isExpanded
                            ? "my-route-card__collapsible-chevron my-route-card__collapsible-chevron--expanded"
                            : "my-route-card__collapsible-chevron"
                    }
                />
            </button>

            {isExpanded && (
                <div className="my-route-card__collapsible-content my-route-card__collapsible-content--crew">
                    <div className="my-route-card__crew-list">
                        {routeMembers.map((member) => {
                            const canDelete = !(
                                member.role === "DRIVER" && member.source === "SHIFT_TEAM"
                            );

                            return (
                                <div className="my-route-card__crew-item" key={member.id}>
                                    <strong className="my-route-card__crew-role">
                                        {routeMemberRoleLabels[member.role]}
                                    </strong>

                                    <span className="my-route-card__crew-name">
                                        {member.fullName}
                                    </span>

                                    <div className="my-route-card__crew-actions">
                                        <small className="my-route-card__crew-source">
                                            {routeMemberSourceLabels[member.source]}
                                        </small>

                                        {canDelete && (
                                            <button
                                                type="button"
                                                className="my-route-card__crew-delete-button"
                                                onClick={() => onDeleteMember(member.id)}
                                            >
                                                Usuń
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="my-route-card__crew-management">
                        <button
                            type="button"
                            className="my-route-card__toggle-add-member-button"
                            onClick={onToggleAddForm}
                        >
                            {isAddFormExpanded
                                ? "Ukryj dodawanie członka"
                                : "+ Dodaj członka trasy"}
                        </button>

                        {isAddFormExpanded && (
                            <div className="my-route-card__add-member-panel">
                                <div className="my-route-card__add-member-mode">
                                    <button
                                        className={
                                            form.mode === "SYSTEM_USER"
                                                ? "my-route-card__mode-button my-route-card__mode-button--active"
                                                : "my-route-card__mode-button"
                                        }
                                        type="button"
                                        onClick={() =>
                                            onFormChange({
                                                mode: "SYSTEM_USER",
                                                memberName: "",
                                                memberRole: "SANITARY_WORKER",
                                            })
                                        }
                                    >
                                        Transport
                                    </button>

                                    <button
                                        className={
                                            form.mode === "EXTERNAL"
                                                ? "my-route-card__mode-button my-route-card__mode-button--active"
                                                : "my-route-card__mode-button"
                                        }
                                        type="button"
                                        onClick={() => {
                                            const automaticSource =
                                                getAutomaticMedicalMemberSource(route);

                                            onFormChange({
                                                mode: "EXTERNAL",
                                                userId: "",
                                                memberName: "",
                                                memberRole: automaticSource ? "DOCTOR" : "PARAMEDIC",
                                                memberSource: automaticSource ?? "SOR_STAFF",
                                            });
                                        }}
                                    >
                                        Szpital
                                    </button>
                                </div>

                                <div className="my-route-card__add-member-form">
                                    {form.mode === "SYSTEM_USER" ? (
                                        <select
                                            className="my-route-card__add-member-input"
                                            value={form.userId}
                                            onChange={(event) =>
                                                onFormChange({ userId: event.target.value })
                                            }
                                        >
                                            <option value="">Wybierz użytkownika</option>
                                            {candidates.map((member) => (
                                                <option key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    ) : !isAnonymousMedicalSource(form.memberSource) ? (
                                        <input
                                            className="my-route-card__add-member-input"
                                            placeholder="Imię i nazwisko, np. Andrzej Kowalski"
                                            value={form.memberName}
                                            onChange={(event) =>
                                                onFormChange({ memberName: event.target.value })
                                            }
                                        />
                                    ) : null}

                                    {form.mode === "EXTERNAL" && (
                                        <select
                                            className="my-route-card__add-member-input"
                                            value={form.memberRole}
                                            onChange={(event) =>
                                                onFormChange({
                                                    memberRole: event.target.value as RouteMemberRole,
                                                })
                                            }
                                        >
                                            {(isAnonymousMedicalSource(form.memberSource)
                                                ? (["DOCTOR", "NURSE"] as const)
                                                : manualRouteMemberRoles
                                            ).map((role) => (
                                                <option key={role} value={role}>
                                                    {routeMemberRoleLabels[role]}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {form.mode === "EXTERNAL" &&
                                        isAnonymousMedicalSource(form.memberSource) && (
                                            <span className="my-route-card__automatic-member-source">
                                                {routeMemberSourceLabels[form.memberSource]}
                                            </span>
                                        )}

                                    {form.mode === "EXTERNAL" &&
                                        !isAnonymousMedicalSource(form.memberSource) && (
                                            <select
                                                className="my-route-card__add-member-input"
                                                value={form.memberSource}
                                                onChange={(event) =>
                                                    onFormChange({
                                                        memberSource: event.target
                                                            .value as ExternalRouteMemberSource,
                                                        memberName: "",
                                                        memberRole: "PARAMEDIC",
                                                    })
                                                }
                                            >
                                                {getAvailableExternalRouteMemberSources(route).map(
                                                    (source) => (
                                                        <option key={source} value={source}>
                                                            {routeMemberSourceLabels[source]}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        )}

                                    <button
                                        className="my-route-card__secondary-button"
                                        type="button"
                                        disabled={isAdding}
                                        onClick={onAddMember}
                                    >
                                        {isAdding ? "Dodawanie..." : "Dodaj członka"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}