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

type CrewAction = "" | "extend-open-ended" | "finish";

function isActiveShiftDefaultMember(member: ShiftDefaultMemberResponse) {
    if (member.endTime === null) {
        return true;
    }

    return new Date(member.endTime).getTime() > Date.now();
}

export function ShiftDefaultMembersPanel({ shiftId }: Props) {
    const [members, setMembers] = useState<ShiftDefaultMemberResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

useEffect(() => {
    let isCurrent = true;

    async function loadMembers() {
        try {
            const data = await getShiftDefaultMembersByShiftId(shiftId);

            if (!isCurrent) {
                return;
            }

            setMembers(data.filter(isActiveShiftDefaultMember));
            setErrorMessage(null);
        } catch {
            if (isCurrent) {
                setErrorMessage("Nie udało się pobrać załogi zmiany.");
            }
        } finally {
            if (isCurrent) {
                setLoading(false);
            }
        }
    }

    void loadMembers();

    return () => {
        isCurrent = false;
    };
}, [shiftId]);
    

    function replaceMember(updatedMember: ShiftDefaultMemberResponse) {
        setMembers((currentMembers) =>
            currentMembers.map((member) =>
                member.id === updatedMember.id ? updatedMember : member
            )
        );
    }

    async function handleFinishMember(memberId: number) {
        try {
            setActionInProgressId(memberId);
            setErrorMessage(null);

            await finishShiftDefaultMember(memberId);

            setMembers((currentMembers) =>
                currentMembers.filter((member) => member.id !== memberId)
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
            replaceMember(updatedMember);
        } catch {
            setErrorMessage("Nie udało się przedłużyć udziału do odwołania.");
        } finally {
            setActionInProgressId(null);
        }
    }

    async function handleCrewAction(member: ShiftDefaultMemberResponse, action: CrewAction) {
        if (!action) {
            return;
        }

        if (action === "extend-open-ended") {
            await handleExtendOpenEnded(member.id);
            return;
        }

        if (action === "finish") {
            await handleFinishMember(member.id);
        }
    }

    if (loading) {
        return (
            <section className="shift-crew-sidebar">
                <p className="shift-crew-sidebar__message">Ładowanie...</p>
            </section>
        );
    }


    return (
        <section className="shift-crew-sidebar">
            {errorMessage && (
                <p className="shift-crew-sidebar__error">{errorMessage}</p>
            )}

            {members.length === 0 ? (
                <p className="shift-crew-sidebar__empty">Brak załogi</p>
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
                                    <span className="shift-crew-sidebar__role">
                                        {routeMemberRoleLabels[member.role]}
                                    </span>

                                    <strong>
                                        {member.firstName} {member.lastName}
                                    </strong>

                                    <small>
                                        {formatTime(member.startTime)} – {endTimeLabel}
                                    </small>
                                </div>

                                <select
                                    className="shift-crew-sidebar__action-select"
                                    value=""
                                    disabled={isBusy}
                                    onChange={(event) => {
                                        const action = event.target.value as CrewAction;
                                        void handleCrewAction(member, action);
                                    }}
                                    aria-label={`Akcje dla ${member.firstName} ${member.lastName}`}
                                >
                                    <option value="">Akcje</option>
                                    {!isOpenEnded && (
                                        <option value="extend-open-ended">
                                            Przedłuż do odwołania
                                        </option>
                                    )}

                                    <option value="finish">Zakończ udział</option>

                                </select>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
