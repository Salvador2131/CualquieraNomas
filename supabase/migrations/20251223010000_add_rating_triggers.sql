-- =====================================================
-- TRIGGERS Y FUNCIONES PARA SISTEMA DE CALIFICACIONES
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN PARA ACTUALIZAR RATING PROMEDIO DEL TRABAJADOR
-- =====================================================

CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    -- Calcular promedio de calificaciones del trabajador
    SELECT COALESCE(AVG(score), 0)::DECIMAL(3,2)
    INTO avg_rating
    FROM event_ratings
    WHERE worker_id = COALESCE(NEW.worker_id, OLD.worker_id);
    
    -- Actualizar rating en tabla workers
    UPDATE workers
    SET rating = avg_rating
    WHERE id = COALESCE(NEW.worker_id, OLD.worker_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. TRIGGER PARA ACTUALIZAR RATING AL CREAR CALIFICACIÓN
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_worker_rating_on_insert ON event_ratings;

CREATE TRIGGER trigger_update_worker_rating_on_insert
    AFTER INSERT ON event_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_rating();

-- =====================================================
-- 3. TRIGGER PARA ACTUALIZAR RATING AL ACTUALIZAR CALIFICACIÓN
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_worker_rating_on_update ON event_ratings;

CREATE TRIGGER trigger_update_worker_rating_on_update
    AFTER UPDATE ON event_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_rating();

-- =====================================================
-- 4. TRIGGER PARA ACTUALIZAR RATING AL ELIMINAR CALIFICACIÓN
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_worker_rating_on_delete ON event_ratings;

CREATE TRIGGER trigger_update_worker_rating_on_delete
    AFTER DELETE ON event_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_worker_rating();

-- =====================================================
-- 5. AGREGAR CAMPO RATING A WORKERS SI NO EXISTE
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workers' AND column_name = 'rating'
    ) THEN
        ALTER TABLE workers ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- 6. FUNCIÓN PARA OBTENER BADGES DE TRABAJADOR
-- =====================================================

CREATE OR REPLACE FUNCTION get_worker_badges(worker_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    badges TEXT[] := ARRAY[]::TEXT[];
    worker_rating DECIMAL(3,2);
    rating_count INTEGER;
    has_verified_certificate BOOLEAN;
    incident_count INTEGER;
BEGIN
    -- Obtener rating y cantidad de calificaciones
    SELECT COALESCE(rating, 0), COUNT(*)
    INTO worker_rating, rating_count
    FROM workers w
    LEFT JOIN event_ratings er ON er.worker_id = w.id
    WHERE w.id = worker_uuid
    GROUP BY w.rating;
    
    -- Verificar certificado verificado
    SELECT EXISTS(
        SELECT 1 FROM worker_certificates
        WHERE worker_id = worker_uuid AND verified = TRUE
    ) INTO has_verified_certificate;
    
    -- Contar incidentes en últimos 90 días
    SELECT COUNT(*)
    INTO incident_count
    FROM incident_reports
    WHERE worker_id = worker_uuid
    AND created_at >= NOW() - INTERVAL '90 days';
    
    -- Badge: Certificado Validado
    IF has_verified_certificate THEN
        badges := array_append(badges, 'certified');
    END IF;
    
    -- Badge: 4.5+ Rating (después de 3 eventos)
    IF worker_rating >= 4.5 AND rating_count >= 3 THEN
        badges := array_append(badges, 'high_rating');
    END IF;
    
    -- Badge: 100% Asistencias (sin incidentes)
    IF incident_count = 0 AND rating_count >= 1 THEN
        badges := array_append(badges, 'perfect_attendance');
    END IF;
    
    RETURN badges;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
