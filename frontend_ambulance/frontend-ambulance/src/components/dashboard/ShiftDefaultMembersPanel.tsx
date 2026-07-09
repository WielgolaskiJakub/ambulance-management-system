import { useEffect, useState } from "react";
import {
    extendShiftDefaultMemberOpenEnded,
    finishShiftDefaultMember,
    getShiftDefaultMembersByShiftId,
} from "../../api/shiftDefaultMemberApi";
import type { ShiftDefaultMemberResponse } from "../../types/shiftDefaultMember";
import "./ShiftDefaultMemebrsPanel.css"
import { routeMemberRoleLabels } from "../../utils/routeMemberLabels";
import { formatTime } from "../../utils/dateTimeFormat";

type Props = {
    shiftId:number
}

export function ShiftDefaultMembersPanel({shiftId}: Props){
    const [members, setMembers] = useState<ShiftDefaultMemberResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);


    async function loadMembers() {
        try{
            setLoading(true);
            setErrorMessage(null);

            const data = await getShiftDefaultMembersByShiftId(shiftId);
            setMembers(data);
        }catch{
            setErrorMessage("Nie udało się pobrac załogi zmiany.");
        }finally{
            setLoading(false);
        }
    }

    useEffect(() =>{
        loadMembers();
    }, [shiftId]);

    async function handleFinishMember(memberId: number){
        try{
            setActionInProgressId(memberId);

            const updatedMember = await finishShiftDefaultMember(memberId);

            setMembers((currentMembers) =>
            currentMembers.map((member) =>
            member.id === updatedMember.id ? updatedMember : member
        )
    );
        }catch{
            setErrorMessage("Nie udało się zakończyć udziału członka załogi.");
        }finally{
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

    if(loading){
        return <p>Ładowanie załogi zmiany...</p>
    }

   return (
   <section className="shift-crew-overview">
    <header className="shift-crew-overview__header">
        <h2>Obsada zmiany</h2>
        <p>Kierowca i domyślna załoga przypisana do aktywnej zmiany.</p>
    </header>

    <div className="shift-crew-overview__grid">
        <div className="shift-crew-column">
            <h3>Załoga</h3>

            {members.length === 0 ? (
                <p className="shift-crew-empty">Brak członków załogi.</p>
            ) : (
                members.map((member) => (
                    <article key={member.id} className="shift-person-card">
                        <div>
                            <strong>{member.firstName} {member.lastName}</strong>
                            <span>Sanitariusz</span>
                            <small>{formatTime(member.startTime)}–{formatTime(member.endTime)}</small>
                        </div>

                        <div className="shift-person-card__actions">
                            {!member.endTime && null}

                            {member.endTime && (
                                <button type="button" onClick={() => handleExtendOpenEnded(member.id)}>
                                    Przedłuż
                                </button>
                            )}

                            <button type="button" onClick={() => handleFinishMember(member.id)}>
                                Zakończ
                            </button>
                        </div>
                    </article>
                ))
            )}
        </div>

        <div className="shift-crew-column shift-crew-column--driver">
            <h3>Kierowca</h3>

            <article className="shift-person-card shift-person-card--driver">
                <div>
                    <strong>Jan Kierowca</strong>
                    <span>Kierowca</span>
                    <small>Aktywny</small>
                </div>

                <button className="shift-person-card__danger" type="button">
                    Zakończ zmianę
                </button>
            </article>
        </div>
    </div>
</section>
   );
}