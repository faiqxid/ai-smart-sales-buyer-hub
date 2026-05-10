// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL belum diset");
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesi habis, silakan login kembali');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || 'Terjadi kesalahan');
  }
  return data as T;
}

async function requestForm<T>(path: string, formData: URLSearchParams): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Login gagal');
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  register: (body: object) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (username: string, password: string) =>
    requestForm('/api/auth/login', new URLSearchParams({ username, password })),
  me: () => request<{id:string;username:string;role:string;nama_lengkap?:string;nama_toko?:string;nomor_hp:string;alamat?:string}>('/api/auth/me'),
  updateProfile: (body: object) => request('/api/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
};

// ─── Products ────────────────────────────────────────────
export const productApi = {
  list: (aktifSaja = true) => request(`/api/products?aktif_saja=${aktifSaja}`),
  get: (id: string) => request(`/api/products/${id}`),
  create: (body: object) => request('/api/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/products/${id}`, { method: 'DELETE' }),
  updateStock: (id: string, body: object) => request(`/api/products/${id}/stock`, { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Orders ──────────────────────────────────────────────
export const orderApi = {
  create: (body: object) => request('/api/orders', { method: 'POST', body: JSON.stringify(body) }),
  listAll: () => request('/api/orders'),
  myOrders: () => request('/api/orders/my'),
  get: (id: string) => request(`/api/orders/${id}`),
  updateStatus: (id: string, status: string) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addReturn: (id: string, body: object) => request(`/api/orders/${id}/return`, { method: 'POST', body: JSON.stringify(body) }),
  invoiceSummary: (id: string) => request(`/api/orders/${id}/invoice-summary`),
};

// ─── Pre-Orders ──────────────────────────────────────────
export const preOrderApi = {
  create: (body: object) => request('/api/pre-orders', { method: 'POST', body: JSON.stringify(body) }),
  listAll: () => request('/api/pre-orders'),
  myPreOrders: () => request('/api/pre-orders/my'),
  updateStatus: (id: string, status: string) => request(`/api/pre-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── AI ──────────────────────────────────────────────────
export const aiApi = {
  dailyBriefing: () => request('/api/ai/daily-briefing'),
  preorderMatcher: (productId: string) => request(`/api/ai/preorder-matcher/${productId}`, { method: 'POST' }),
  invoiceMessage: (orderId: string) => request(`/api/ai/invoice-message/${orderId}`),
};

// ─── Notifications ───────────────────────────────────────
export const notifApi = {
  registerToken: (token: string, platform = 'web') =>
    request('/api/notifications/register-token', { method: 'POST', body: JSON.stringify({ token, platform }) }),
};

// ─── Users ───────────────────────────────────────────────
export const userApi = {
  listBuyers: () => request('/api/users/buyers'),
};

// ─── Admin ───────────────────────────────────────────────
export const adminApi = {
  health: () => request('/api/admin/health'),
  listConfigs: () => request('/api/admin/configs'),
  saveConfigs: (items: {key:string;value:string;description?:string}[]) => request('/api/admin/configs', { method: 'PUT', body: JSON.stringify(items) }),
  importFirebaseJson: async (file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/api/admin/firebase/import-json`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || data?.message || 'Gagal import Firebase JSON');
    return data;
  },
  testFirebase: () => request('/api/admin/firebase/test', { method: 'POST' }),
  testGemini: () => request('/api/admin/gemini/test', { method: 'POST' }),
  sendTestNotification: (data: { user_id: string; title: string; body: string }) =>
    request('/api/admin/notifications/send-test', { method: 'POST', body: JSON.stringify(data) }),
  listUsers: () => request('/api/admin/users'),
  createUser: (body: object) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id: string, body: object) => request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  resetUserPassword: (id: string, new_password: string) => request(`/api/admin/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
};
