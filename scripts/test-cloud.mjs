import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(
  `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`,
);
for (const file of (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort())
  await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
const alice = '11111111-1111-4111-8111-111111111111',
  bob = '22222222-2222-4222-8222-222222222222';
await db.query('insert into auth.users values ($1),($2)', [alice, bob]);
const as = async (id) => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? '']);
  await db.exec(`set role ${id ? 'authenticated' : 'anon'}`);
};
const trip = {
  name: 'Private family trip',
  startDate: '',
  travelers: 2,
  dailyBudget: 150,
  stops: [],
};
await as(alice);
for (const table of ['roam_trips', 'roam_shares']) {
  for (const invalid of [{ name: 'Missing stops' }, { stops: null }, { stops: {} }, []]) {
    await assert.rejects(() =>
      db.query(`insert into public.${table}(payload) values($1)`, [invalid]),
    );
  }
}
const row = (
  await db.query('insert into public.roam_trips(payload) values($1) returning *', [trip])
).rows[0];
assert.equal(row.owner_id, alice);
assert.equal(Number(row.revision), 1);
await assert.rejects(() =>
  db.query('insert into public.roam_trips(owner_id,payload) values($1,$2)', [bob, trip]),
);
await as(bob);
assert.equal((await db.query('select * from public.roam_trips')).rows.length, 0);
assert.equal(
  (
    await db.query('update public.roam_trips set payload=$1 where id=$2 returning id', [
      trip,
      row.id,
    ])
  ).rows.length,
  0,
);
assert.equal(
  (await db.query('delete from public.roam_trips where id=$1 returning id', [row.id])).rows.length,
  0,
);
await as(null);
await assert.rejects(() => db.query('select * from public.roam_trips'));
await as(alice);
assert.equal(
  (
    await db.query(
      'update public.roam_trips set payload=$1 where id=$2 and revision=1 returning revision',
      [{ ...trip, name: 'New version' }, row.id],
    )
  ).rows[0].revision,
  2,
);
assert.equal(
  (
    await db.query(
      'update public.roam_trips set payload=$1 where id=$2 and revision=1 returning revision',
      [trip, row.id],
    )
  ).rows.length,
  0,
  'Stale save must not overwrite the newer revision',
);
await assert.rejects(() =>
  db.query('update public.roam_trips set revision=1 where id=$1', [row.id]),
);
await assert.rejects(() =>
  db.query('update public.roam_trips set owner_id=$1 where id=$2', [bob, row.id]),
);
const shared = (
  await db.query('insert into public.roam_shares(payload) values($1) returning *', [trip])
).rows[0];
await as(null);
await assert.rejects(() => db.query('select * from public.roam_shares'));
assert.equal(
  (await db.query('select public.roam_read_shared_trip($1) as value', [shared.token])).rows[0].value
    .trip.name,
  trip.name,
);
assert.equal(
  (await db.query('select public.roam_read_shared_trip($1) as value', [bob])).rows[0].value,
  null,
);
await as(bob);
assert.equal(
  (await db.query('delete from public.roam_shares where token=$1 returning token', [shared.token]))
    .rows.length,
  0,
);
await as(alice);
await db.query('delete from public.roam_shares where token=$1', [shared.token]);
await as(null);
assert.equal(
  (await db.query('select public.roam_read_shared_trip($1) as value', [shared.token])).rows[0]
    .value,
  null,
  'Revoked links must stop working',
);
await db.exec('reset role');
const expired = (
  await db.query(
    "insert into public.roam_shares(owner_id,payload,created_at,expires_at) values($1,$2,now()-interval '8 days',now()-interval '1 day') returning token",
    [alice, trip],
  )
).rows[0].token;
await as(null);
assert.equal(
  (await db.query('select public.roam_read_shared_trip($1) as value', [expired])).rows[0].value,
  null,
  'Expired links must not disclose a snapshot',
);
await db.close();
console.log(
  'Cloud SQL checks passed: ownership, anonymous access, immutable revisions, stale saves, scoped shares, revocation and expiry.',
);
