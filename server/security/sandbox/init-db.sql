wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww-- Overlook Security Testing Database Schema

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id VARCHAR(255) UNIQUE NOT NULL,
    exploit_type VARCHAR(100) NOT NULL,
    target_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    vulnerable BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(20),
    findings JSONB,
    duration INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    test_types TEXT[],
    status VARCHAR(50) NOT NULL,
    summary JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vulnerability findings table
CREATE TABLE IF NOT EXISTS vulnerability_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    finding_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    payload TEXT,
    evidence TEXT,
    location TEXT,
    risk_score INTEGER DEFAULT 0,
    false_positive BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security metrics table
CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_url TEXT NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    user_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_exploit_type ON test_results(exploit_type);
CREATE INDEX IF NOT EXISTS idx_test_results_timestamp ON test_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_test_results_vulnerable ON test_results(vulnerable);
CREATE INDEX IF NOT EXISTS idx_vulnerability_findings_severity ON vulnerability_findings(severity);
CREATE INDEX IF NOT EXISTS idx_security_metrics_target_url ON security_metrics(target_url);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO security_metrics (target_url, metric_type, metric_value) VALUES
('http://localhost:3001', 'security_score', 75.5),
('http://localhost:3001', 'vulnerabilities_found', 3),
('http://localhost:3001', 'last_scan_duration', 120);

-- Create views for common queries
CREATE OR REPLACE VIEW vulnerability_summary AS
SELECT
    target_url,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN vulnerable = true THEN 1 END) as vulnerable_tests,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tests,
    AVG(duration) as avg_duration,
    MAX(timestamp) as last_test
FROM test_results
GROUP BY target_url;

CREATE OR REPLACE VIEW severity_breakdown AS
SELECT
    tr.target_url,
    vf.severity,
    COUNT(*) as finding_count
FROM test_results tr
JOIN vulnerability_findings vf ON tr.id = vf.test_result_id
WHERE tr.vulnerable = true
GROUP BY tr.target_url, vf.severity;
