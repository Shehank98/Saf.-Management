'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Owner {
  id: string;
  companyName: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  sharedSafariCommission: string;
  depositPercentage: string;
  monthlyFee: string;
  googleReviewLink?: string;
  user: { name: string; email: string };
}

interface Commission {
  id: string;
  totalRevenue: string;
  commissionRate: string;
  commissionAmount: string;
  status: string;
  collectedAt: string | null;
  createdAt: string;
  sharedJeep?: { safariDate: string; safariType: string; owner?: { companyName: string } };
}

export function BillingTab() {
  const queryClient = useQueryClient();
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [months, setMonths] = useState(1);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null);
  const [editSettings, setEditSettings] = useState<Record<string, any>>({});

  const { data: ownersData } = useQuery<{ data: Owner[] }>({
    queryKey: ['admin-owners'],
    queryFn: () => api.get('/admin/owners').then((r) => r.data),
  });

  const { data: commissionsData } = useQuery<{ data: Commission[] }>({
    queryKey: ['admin-commissions-detail'],
    queryFn: () => api.get('/admin/commissions').then((r) => r.data),
  });

  const owners = ownersData?.data || [];
  const commissions = commissionsData?.data || [];

  const totalCommissions = commissions.reduce((s, c) => s + parseFloat(c.commissionAmount), 0);
  const pendingCommissions = commissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + parseFloat(c.commissionAmount), 0);

  const activateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { months };
      if (proofFile) payload.paymentProof = 'proof-uploaded';
      return api.post(`/admin/owners/${selectedOwnerId}/subscription`, payload);
    },
    onSuccess: () => {
      setSuccessMsg(`Subscription activated for ${months} month(s)!`);
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      setSelectedOwnerId(''); setMonths(1);
    },
  });

  const settingsMutation = useMutation({
    mutationFn: ({ ownerId, settings }: { ownerId: string; settings: any }) =>
      api.patch(`/admin/owners/${ownerId}/settings`, settings),
    onSuccess: (_, { ownerId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      setExpandedOwnerId(null);
      setEditSettings((prev) => { const n = { ...prev }; delete n[ownerId]; return n; });
    },
  });

  const collectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/commissions/${id}/collect`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-commissions-detail'] }),
  });

  const startEdit = (owner: Owner) => {
    setExpandedOwnerId(expandedOwnerId === owner.id ? null : owner.id);
    setEditSettings((prev) => ({
      ...prev,
      [owner.id]: {
        sharedSafariCommission: parseFloat(owner.sharedSafariCommission),
        depositPercentage: parseFloat(owner.depositPercentage),
        monthlyFee: parseFloat(owner.monthlyFee),
        googleReviewLink: owner.googleReviewLink || '',
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Subscription activation */}
      <Card>
        <CardHeader><CardTitle>Activate Safari Owner Subscription</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{successMsg}</div>
          )}
          <div>
            <Label>Select Safari Owner</Label>
            <select
              className="mt-1 w-full h-10 rounded-md border px-3 text-sm"
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
            >
              <option value="">Choose owner...</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.companyName} — {o.user.name} ({o.subscriptionStatus})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Subscription Duration (Months)</Label>
            <Input type="number" min="1" max="24" value={months} onChange={(e) => setMonths(parseInt(e.target.value) || 1)} className="mt-1" />
          </div>
          {selectedOwnerId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Monthly Fee: {formatCurrency(2500)}</p>
              <p className="text-xl font-bold mt-1">Total: {formatCurrency(2500 * months)}</p>
            </div>
          )}
          <div>
            <Label>Upload Payment Proof (Optional)</Label>
            <Input type="file" accept="image/*,application/pdf" className="mt-1" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </div>
          <Button onClick={() => activateMutation.mutate()} disabled={!selectedOwnerId || activateMutation.isPending} className="w-full">
            {activateMutation.isPending ? 'Processing...' : 'Activate Subscription'}
          </Button>
        </CardContent>
      </Card>

      {/* Commission totals */}
      <Card>
        <CardHeader><CardTitle>Shared Safari Commissions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalCommissions)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Pending</p>
              <p className="text-xl font-bold text-amber-700">{formatCurrency(pendingCommissions)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Collected</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(totalCommissions - pendingCommissions)}</p>
            </div>
          </div>

          {/* Per-safari commission rows */}
          {commissions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-gray-500 font-medium">Safari</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Owner</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Rate</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Commission</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <p className="font-medium text-xs">{c.sharedJeep?.safariType || '—'}</p>
                        <p className="text-xs text-gray-400">
                          {c.sharedJeep?.safariDate ? new Date(c.sharedJeep.safariDate).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-2 text-xs text-gray-500">{c.sharedJeep?.owner?.companyName || '—'}</td>
                      <td className="py-2 text-right text-xs">{formatCurrency(parseFloat(c.totalRevenue))}</td>
                      <td className="py-2 text-right text-xs">{parseFloat(c.commissionRate)}%</td>
                      <td className="py-2 text-right text-sm font-semibold text-green-700">{formatCurrency(parseFloat(c.commissionAmount))}</td>
                      <td className="py-2 text-center">
                        {c.status === 'COLLECTED' ? (
                          <span className="text-xs text-green-600 font-medium flex items-center justify-center gap-0.5">
                            <Check className="w-3 h-3" />{c.collectedAt ? new Date(c.collectedAt).toLocaleDateString() : 'Collected'}
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => collectMutation.mutate(c.id)}
                            disabled={collectMutation.isPending}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Safari Owners with editable settings */}
      <Card>
        <CardHeader><CardTitle>Safari Owner Settings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {owners.map((owner) => (
              <div key={owner.id} className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{owner.companyName}</p>
                    <p className="text-xs text-gray-500">{owner.user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Commission: {parseFloat(owner.sharedSafariCommission)}% · Deposit: {parseFloat(owner.depositPercentage)}% · Fee: {formatCurrency(parseFloat(owner.monthlyFee))}/mo
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      owner.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      owner.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {owner.subscriptionStatus}
                    </span>
                    {owner.subscriptionEnd && (
                      <p className="text-xs text-gray-400">Until {new Date(owner.subscriptionEnd).toLocaleDateString()}</p>
                    )}
                    <button
                      onClick={() => startEdit(owner)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {expandedOwnerId === owner.id ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {expandedOwnerId === owner.id && editSettings[owner.id] && (
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Commission %</Label>
                        <Input
                          type="number" min="0" max="50" step="0.5"
                          value={editSettings[owner.id].sharedSafariCommission}
                          onChange={(e) => setEditSettings((p) => ({ ...p, [owner.id]: { ...p[owner.id], sharedSafariCommission: parseFloat(e.target.value) } }))}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Deposit %</Label>
                        <Input
                          type="number" min="0" max="100"
                          value={editSettings[owner.id].depositPercentage}
                          onChange={(e) => setEditSettings((p) => ({ ...p, [owner.id]: { ...p[owner.id], depositPercentage: parseFloat(e.target.value) } }))}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Monthly Fee (LKR)</Label>
                        <Input
                          type="number" min="0"
                          value={editSettings[owner.id].monthlyFee}
                          onChange={(e) => setEditSettings((p) => ({ ...p, [owner.id]: { ...p[owner.id], monthlyFee: parseFloat(e.target.value) } }))}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Google Review Link (for private safari reviews)</Label>
                      <Input
                        type="url"
                        placeholder="https://g.page/r/..."
                        value={editSettings[owner.id].googleReviewLink}
                        onChange={(e) => setEditSettings((p) => ({ ...p, [owner.id]: { ...p[owner.id], googleReviewLink: e.target.value } }))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => settingsMutation.mutate({ ownerId: owner.id, settings: editSettings[owner.id] })}
                      disabled={settingsMutation.isPending}
                    >
                      {settingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
