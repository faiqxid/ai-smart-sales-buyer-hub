'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

export default function IntegrationsPage() {
    const [configs, setConfigs] = useState<any[]>([]);
    const [geminiKey, setGeminiKey] = useState('');
    const [geminiModel, setGeminiModel] = useState('gemini-flash-latest');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Notif state
    const [users, setUsers] = useState<any[]>([]);
    const [notifForm, setNotifForm] = useState({ user_id: '', title: '', body: '' });

    useEffect(() => {
        fetchConfigs();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data: any = await adminApi.listUsers();
            setUsers(data.items || []);
        } catch (e: any) {
            console.error('Failed to load users:', e);
        }
    };

    const fetchConfigs = async () => {
        try {
            const data: any = await adminApi.listConfigs();
            setConfigs(data.items || []);
            const key = (data.items || []).find((i: any) => i.key === 'gemini_api_key');
            if (key) setGeminiKey(key.value);
            const model = (data.items || []).find((i: any) => i.key === 'gemini_model');
            if (model) setGeminiModel(model.value);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        }
    };

    const handleSaveGemini = async () => {
        setLoading(true);
        try {
            const configsToSave = [
                { key: 'gemini_model', value: geminiModel, description: 'Gemini Model (e.g. gemini-1.5-flash)' }
            ];
            // Only update key if user actually typed a new one (not masked)
            if (geminiKey && !geminiKey.includes('***')) {
                configsToSave.push({ key: 'gemini_api_key', value: geminiKey, description: 'Gemini AI API Key' });
            }
            
            await adminApi.saveConfigs(configsToSave);
            setMessage({ type: 'success', text: 'Konfigurasi Gemini berhasil disimpan' });
            fetchConfigs();
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const data: any = await adminApi.importFirebaseJson(file);
      setMessage({ type: 'success', text: data.message });
      fetchConfigs();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const testFirebase = async () => {
    setLoading(true);
    try {
      const data: any = await adminApi.testFirebase();
      setMessage({ type: data.success ? 'success' : 'error', text: data.message });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const testGemini = async () => {
    setLoading(true);
    try {
      const data: any = await adminApi.testGemini();
      setMessage({ type: data.success ? 'success' : 'error', text: data.message + (data.response ? `: "${data.response}"` : '') });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotif = async () => {
    if (!notifForm.user_id) {
      setMessage({ type: 'error', text: 'Pilih user tujuan dulu' });
      return;
    }
    setLoading(true);
    try {
      const data: any = await adminApi.sendTestNotification({
        user_id: notifForm.user_id,
        title: notifForm.title || 'Test Notifikasi',
        body: notifForm.body || 'Hai, ini test notifikasi dari admin.',
      });
      setMessage({ type: data.success ? 'success' : 'error', text: data.message });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrasi Sistem</h1>
        <p className="text-slate-500 mt-1">Setup kunci API dan credential service account.</p>
      </div>

      {message.text && (
        <div className={`rounded-xl border p-4 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Gemini AI */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold">Google Gemini AI</h2>
          <p className="text-sm text-slate-500">Gunakan untuk briefing, WA generator, dan matcher.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Gemini API Key</label>
            <input 
              type="password" 
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Ganti dengan kunci API baru..."
            />
            {geminiKey.includes('***') && (
              <p className="text-xs text-slate-500 mt-1 italic">Tersimpan dalam format ter-masking demi keamanan.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Model Gemini</label>
            <select
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 bg-white"
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
            >
              <optgroup label="Recommended">
                <option value="gemini-flash-latest">gemini-flash-latest (Auto-switch)</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash (Newest Flash)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
              </optgroup>
              <optgroup label="Preview / Experimental">
                <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="deep-research-preview">deep-research-preview</option>
              </optgroup>
              <optgroup label="Pro Models">
                <option value="gemini-pro-latest">gemini-pro-latest</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
              </optgroup>
            </select>
            <p className="text-xs text-slate-500 mt-1">Kalau kena quota 429, coba simpan model lain lalu test ulang.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              disabled={loading}
              onClick={handleSaveGemini}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              Simpan Konfigurasi
            </button>
            <button 
              disabled={loading}
              onClick={testGemini}
              className="rounded-xl border border-slate-200 px-6 py-2.5 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Test Koneksi
            </button>
          </div>
        </div>
      </div>

      {/* Firebase */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold">Firebase FCM</h2>
          <p className="text-sm text-slate-500">Service account untuk pengiriman Push Notification.</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Import Service Account (.json)</label>
            <p className="text-xs text-slate-500 mb-3">Upload file JSON yang didapat dari Firebase Console &gt; Service Accounts.</p>
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold mb-3">Status Saat Ini</h3>
            <div className="space-y-2">
              {configs.filter(c => c.key.includes('firebase')).map((c: any) => (
                <div key={c.key} className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-600">{c.key}</span>
                  <span className="text-slate-500">{c.value}</span>
                </div>
              ))}
              {configs.filter(c => c.key.includes('firebase')).length === 0 && (
                <p className="text-xs text-slate-400 italic">Belum ada konfigurasi Firebase tersimpan di DB (masih pakai .env).</p>
              )}
            </div>
            <button 
              disabled={loading}
              onClick={testFirebase}
              className="mt-4 rounded-xl border border-slate-200 px-6 py-2.5 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 w-full sm:w-auto"
            >
              Test Inisialisasi Firebase
            </button>
          </div>
        </div>
      </div>

      {/* Test Push Notification */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold">🔔 Test Push Notification</h2>
          <p className="text-sm text-slate-500">Kirim notifikasi test ke device user yang sudah terdaftar.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Pilih User Tujuan</label>
            <select
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 bg-white"
              value={notifForm.user_id}
              onChange={(e) => setNotifForm({ ...notifForm, user_id: e.target.value })}
            >
              <option value="">-- Pilih User --</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role}) - {u.nama_lengkap || u.nama_toko || '-'} {u.fcm_token_count > 0 ? `✅ ${u.fcm_token_count} device` : '⚠️ belum ada device'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Judul Notifikasi</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500"
              value={notifForm.title}
              onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
              placeholder="Test Notifikasi"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Isi Pesan</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 min-h-[80px]"
              value={notifForm.body}
              onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
              placeholder="Hai, ini test notifikasi dari admin."
            />
          </div>
          <button
            disabled={loading}
            onClick={handleSendNotif}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          >
            🚀 Kirim Test Notifikasi
          </button>
        </div>
      </div>
    </div>
  );
}
