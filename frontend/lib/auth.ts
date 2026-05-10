export interface AuthUser {
  user_id: string;
  role: 'sales' | 'buyer' | 'admin';
  nama_toko?: string;
  nama_lengkap?: string;
  nomor_hp?: string;
  token: string;
}

export function saveAuth(data: {
  access_token: string;
  role: string;
  user_id: string;
  nama_toko?: string;
  nama_lengkap?: string;
  nomor_hp?: string;
}) {
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify({
    user_id: data.user_id,
    role: data.role,
    nama_toko: data.nama_toko,
    nama_lengkap: data.nama_lengkap,
    nomor_hp: data.nomor_hp,
  }));
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  if (!raw || !token) return null;
  try {
    return { ...JSON.parse(raw), token };
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getUser();
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

export function requireAuth(role?: 'sales' | 'buyer' | 'admin'): AuthUser {
  const user = getUser();
  if (!user) {
    window.location.href = '/login';
    throw new Error('Belum login');
  }
  if (role && user.role !== role) {
    window.location.href = user.role === 'admin' ? '/admin' : user.role === 'sales' ? '/sales/dashboard' : '/buyer/dashboard';
    throw new Error('Akses ditolak');
  }
  return user;
}
