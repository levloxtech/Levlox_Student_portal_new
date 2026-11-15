import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, Trash2, Calendar, CheckCircle2, Clock,
  AlertTriangle, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount: '',
    minPlan: 'all',
    expiryDate: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/membership/coupons');
      const data = await res.json();
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.warn('Failed to fetch coupons:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) {
      setErrorMsg('Coupon code and discount amount are required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/membership/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discount: Number(form.discount),
          minPlan: form.minPlan,
          expiryDate: form.expiryDate || null,
          description: form.description.trim() || `₹${form.discount} promotional discount`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save coupon');

      setSuccessMsg(`Coupon '${data.coupon.code}' saved successfully!`);
      setForm({ code: '', discount: '', minPlan: 'all', expiryDate: '', description: '' });
      fetchCoupons();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      const res = await fetch(`/api/membership/coupons/${code}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete coupon');
      fetchCoupons();
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    exp.setHours(23, 59, 59, 999);
    return new Date() > exp;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(168, 85, 247, 0.2)', color: '#C084FC',
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8
          }}>
            <Tag size={14} />
            <span>Discount Engine &bull; Date Validated</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
            Promotional Coupons & Date Validation
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 13.5, lineHeight: 1.5 }}>
            Create and schedule promotional coupon codes for student enrollments. Set exact expiry dates; when a coupon expires, students are automatically prevented from applying it during checkout.
          </p>
        </div>

        <button
          onClick={fetchCoupons}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255, 255, 255, 0.1)', color: '#FFF',
            border: '1px solid rgba(255, 255, 255, 0.2)', padding: '9px 16px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Refresh Coupons
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Create Coupon Form Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '22px 24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="#7C3AED" /> Create or Update Coupon Code
          </h3>

          {errorMsg && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B',
              padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14
            }}>
              ⚠ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
              padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14
            }}>
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Coupon Code *
              </label>
              <input
                type="text"
                placeholder="e.g. LEVLOX400 or ACADEMY1400"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #CBD5E1', fontSize: 13, textTransform: 'uppercase', fontWeight: 700
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Discount Amount (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 400"
                  value={form.discount}
                  onChange={e => setForm({ ...form, discount: e.target.value })}
                  min="1"
                  required
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Eligible Plan *
                </label>
                <select
                  value={form.minPlan}
                  onChange={e => setForm({ ...form, minPlan: e.target.value })}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF'
                  }}
                >
                  <option value="all">All Membership Plans</option>
                  <option value="monthly">Monthly Membership Only</option>
                  <option value="annual">Annual Membership Only</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Expiration Date (Time/Date Validated) *
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                required
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #CBD5E1', fontSize: 13
                }}
              />
              <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                Coupon expires at 23:59:59 on this date. After this date, the coupon will be rejected.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Special promotional discount for webinar participants"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: '1px solid #CBD5E1', fontSize: 13
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                color: '#FFF', border: 'none', padding: '12px 18px', borderRadius: 8,
                fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 6
              }}
            >
              {saving ? 'Saving...' : 'Save & Activate Coupon'}
            </button>
          </form>
        </div>

        {/* Existing Coupons List */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '22px 24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Active & Scheduled Coupons</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', background: '#FAF5FF', padding: '3px 8px', borderRadius: 12 }}>
              {coupons.length} total
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 440 }}>
            {coupons.length === 0 ? (
              <div style={{ padding: '36px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                No coupon codes created yet. Create one on the left.
              </div>
            ) : (
              coupons.map(c => {
                const expired = isExpired(c.expiryDate);
                const expiryText = c.expiryDate
                  ? new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'No expiry (Permanent)';

                return (
                  <div
                    key={c.code}
                    style={{
                      border: expired ? '1px solid #FECACA' : '1px solid #E2E8F0',
                      background: expired ? '#FFF5F5' : '#F8FAFC',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 800, fontSize: 14,
                          color: expired ? '#991B1B' : '#4338CA', background: expired ? '#FEE2E2' : '#EDE9FE',
                          padding: '2px 8px', borderRadius: 4
                        }}>
                          {c.code}
                        </span>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: 13.5 }}>
                          ₹{c.discount} OFF
                        </span>
                        {expired ? (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: 4 }}>
                            EXPIRED
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        Plan: <strong style={{ color: '#334155' }}>{c.minPlan || 'All'}</strong> &bull; Valid Until: <strong style={{ color: expired ? '#DC2626' : '#0F172A' }}>{expiryText}</strong>
                      </div>
                      {c.description && (
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                          {c.description}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteCoupon(c.code)}
                      title="Delete coupon"
                      style={{
                        background: 'none', border: 'none', color: '#EF4444',
                        cursor: 'pointer', padding: 6, borderRadius: 6
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

