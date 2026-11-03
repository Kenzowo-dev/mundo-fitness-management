import { createRequire } from 'node:module';
import { resolve } from 'node:path';

// Carga pg desde las dependencias del paquete shared.
const require = createRequire(resolve(process.cwd(), 'shared/package.json'));
const { Client } = require('pg');

const PREFIX = 'TEST-PAGINATION-';

const DB = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'gym_db',
  user: process.env.PGUSER || 'gym_user',
  password: process.env.PGPASSWORD || 'gym_password',
};

const mode = process.argv[2];

if (!['--apply', '--cleanup'].includes(mode)) {
  console.log('Uso:');
  console.log('  node scripts/seed-pagination-test.mjs --apply');
  console.log('  node scripts/seed-pagination-test.mjs --cleanup');
  process.exit(1);
}

if (!['127.0.0.1', 'localhost', '::1'].includes(DB.host)) {
  throw new Error('Por seguridad, este script solo permite PostgreSQL local.');
}

const db = new Client(DB);

function dateAgo(days) {
  return `CURRENT_DATE - ${days}`;
}


async function cleanup() {
  const marker = `${PREFIX}%`;

  // Eliminar primero las solicitudes vinculadas a clientes de prueba
  // o a planes de prueba.
  await db.query(
    `DELETE FROM membership_renewal_requests
     WHERE client_id IN (
       SELECT id FROM clients WHERE dni LIKE $1
     )
     OR plan_id IN (
       SELECT id FROM membership_plans WHERE name LIKE $1
     )`,
    [marker],
  );

  await db.query(
    `DELETE FROM payments
     WHERE client_id IN (
       SELECT id FROM clients WHERE dni LIKE $1
     )`,
    [marker],
  );

  await db.query(
    `DELETE FROM invoices
     WHERE client_id IN (
       SELECT id FROM clients WHERE dni LIKE $1
     )`,
    [marker],
  );

  await db.query(
    `DELETE FROM client_memberships
     WHERE client_id IN (
       SELECT id FROM clients WHERE dni LIKE $1
     )`,
    [marker],
  );

  await db.query(
    'DELETE FROM clients WHERE dni LIKE $1',
    [marker],
  );

  await db.query(
    'DELETE FROM membership_plans WHERE name LIKE $1',
    [marker],
  );
}


async function seed() {
  const planIds = [];
  const clientIds = [];
  const membershipIds = [];

  console.log('Creando 25 planes...');

  for (let i = 1; i <= 25; i++) {
    const result = await db.query(
      `INSERT INTO membership_plans
        (name, description, duration_days, price, currency,
         features, is_active, sort_order)
       VALUES ($1, $2, $3, $4, 'PEN', $5::jsonb, true, $6)
       RETURNING id`,
      [
        `${PREFIX}Plan-${String(i).padStart(3, '0')}`,
        'Plan generado exclusivamente para pruebas de paginación.',
        [30, 60, 90][i % 3],
        50 + i * 5,
        JSON.stringify(['Acceso al gimnasio']),
        i,
      ],
    );

    planIds.push(result.rows[0].id);
  }

  console.log('Creando 65 clientes...');

  for (let i = 1; i <= 65; i++) {
    const code = String(i).padStart(3, '0');

    const result = await db.query(
      `INSERT INTO clients
        (dni, first_name, last_name, email, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        `${PREFIX}${code}`,
        'Cliente',
        `Prueba ${code}`,
        `${PREFIX.toLowerCase()}${code}@example.test`,
        `900000${String(i).padStart(3, '0')}`,
        'Registro de prueba de paginación.',
      ],
    );

    clientIds.push(result.rows[0].id);
  }

  console.log('Creando 65 membresías...');

  for (let i = 0; i < 65; i++) {
    const planId = planIds[i % planIds.length];
    const duration = [30, 60, 90][(i % 25) % 3];

    const result = await db.query(
      `INSERT INTO client_memberships
        (client_id, plan_id, start_date, end_date)
       VALUES (
         $1, $2,
         CURRENT_DATE - $3::int,
         CURRENT_DATE + $4::int
       )
       RETURNING id`,
      [
        clientIds[i],
        planId,
        i % 20,
        duration,
      ],
    );

    membershipIds.push(result.rows[0].id);
  }

  console.log('Creando 45 solicitudes de renovación...');

  const statuses = ['pending', 'contacted', 'closed'];

  for (let i = 0; i < 45; i++) {
    await db.query(
      `INSERT INTO membership_renewal_requests
        (client_id, plan_id, status, member_note)
       VALUES ($1, $2, $3, $4)`,
      [
        clientIds[i],
        planIds[i % planIds.length],
        statuses[i % statuses.length],
        'Solicitud generada para probar paginación.',
      ],
    );
  }

  console.log('Creando 60 pagos...');

  for (let i = 0; i < 60; i++) {
    await db.query(
      `INSERT INTO payments
        (client_id, membership_id, amount, currency,
         payment_method, transaction_id, description)
       VALUES ($1, $2, $3, 'PEN', 'cash', $4, $5)`,
      [
        clientIds[i],
        membershipIds[i],
        50 + i * 5,
        `${PREFIX}PAY-${String(i + 1).padStart(3, '0')}`,
        'Pago de prueba de paginación.',
      ],
    );
  }

  console.log('Creando 40 comprobantes...');

  for (let i = 0; i < 40; i++) {
    await db.query(
      `INSERT INTO invoices
        (client_id, membership_id, invoice_number,
         amount, currency, due_date, items, notes)
       VALUES (
         $1, $2, $3, $4, 'PEN',
         CURRENT_DATE + 30,
         $5::jsonb, $6
       )`,
      [
        clientIds[i],
        membershipIds[i],
        `${PREFIX}INV-${String(i + 1).padStart(3, '0')}`,
        50 + i * 5,
        JSON.stringify([
          { description: 'Membresía de prueba', quantity: 1 },
        ]),
        'Comprobante generado para pruebas de paginación.',
      ],
    );
  }
}

async function main() {
  console.log(`Conectando a PostgreSQL local: ${DB.host}:${DB.port}`);

  await db.connect();

  const database = await db.query('SELECT current_database() AS name');

  if (database.rows[0].name !== DB.database) {
    throw new Error('La base de datos conectada no coincide con la esperada.');
  }

  await db.query('BEGIN');

  try {
    // Solo elimina registros identificados por nuestro prefijo.
    await cleanup();

    if (mode === '--apply') {
      await seed();
      console.log('Datos anteriores de prueba reemplazados correctamente.');
    } else {
      console.log('Registros de prueba eliminados.');
    }

    await db.query('COMMIT');
    console.log('Operación completada correctamente.');
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error. Se revirtieron todos los cambios:', error.message);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error('No se pudo ejecutar el script:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });