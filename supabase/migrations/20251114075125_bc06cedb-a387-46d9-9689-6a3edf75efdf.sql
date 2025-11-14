-- Add security_status field to member_audit_metadata
ALTER TABLE member_audit_metadata 
ADD COLUMN IF NOT EXISTS security_status DECIMAL(3,1);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_member_audit_metadata_user_id ON member_audit_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_member_audit_metadata_character_id ON member_audit_metadata(character_id);