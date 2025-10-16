import reconcileUser from '../lib/auth/reconcile';

async function run() {
  // Mock DB storage
  const store: any = { users: [] };

  const mockPrisma = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.supabaseId) return store.users.find((u: any) => u.supabaseId === where.supabaseId) || null;
        if (where.email) return store.users.find((u: any) => u.email === where.email) || null;
        return null;
      },
      update: async ({ where, data }: any) => {
        const user = store.users.find((u: any) => (where.supabaseId ? u.supabaseId === where.supabaseId : u.email === where.email));
        if (!user) throw new Error('not found');
        Object.assign(user, data);
        return user;
      },
      create: async ({ data }: any) => {
        const user = { id: 'id-' + (store.users.length + 1), ...data };
        store.users.push(user);
        return user;
      },
    },
  } as any;

  // Scenario 1: no existing user
  console.log('--- scenario 1: create new');
  let res = await reconcileUser(mockPrisma as any, { id: 'sb-1', email: 'a@x.com' }, 'Alice');
  console.log(res);

  // Scenario 2: existing by email (no supabaseId)
  store.users.push({ id: 'manual-1', email: 'b@x.com', supabaseId: null, name: 'Bob' });
  console.log('--- scenario 2: existing by email, associate supabaseId');
  res = await reconcileUser(mockPrisma as any, { id: 'sb-2', email: 'b@x.com' }, 'Bobby');
  console.log(res);

  // Scenario 3: existing by supabaseId
  store.users.push({ id: 'manual-2', email: 'c@x.com', supabaseId: 'sb-3', name: 'Carol' });
  console.log('--- scenario 3: existing by supabaseId');
  res = await reconcileUser(mockPrisma as any, { id: 'sb-3', email: 'c@x.com' }, 'Carolina');
  console.log(res);

  console.log('final store:', JSON.stringify(store, null, 2));
}

run().catch((e) => {
  console.error('test failed', e);
  process.exit(1);
});
