/**
 * Script para generar nuevos secrets seguros
 * Uso: node scripts/generar-nuevos-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 GENERANDO NUEVOS SECRETS SEGUROS\n');
console.log('='.repeat(60));
console.log('\n📋 COPIA ESTOS VALORES Y ÚSALOS PARA ACTUALIZAR EN VERCEL:\n');

// Generar JWT_SECRET (64 caracteres hexadecimales)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generar ENCRYPTION_KEY (32 caracteres hexadecimales)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

console.log('\n' + '='.repeat(60));
console.log('\n⚠️  IMPORTANTE:');
console.log('1. Guarda estos valores de forma segura');
console.log('2. Actualiza estos valores en Vercel Dashboard → Settings → Environment Variables');
console.log('3. Actualiza también en tu archivo .env.local local');
console.log('4. NO compartas estos valores públicamente');
console.log('\n📝 Para SUPABASE_SERVICE_ROLE_KEY:');
console.log('   - Ve a Supabase Dashboard → Settings → API');
console.log('   - Click en "Reset" junto a service_role key');
console.log('   - Copia el nuevo key y actualízalo en Vercel');
console.log('\n✅ Después de actualizar todos los secrets, haz un nuevo deployment en Vercel\n');
