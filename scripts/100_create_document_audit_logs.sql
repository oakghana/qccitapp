-- Create document_audit_logs table to track all document-specific operations
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('document_uploaded', 'document_deleted', 'document_restored', 'document_confirmed', 'document_viewed')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT,
    user_role TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user ON document_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_timestamp ON document_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user_action_time ON document_audit_logs(user_id, action, timestamp DESC);

-- Add comment
COMMENT ON TABLE document_audit_logs IS 'Document-specific audit trail tracking all operations (upload, delete, restore, confirm, view)';
COMMENT ON COLUMN document_audit_logs.details IS 'Additional JSON details about the action (e.g., file size, location, document type, file name)';

-- Add deleted_at and deleted_by columns to pdf_uploads if they don't exist
ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
