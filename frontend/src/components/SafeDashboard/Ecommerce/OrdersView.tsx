'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from '../theme';
import CustomSelect from '../CustomSelect';

interface Order {
  id: string;
  customer: string;
  date: string;
  product: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Paid' | 'Shipped' | 'Cancelled';
}

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-8921', customer: 'Ali Mohammadi', date: 'Jun 18, 2026', product: 'Safety Helmet (x5)', amount: 240.00, paymentMethod: 'Credit Card', status: 'Paid' },
  { id: 'ORD-8922', customer: 'Sarah Jenkins', date: 'Jun 17, 2026', product: 'Fire Extinguisher (x2)', amount: 310.00, paymentMethod: 'PayPal', status: 'Shipped' },
  { id: 'ORD-8923', customer: 'John Doe', date: 'Jun 17, 2026', product: 'First Aid Kit (x10)', amount: 480.00, paymentMethod: 'Bank Transfer', status: 'Pending' },
  { id: 'ORD-8924', customer: 'Mark Davis', date: 'Jun 16, 2026', product: 'Safety Harness (x3)', amount: 195.00, paymentMethod: 'Credit Card', status: 'Paid' },
  { id: 'ORD-8925', customer: 'David Smith', date: 'Jun 15, 2026', product: 'Gas Detector (x1)', amount: 550.00, paymentMethod: 'PayPal', status: 'Cancelled' },
];

interface OrdersViewProps {
  isDark: boolean;
}

export default function OrdersView({ isDark }: OrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Paid' | 'Shipped' | 'Cancelled'>('All');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const updateStatus = (id: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setEditingOrderId(null);
  };

  const getStatusStyles = (status: Order['status']) => {
    switch (status) {
      case 'Paid': return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
      case 'Pending': return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Shipped': return { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.25)' };
      case 'Cancelled': return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Orders</h2>
        <p className="text-xs" style={{ color: sec }}>Safety purchase transactions, checkout reviews, and shipments</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border" style={{ background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderColor: border }}>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border" style={{ background: surfaceItem(isDark), borderColor: borderSubtle(isDark), minWidth: 200 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-55">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search order ID, client..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none border-none text-xs w-full"
              style={{ color: pri }}
            />
          </div>

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            isDark={isDark}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Shipped', label: 'Shipped' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
            className="min-w-[130px]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: border, background: bg }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <th className="p-3 font-bold">Order ID</th>
              <th className="p-3 font-bold">Customer</th>
              <th className="p-3 font-bold">Product Details</th>
              <th className="p-3 font-bold">Amount</th>
              <th className="p-3 font-bold">Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const style = getStatusStyles(order.status);
              const isEditing = editingOrderId === order.id;

              return (
                <tr key={order.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} className="hover:bg-primary/5 transition-colors">
                  <td className="p-3 font-bold" style={{ color: pri }}>{order.id}</td>
                  <td className="p-3 font-semibold" style={{ color: pri }}>{order.customer}</td>
                  <td className="p-3" style={{ color: sec }}>{order.product}</td>
                  <td className="p-3 font-bold text-primary" style={{ color: 'var(--primary)' }}>${order.amount.toFixed(2)}</td>

                  <td className="p-3 relative">
                    <button
                      onClick={() => setEditingOrderId(isEditing ? null : order.id)}
                      className="px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 text-[10px] border"
                      style={{ background: style.bg, color: style.text, borderColor: style.border }}
                    >
                      {order.status}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className="absolute z-20 mt-1 right-0 rounded-xl p-1 shadow-lg w-28 border"
                          style={{
                            background: isDark ? 'rgba(30,30,30,0.98)' : '#ffffff',
                            borderColor: borderSubtle(isDark),
                          }}
                        >
                          {(['Pending', 'Paid', 'Shipped', 'Cancelled'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => updateStatus(order.id, st)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-primary/10 cursor-pointer block"
                              style={{ color: getStatusStyles(st).text }}
                            >
                              {st}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
