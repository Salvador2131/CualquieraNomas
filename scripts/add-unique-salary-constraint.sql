-- =====================================================
-- ADD UNIQUE CONSTRAINT TO worker_salaries
-- =====================================================
-- Este script añade un constraint UNIQUE para prevenir
-- salarios duplicados para el mismo trabajador/mes/año

-- Verificar si la tabla existe y añadir constraint
DO $$
BEGIN
    -- Añadir constraint UNIQUE si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_salary_per_month'
    ) THEN
        ALTER TABLE worker_salaries 
        ADD CONSTRAINT unique_salary_per_month 
        UNIQUE (worker_id, month, year);
        
        RAISE NOTICE 'Constraint unique_salary_per_month añadido exitosamente';
    ELSE
        RAISE NOTICE 'Constraint unique_salary_per_month ya existe';
    END IF;
END $$;

-- Verificar el constraint
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints
WHERE constraint_name = 'unique_salary_per_month'
AND table_name = 'worker_salaries';

