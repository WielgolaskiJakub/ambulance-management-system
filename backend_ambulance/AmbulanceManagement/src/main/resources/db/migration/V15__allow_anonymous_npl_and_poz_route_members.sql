UPDATE route_members
SET source = 'NPL'
WHERE source IN ('NPL_DOCTOR', 'NPL_NURSE');

ALTER TABLE route_members
    DROP CONSTRAINT chk_route_members_user_or_name;

ALTER TABLE route_members
    ADD CONSTRAINT chk_route_members_user_or_name
        CHECK (
            user_id IS NOT NULL
                OR length(trim(coalesce(member_name, ''))) > 0
                OR source IN ('NPL', 'POZ')
            );