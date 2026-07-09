import { useEffect, useState } from "react";
import {
    extendShiftDefaultMemberOpenEnded,
    finishShiftDefaultMember,
    getShiftDefaultMembersByShiftId,
} from "../../api/shiftDefaultMemberApi";
import type { ShiftDefaultMemberResponse } from "../../types/shiftDefaultMember";
import { routeMemberRoleLabels } from "../../utils/routeMemberLabels";
import { formatTime } from "../../utils/dateTimeFormat";
import "./ShiftDefaultMemebrsPanel.css";

type Props = {
    shiftId: number;
};

export function ShiftDefaultMembersPanel({ shiftId }: Props) {
    const [members, setMembers] = useState<ShiftDefaultMemberResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

    async function loadMembers() {
        try {
            setLoading(true);
            setErrorMessage(null);

            const data = await getShiftDefaultMembersByShiftId(shiftId);
            setMembers(data);
        } catch {
            setErrorMessage("Nie udało się pobrać załogi zmiany.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMembers();
    }, [shiftId]);

    async function handleFinishMember(memberId: number) {
        try {
            setActionInProgressId(memberId);

            const updatedMember = await finishShiftDefaultMember(memberId);

            setMembers((currentMembers) =>
                currentMembers.map((member) =>
                    member.id === updatedMember.id ? updatedMember : member
                )
            );
        } catch {
            setErrorMessage("Nie udało się zakończyć udziału członka załogi.");
        } finally {
            setActionInProgressId(null);
        }
    }

    async function handleExtendOpenEnded(memberId: number) {
        try {
            setActionInProgressId(memberId);

            const updatedMember = await extendShiftDefaultMemberOpenEnded(memberId);

            setMembers((currentMembers) =>
                currentMembers.map((member) =>
                    member.id === updatedMember.id ? updatedMember : member
                )
            );
        } catch {
            setErrorMessage("Nie udało się przedłużyć udziału do odwołania.");
        } finally {
            setActionInProgressId(null);
        }
    }

    if (loading) {
        return (
            <section className="shift-crew-sidebar">
                <p className="shift-crew-sidebar__message">Ładowanie załogi zmiany...</p>
            </section>
        );
    }

    return (
        <section className="shift-crew-sidebar">
            <header className="shift-crew-sidebar__header">
                <p className="shift-crew-sidebar__eyebrow">Załoga</p>
                <h2>Załoga zmiany</h2>
                <p>Domyślna obsada przypisana do aktywnej zmiany.</p>
            </header>

            {errorMessage && (
                <p className="shift-crew-sidebar__error">{errorMessage}</p>
            )}

            {members.length === 0 ? (
                <p className="shift-crew-sidebar__empty">
                    Brak domyślnych członków załogi.
                </p>
            ) : (
                <div className="shift-crew-sidebar__list">
                    {members.map((member) => {
                        const isOpenEnded = member.endTime === null;
                        const isBusy = actionInProgressId === member.id;
                        const endTimeLabel = member.endTime
                            ? formatTime(member.endTime)
                            : "do odwołania";

                        return (
                            <article key={member.id} className="shift-crew-sidebar__member">
                                <div className="shift-crew-sidebar__member-main">
                                    <strong>
                                        {member.firstName} {member.lastName}
                                    </strong>

                                    <span>{routeMemberRoleLabels[member.role]}</span>

                                    <small>
                                        {formatTime(member.startTime)} – {endTimeLabel}
                                    </small>
                                </div>

                                <div className="shift-crew-sidebar__actions">
                                    {!isOpenEnded && (
                                        <button
                                            className="shift-crew-sidebar__button"
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleExtendOpenEnded(member.id)}
                                        >
                                            Przedłuż
                                        </button>
                                    )}

                                    <button
                                        className="shift-crew-sidebar__button shift-crew-sidebar__button--danger"
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleFinishMember(member.id)}
                                    >
                                        Zakończ
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
