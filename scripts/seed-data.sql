-- Datos de ejemplo para el ERP de Banquetes
-- Ejecutar después de crear las tablas

-- Insertar usuarios de ejemplo
INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type) VALUES
('admin@banquetes.com', '$2b$10$example_hash', 'Admin', 'Sistema', '+34 600 000 000', 'admin'),
('ana.garcia@email.com', '$2b$10$example_hash', 'Ana', 'García', '+34 666 123 456', 'worker'),
('carlos.lopez@email.com', '$2b$10$example_hash', 'Carlos', 'López', '+34 666 234 567', 'worker'),
('maria.rodriguez@email.com', '$2b$10$example_hash', 'María', 'Rodríguez', '+34 666 345 678', 'worker'),
('jose.martin@email.com', '$2b$10$example_hash', 'José', 'Martín', '+34 666 456 789', 'worker'),
('empresa1@email.com', '$2b$10$example_hash', 'Juan', 'Empresario', '+34 666 567 890', 'employer'),
('empresa2@email.com', '$2b$10$example_hash', 'Laura', 'Eventos', '+34 666 678 901', 'employer');

-- Insertar perfiles de trabajadores
INSERT INTO worker_profiles (user_id, position, hourly_rate, experience_years, skills, rating, total_events, bio) VALUES
(2, 'Mesero', 15.00, 3, ARRAY['Servicio al cliente', 'Protocolo', 'Trabajo en equipo'], 4.8, 45, 'Mesero experimentado con excelente atención al cliente'),
(3, 'Chef', 25.00, 8, ARRAY['Cocina internacional', 'Gestión de cocina', 'Creatividad culinaria'], 4.9, 38, 'Chef especializado en eventos y banquetes'),
(4, 'Coordinador', 20.00, 5, ARRAY['Organización', 'Liderazgo', 'Gestión de eventos'], 4.7, 52, 'Coordinadora de eventos con amplia experiencia'),
(5, 'Bartender', 18.00, 2, ARRAY['Coctelería', 'Atención al cliente', 'Creatividad'], 4.6, 29, 'Bartender creativo especializado en cócteles únicos');

-- Insertar perfiles de empleadores
INSERT INTO employer_profiles (user_id, company_name, company_description, website, address) VALUES
(6, 'Eventos Premium S.L.', 'Empresa especializada en eventos corporativos y bodas de lujo', 'www.eventospremium.com', 'Calle Mayor 123, Madrid'),
(7, 'Celebraciones Laura', 'Organización de eventos familiares y celebraciones especiales', 'www.celebracioneslaura.com', 'Avenida Principal 456, Barcelona');

-- Insertar eventos de ejemplo
INSERT INTO events (employer_id, title, description, event_type, event_date, start_time, end_time, duration_hours, guest_count, location, budget, status) VALUES
(6, 'Boda García-López', 'Celebración de boda en jardín con ceremonia y banquete', 'wedding', '2024-01-15', '18:00', '24:00', 6.0, 120, 'Salón Primavera', 8000.00, 'confirmed'),
(6, 'Evento Corporativo TechCorp', 'Cena de empresa para celebrar fin de año', 'corporate', '2024-01-16', '12:00', '16:00', 4.0, 80, 'Hotel Plaza', 3500.00, 'confirmed'),
(7, 'Quinceañera María', 'Celebración de quinceañera con temática princesa', 'birthday', '2024-01-18', '19:00', '24:00', 5.0, 150, 'Jardín Las Flores', 6000.00, 'confirmed'),
(7, 'Cena de Gala Fundación', 'Evento benéfico de recaudación de fondos', 'corporate', '2024-01-20', '20:00', '24:00', 4.0, 200, 'Centro de Convenciones', 10000.00, 'confirmed');

-- Insertar asignaciones de trabajadores a eventos
INSERT INTO event_assignments (event_id, worker_id, position, hourly_rate, hours_worked, status) VALUES
(1, 2, 'Mesero', 15.00, 6.0, 'completed'),
(1, 3, 'Chef', 25.00, 8.0, 'completed'),
(1, 4, 'Coordinador', 20.00, 8.0, 'completed'),
(2, 2, 'Mesero', 15.00, 4.0, 'completed'),
(2, 5, 'Bartender', 18.00, 4.0, 'completed'),
(3, 2, 'Mesero', 15.00, 5.0, 'assigned'),
(3, 3, 'Chef', 25.00, 6.0, 'assigned'),
(3, 4, 'Coordinador', 20.00, 6.0, 'assigned'),
(4, 2, 'Mesero', 15.00, 4.0, 'assigned'),
(4, 3, 'Chef', 25.00, 5.0, 'assigned'),
(4, 4, 'Coordinador', 20.00, 5.0, 'assigned'),
(4, 5, 'Bartender', 18.00, 4.0, 'assigned');

-- Insertar calificaciones
INSERT INTO ratings (event_id, worker_id, employer_id, rating, review, rating_type) VALUES
(1, 2, 6, 5, 'Excelente servicio, muy profesional y atento', 'employer_to_worker'),
(1, 3, 6, 5, 'La comida estuvo espectacular, superó las expectativas', 'employer_to_worker'),
(1, 4, 6, 5, 'Perfecta coordinación del evento, todo salió perfecto', 'employer_to_worker'),
(2, 2, 6, 4, 'Buen servicio, aunque podría mejorar la rapidez', 'employer_to_worker'),
(2, 5, 6, 5, 'Cócteles increíbles, muy creativo', 'employer_to_worker');

-- Insertar mensajes de ejemplo
INSERT INTO messages (sender_id, receiver_id, event_id, subject, content, is_read) VALUES
(6, 2, 3, 'Confirmación evento Quinceañera', 'Hola Ana, confirmo tu participación en el evento del 18 de enero. Por favor confirma tu disponibilidad.', false),
(2, 6, 3, 'Re: Confirmación evento Quinceañera', 'Hola, confirmo mi disponibilidad para el evento. Estaré allí puntualmente.', true),
(4, 3, 4, 'Coordinación menú evento gala', 'Carlos, necesitamos coordinar el menú para el evento del 20 de enero. ¿Podemos hablar mañana?', false);

-- Insertar pagos
INSERT INTO payments (event_assignment_id, worker_id, employer_id, amount, payment_type, payment_method, status, payment_date) VALUES
(1, 2, 6, 90.00, 'salary', 'bank_transfer', 'completed', '2024-01-16'),
(2, 3, 6, 200.00, 'salary', 'bank_transfer', 'completed', '2024-01-16'),
(3, 4, 6, 160.00, 'salary', 'bank_transfer', 'completed', '2024-01-16'),
(4, 2, 6, 60.00, 'salary', 'bank_transfer', 'completed', '2024-01-17'),
(5, 5, 6, 72.00, 'salary', 'bank_transfer', 'completed', '2024-01-17');

-- Insertar datos del programa de lealtad
INSERT INTO loyalty_program (worker_id, points, tier, total_events, total_earnings) VALUES
(2, 450, 'silver', 45, 2250.00),
(3, 380, 'silver', 38, 4750.00),
(4, 520, 'gold', 52, 5200.00),
(5, 290, 'bronze', 29, 1450.00);

-- Insertar cotizaciones de ejemplo
INSERT INTO quotes (employer_id, event_type, guest_count, event_date, duration_hours, location, additional_services, base_price, additional_services_price, total_price, status, valid_until) VALUES
(6, 'wedding', 100, '2024-02-14', 6.0, 'Salón Romántico', '["decoration", "music", "photography"]', 5000.00, 1200.00, 6200.00, 'sent', '2024-01-30'),
(7, 'corporate', 60, '2024-02-20', 3.0, 'Hotel Business', '["music", "transport"]', 2100.00, 450.00, 2550.00, 'draft', '2024-02-05');

-- Insertar configuraciones del sistema
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('default_hourly_rate', '15.00', 'Tarifa por hora por defecto para nuevos trabajadores'),
('loyalty_points_per_event', '10', 'Puntos de lealtad otorgados por evento completado'),
('quote_validity_days', '30', 'Días de validez por defecto para cotizaciones'),
('max_workers_per_event', '20', 'Número máximo de trabajadores por evento'),
('company_name', 'ERP Banquetes', 'Nombre de la empresa'),
('company_email', 'info@erpbanquetes.com', 'Email de contacto de la empresa'),
('company_phone', '+34 900 123 456', 'Teléfono de contacto de la empresa');
