-- =====================================================
-- CREAR SOLO LAS TABLAS QUE FALTAN
-- =====================================================
-- Basado en tu consulta, ya tienes: users, workers, employers, events, event_workers
-- Este script crea solo las que faltan

-- =====================================================
-- TABLA: worker_salaries (CRÍTICA - FALTA)
-- =====================================================

CREATE TABLE IF NOT EXISTS worker_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    hours_worked NUMERIC(10, 2) DEFAULT 0,
    hourly_rate NUMERIC(10, 2) DEFAULT 0,
    base_salary NUMERIC(10, 2) DEFAULT 0,
    overtime_hours NUMERIC(10, 2) DEFAULT 0,
    overtime_rate NUMERIC(10, 2) DEFAULT 0,
    bonuses NUMERIC(10, 2) DEFAULT 0,
    deductions NUMERIC(10, 2) DEFAULT 0,
    total_salary NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_salary_per_month UNIQUE (worker_id, month, year)
);

-- Índices para worker_salaries
CREATE INDEX IF NOT EXISTS idx_worker_salaries_worker_id ON worker_salaries(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_salaries_month_year ON worker_salaries(month, year);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_worker_salaries_updated_at ON worker_salaries;
CREATE TRIGGER update_worker_salaries_updated_at 
    BEFORE UPDATE ON worker_salaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: preregistrations (CRÍTICA - FALTA)
-- =====================================================

CREATE TABLE IF NOT EXISTS preregistrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    guest_count INTEGER NOT NULL,
    budget NUMERIC(10, 2),
    location TEXT,
    special_requirements TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para preregistrations
CREATE INDEX IF NOT EXISTS idx_preregistrations_status ON preregistrations(status);
CREATE INDEX IF NOT EXISTS idx_preregistrations_event_date ON preregistrations(event_date);
CREATE INDEX IF NOT EXISTS idx_preregistrations_client_email ON preregistrations(client_email);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_preregistrations_updated_at ON preregistrations;
CREATE TRIGGER update_preregistrations_updated_at 
    BEFORE UPDATE ON preregistrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: ratings (PARA EVALUACIONES - FALTA)
-- =====================================================

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    rating_type VARCHAR(20) NOT NULL CHECK (rating_type IN ('worker_to_employer', 'employer_to_worker')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para ratings
CREATE INDEX IF NOT EXISTS idx_ratings_event_id ON ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON ratings(rated_id);

-- =====================================================
-- TABLA: messages (PARA MENSAJERÍA - FALTA)
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================================
-- TABLA: payments (PARA PAGOS - FALTA)
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_worker_id UUID NOT NULL REFERENCES event_workers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_event_worker_id ON payments(event_worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT 
    '✅ Tablas creadas exitosamente' as mensaje,
    COUNT(*) as total_tablas_faltantes_creadas
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('worker_salaries', 'preregistrations', 'ratings', 'messages', 'payments');

