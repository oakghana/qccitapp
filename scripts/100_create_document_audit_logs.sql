-- Create document_audit_logs table to track all document-specific operations
CREATE TABLE IF NOT EXISTS document_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES pdf_uploads(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('upload', 'delete', 'restore', 'confirm', 'view', 'download')),
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    performed_by_name TEXT NOT NULL,
    document_name TEXT NOT NULL,
    reason TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document ON document_audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user ON document_audit_logs(performed_by_name);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_action ON document_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_created_at ON document_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_user_and_action ON document_audit_logs(performed_by, action, created_at DESC);

-- Add comment
COMMENT ON TABLE document_audit_logs IS 'Document-specific audit trail tracking all operations (upload, delete, restore, confirm, view, download)';
COMMENT ON COLUMN document_audit_logs.reason IS 'Optional reason for the action (e.g., deletion reason, rejection reason)';
COMMENT ON COLUMN document_audit_logs.details IS 'Additional JSON details about the action (e.g., file size, location, validation details)';

-- Add deleted_at and deleted_by columns to pdf_uploads if they don't exist
ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE pdf_uploads ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
