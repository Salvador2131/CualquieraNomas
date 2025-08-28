-- Insertar usuarios de ejemplo
INSERT INTO users (id, email, password_hash, full_name, phone, user_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@banquetes.com', '$2b$10$hash1', 'Administrador Sistema', '+1234567890', 'admin', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'juan.mesero@email.com', '$2b$10$hash2', 'Juan Pérez', '+1234567891', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'maria.chef@email.com', '$2b$10$hash3', 'María González', '+1234567892', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'carlos.bartender@email.com', '$2b$10$hash4', 'Carlos Rodríguez', '+1234567893', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440005', 'ana.decoradora@email.com', '$2b$10$hash5', 'Ana López', '+1234567894', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440006', 'luis.coordinador@email.com', '$2b$10$hash6', 'Luis Martínez', '+1234567895', 'worker', 'active'),
('550e8400-e29b-41d4-a716-446655440007', 'empresa1@email.com', '$2b$10$hash7', 'Roberto García', '+1234567896', 'employer', 'active'),
('550e8400-e29b-41d4-a716-446655440008', 'empresa2@email.com', '$2b$10$hash8', 'Laura Fernández', '+1234567897', 'employer', 'premium'),
('550e8400-e29b-41d4-a716-446655440009', 'empresa3@email.com', '$2b$10$hash9', 'Miguel Torres', '+1234567898', 'employer', 'active'),
('550e8400-e29b-41d4-a716-446655440010', 'empresa4@email.com', '$2b$10$hash10', 'Carmen Ruiz', '+1234567899', 'employer', 'active'),
('550e8400-e29b-41d4-a716-446655440011', 'empresa5@email.com', '$2b$10$hash11', 'David Morales', '+1234567800', 'employer', 'active');

-- Insertar trabajadores
INSERT INTO workers (id, user_id, specialization, hourly_rate, availability_status, rating, total_events, loyalty_level, loyalty_points) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Mesero', 15.00, 'available', 4.5, 25, 'gold', 250),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Chef', 35.00, 'available', 4.8, 30, 'platinum', 400),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Bartender', 20.00, 'busy', 4.3, 20, 'silver', 180),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 'Decoradora', 25.00, 'available', 4.7, 15, 'silver', 150),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'Coordinador', 30.00, 'available', 4.9, 35, 'platinum', 500);

-- Insertar empleadores
INSERT INTO employers (id, user_id, company_name, company_type, website, total_spent, total_events, status) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', 'Bodas Elegantes', 'Organizador de Bodas', 'www.bodaselegantes.com', 25000.00, 8, 'active'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', 'Eventos Corporativos SA', 'Empresa', 'www.eventoscorp.com', 45000.00, 12, 'premium'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009', 'Celebraciones Familiares', 'Particular', NULL, 15000.00, 5, 'active'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 'Hotel Grand Palace', 'Hotel', 'www.grandpalace.com', 60000.00, 15, 'active'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440011', 'Quinceañeras Dreams', 'Organizador de Eventos', 'www.quincedreams.com', 20000.00, 6, 'active');

-- Insertar eventos
INSERT INTO events (id, employer_id, title, description, event_date, start_time, end_time, location, guest_count, budget, status, event_type, special_requirements) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Boda García-López', 'Ceremonia y recepción de boda', '2024-02-15', '18:00', '23:00', 'Jardín Botánico Central', 120, 8000.00, 'confirmed', 'Boda', 'Menú vegetariano disponible'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Evento Corporativo TechCorp', 'Cena anual de la empresa', '2024-02-20', '19:00', '22:00', 'Hotel Marriott Salón Principal', 80, 12000.00, 'in_progress', 'Corporativo', 'Presentación audiovisual'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'Quinceañera María', 'Celebración de 15 años', '2024-02-25', '20:00', '02:00', 'Salón de Fiestas Los Pinos', 150, 6000.00, 'confirmed', 'Quinceañera', 'DJ y pista de baile'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 'Cena de Gala Fundación', 'Evento benéfico anual', '2024-03-01', '19:30', '23:30', 'Centro de Convenciones', 200, 15000.00, 'pending', 'Gala', 'Subasta benéfica'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 'Graduación Universitaria', 'Celebración de graduación', '2024-01-10', '18:00', '22:00', 'Aula Magna Universidad', 100, 5000.00, 'completed', 'Graduación', 'Ceremonia protocolar');

-- Insertar asignaciones de trabajadores a eventos
INSERT INTO event_workers (id, event_id, worker_id, role, hours_worked, hourly_rate, total_payment, status) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Mesero Principal', 5.0, 15.00, 75.00, 'confirmed'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'Chef Principal', 6.0, 35.00, 210.00, 'confirmed'),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'Bartender', 3.0, 20.00, 60.00, 'assigned'),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'Decoradora', 8.0, 25.00, 200.00, 'confirmed'),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'Coordinador General', 4.0, 30.00, 120.00, 'completed');

-- Insertar calificaciones
INSERT INTO ratings (id, event_id, rater_id, rated_id, rating, comment, rating_type) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 5, 'Excelente coordinación del evento', 'employer_to_worker'),
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', 4, 'Cliente muy organizado y claro en sus requerimientos', 'worker_to_employer'),
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 4, 'Buen servicio de mesero', 'employer_to_worker'),
('aa0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 5, 'La comida estuvo espectacular', 'employer_to_worker');

-- Insertar mensajes
INSERT INTO messages (id, sender_id, receiver_id, event_id, subject, content, is_read, message_type) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'Detalles del evento', 'Hola Juan, necesito confirmar los detalles del menú para la boda del sábado.', true, 'event_related'),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440001', 'Re: Detalles del evento', 'Perfecto, el menú está confirmado según lo acordado.', false, 'event_related'),
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NULL, 'Actualización del sistema', 'Se ha actualizado el sistema de calificaciones.', false, 'system');

-- Insertar pagos
INSERT INTO payments (id, event_worker_id, amount, payment_date, payment_method, status, transaction_id, notes) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440005', 120.00, '2024-01-15', 'Transferencia Bancaria', 'completed', 'TXN001', 'Pago por coordinación de graduación'),
('cc0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 75.00, '2024-02-16', 'Efectivo', 'pending', NULL, 'Pago pendiente por servicio de mesero'),
('cc0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', 210.00, '2024-02-16', 'Cheque', 'pending', 'CHK001', 'Pago por servicio de chef');
