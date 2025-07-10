-- Create import sessions table for tracking Webb database imports
CREATE TABLE IF NOT EXISTS import_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schemas TEXT[] NOT NULL,
    batch_size INTEGER DEFAULT 1000,
    ai_validation BOOLEAN DEFAULT true,
    preserve_ids BOOLEAN DEFAULT true,
    create_backup BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_phase TEXT,
    current_file TEXT,
    records_processed INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    error_messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_import_sessions_status ON import_sessions(status);
CREATE INDEX idx_import_sessions_created_at ON import_sessions(created_at);
CREATE INDEX idx_import_sessions_created_by ON import_sessions(created_by);

-- Enable RLS
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own import sessions" ON import_sessions
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create import sessions" ON import_sessions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own import sessions" ON import_sessions
    FOR UPDATE USING (auth.uid() = created_by);

-- Grant permissions
GRANT ALL ON import_sessions TO authenticated;
GRANT USAGE ON SEQUENCE import_sessions_id_seq TO authenticated; 