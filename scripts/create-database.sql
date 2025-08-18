-- Crear base de datos para ERP de Banquetes
-- Ejecutar este script para crear todas las tablas necesarias

-- Tabla de usuarios (trabajadores y empleadores)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('worker', 'employer', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de perfiles de trabajadores
CREATE TABLE worker_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2),
    experience_years INTEGER DEFAULT 0,
    skills TEXT[],
    availability JSONB, -- Horarios disponibles
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_events INTEGER DEFAULT 0,
    bio TEXT,
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de perfiles de empleadores
CREATE TABLE employer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    company_description TEXT,
    website VARCHAR(300),
    address TEXT,
    tax_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de eventos
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4,2),
    guest_count INTEGER NOT NULL,
    location VARCHAR(500) NOT NULL,
    address TEXT,
    budget DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    special_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de asignaciones de trabajadores a eventos
CREATE TABLE event_assignments (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, worker_id)
);

-- Tabla de calificaciones y reseñas
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    worker_id INTEGER REFERENCES users(id),
    employer_id INTEGER REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    rating_type VARCHAR(20) NOT NULL CHECK (rating_type IN ('worker_to_employer', 'employer_to_worker')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id), -- Opcional, para mensajes relacionados con eventos
    subject VARCHAR(200),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'event_related', 'system')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos y salarios
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    event_assignment_id INTEGER REFERENCES event_assignments(id),
    worker_id INTEGER REFERENCES users(id),
    employer_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('salary', 'bonus', 'deduction')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('bank_transfer', 'cash', 'check', 'digital_wallet')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'completed', 'failed')),
    payment_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de programa de lealtad
CREATE TABLE loyalty_program (
    id SERIAL PRIMARY KEY,
    worker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_events INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    benefits_earned TEXT[],
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cotizaciones
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    employer_id INTEGER REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    guest_count INTEGER NOT NULL,
    event_date DATE,
    duration_hours DECIMAL(4,2),
    location VARCHAR(500),
    additional_services JSONB, -- Servicios adicionales seleccionados
    base_price DECIMAL(12,2) NOT NULL,
    additional_services_price DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración del sistema
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_employer ON events(employer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_assignments_event ON event_assignments(event_id);
CREATE INDEX idx_assignments_worker ON event_assignments(worker_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_ratings_worker ON ratings(worker_id);
CREATE INDEX idx_payments_worker ON payments(worker_id);

-- Triggers para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worker_profiles_updated_at BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employer_profiles_updated_at BEFORE UPDATE ON employer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_assignments_updated_at BEFORE UPDATE ON event_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_program_updated_at BEFORE UPDATE ON loyalty_program FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
