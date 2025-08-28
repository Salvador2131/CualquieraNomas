-- Insertar usuarios
INSERT INTO users (id, email, password_hash, full_name, phone, user_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@banquetes.com', '$2b$10$hash1', 'Administrador Sistema', '+1234567890', 'admin', 'active'),
('550e8400-e29b-41d4-a716-446655440001', 'juan.perez@email.com', '$2b$10$hash2', 'Juan Pérez', '+1234567891', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'maria.garcia@email.com', '$2b$10$hash3', 'María García', '+1234567892', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'carlos.lopez@email.com', '$2b$10$hash4', 'Carlos López', '+1234567893', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'ana.martinez@email.com', '$2b$10$hash5', 'Ana Martínez', '+1234567894', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440005', 'luis.rodriguez@email.com', '$2b$10$hash6', 'Luis Rodríguez', '+1234567895', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440006', 'eventos@bodas.com', '$2b$10$hash7', 'Elena Fernández', '+1234567896', 'employer', 'active'),
('550e8400-e29b-41d4-a716-446655440007', 'contacto@techcorp.com', '$2b$10$hash8', 'Roberto Silva', '+1234567897', 'employer', 'premium'),
('550e8400-e29b-41d4-a716-446655440008', 'info@celebraciones.com', '$2b$10$hash9', 'Carmen Ruiz', '+1234567898', 'employer', 'active'),
('550e8400-e29b-41d4-a716-446655440009', 'admin@fundacion.org', '$2b$10$hash10', 'Miguel Torres', '+1234567899', 'employer', 'active'),
('550e8400-e29b-41d4-a716-446655440010', 'eventos@hotel.com', '$2b$10$hash11', 'Patricia Morales', '+1234567800', 'employer', 'premium');

-- Insertar trabajadores
INSERT INTO workers (id, user_id, specialization, experience_years, hourly_rate, availability_status, rating, total_events, loyalty_level, loyalty_points) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Mesero', 3, 15.00, 'available', 4.5, 25, 'silver', 250),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Chef', 8, 35.00, 'available', 4.8, 45, 'gold', 450),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Bartender', 5, 20.00, 'busy', 4.3, 30, 'silver', 300),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Decorador', 6, 25.00, 'available', 4.7, 35, 'gold', 350),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Coordinador', 10, 40.00, 'available', 4.9, 60, 'platinum', 600);

-- Insertar empleadores
INSERT INTO employers (id, user_id, company_name, company_type, website, total_events, total_spent, rating, status) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 'Bodas Elegantes', 'Organizador de Bodas', 'www.bodas-elegantes.com', 15, 45000.00, 4.6, 'premium'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', 'TechCorp Solutions', 'Empresa Tecnológica', 'www.techcorp.com', 8, 25000.00, 4.4, 'premium'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 'Celebraciones Mágicas', 'Eventos Sociales', 'www.celebraciones-magicas.com', 12, 35000.00, 4.7, 'active'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440009', 'Fundación Esperanza', 'Organización Sin Fines de Lucro', 'www.fundacion-esperanza.org', 6, 18000.00, 4.8, 'active'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440010', 'Hotel Gran Plaza', 'Hotelería', 'www.hotelgranplaza.com', 20, 60000.00, 4.5, 'premium');

-- Insertar eventos
INSERT INTO events (id, employer_id, title, description, event_type, event_date, start_time, end_time, venue, guest_count, budget, status, special_requirements) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Boda García-López', 'Ceremonia y recepción de boda elegante', 'Boda', '2024-02-15', '18:00', '23:00', 'Jardín Botánico Central', 120, 8500.00, 'confirmed', 'Menú vegetariano disponible'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Evento Corporativo TechCorp', 'Lanzamiento de producto anual', 'Corporativo', '2024-02-20', '12:00', '17:00', 'Centro de Convenciones', 80, 6000.00, 'pending', 'Equipo audiovisual completo'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'Quinceañera María', 'Celebración de quinceañera temática', 'Quinceañera', '2024-02-25', '19:00', '02:00', 'Salón de Fiestas Aurora', 150, 7200.00, 'confirmed', 'Decoración temática princesa'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 'Cena de Gala Fundación', 'Evento benéfico anual', 'Gala', '2024-03-05', '20:00', '24:00', 'Hotel Gran Palacio', 200, 12000.00, 'confirmed', 'Subasta benéfica incluida'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 'Conferencia Anual Hotel', 'Conferencia de turismo y hotelería', 'Conferencia', '2024-03-10', '09:00', '18:00', 'Auditorio Principal', 300, 15000.00, 'in_progress', 'Traducción simultánea requerida');

-- Insertar asignaciones de trabajadores a eventos
INSERT INTO event_workers (id, event_id, worker_id, role, hours_worked, hourly_rate, total_payment, status) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Mesero Principal', 5.0, 15.00, 75.00, 'completed'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Chef Ejecutivo', 8.0, 35.00, 280.00, 'completed'),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Bartender', 5.0, 20.00, 100.00, 'assigned'),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'Decorador', 6.0, 25.00, 150.00, 'confirmed'),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', 'Coordinador General', 4.0, 40.00, 160.00, 'confirmed');

-- Insertar calificaciones
INSERT INTO ratings (id, event_id, rater_id, rated_id, rating, comment, rating_type) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 5, 'Excelente servicio, muy profesional', 'employer_to_worker'),
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', 4, 'Evento bien organizado, pago puntual', 'worker_to_employer'),
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 5, 'Chef excepcional, comida deliciosa', 'employer_to_worker'),
('aa0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 5, 'Decoración perfecta, superó expectativas', 'employer_to_worker');

-- Insertar mensajes
INSERT INTO messages (id, sender_id, receiver_id, event_id, subject, content, is_read) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Confirmación de evento', 'Hola Juan, confirmo tu participación en la boda del 15 de febrero. Por favor llega 30 minutos antes.', true),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440001', 'Re: Confirmación de evento', 'Perfecto, estaré ahí puntualmente. ¿Hay algún código de vestimenta específico?', true),
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', 'Detalles del evento corporativo', 'Carlos, necesitamos preparar cócteles especiales para el evento. ¿Puedes enviarme tu propuesta de menú de bebidas?', false);

-- Insertar pagos
INSERT INTO payments (id, event_worker_id, amount, payment_date, payment_method, status, transaction_id, notes) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 75.00, '2024-02-16', 'Transferencia Bancaria', 'completed', 'TXN001', 'Pago por servicio de mesero en boda García-López'),
('cc0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', 280.00, '2024-02-16', 'Transferencia Bancaria', 'completed', 'TXN002', 'Pago por servicio de chef en boda García-López'),
('cc0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', 100.00, '2024-02-21', 'Efectivo', 'pending', NULL, 'Pago pendiente por servicio de bartender');
