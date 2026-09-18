import { api } from '@/api/client';
import { tokenStore } from '@/lib/token';
import { queryClient } from '@/lib/queryClient';

export async function bootstrapAuth() {
  if (tokenStore.get()) return;

  try {
    const { data } = await api.post('/auth/refresh');
    tokenStore.set(data.access_token);

    const userRes = await api.get('/users/me');
    queryClient.setQueryData(['user'], userRes.data);
  } catch {
    tokenStore.clear();
    queryClient.setQueryData(['user'], null);
  }
}
