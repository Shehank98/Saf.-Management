'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Owner {
  id: string;
  companyName: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  user: { name: string; email: string };
}

export function BillingTab() {
  const queryClient = useQueryClient();
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [months, setMonths] = useState(1);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: ownersData } = useQuery<{ data: Owner[] }>({
    queryKey: ['admin-owners'],
    queryFn: () => api.get('/admin/owners').then((r) => r.data),
  });

  const { data: commissionsData } = useQuery<{ data: any[] }>({
    queryKey: ['admin-commissions'],
    queryFn: () => api.get('/admin/commissions').then((r) => r.data),
  });

  const owners = ownersData?.data || [];
  const commissions = commissionsData?.data || [];

  const totalCommissions = commissions.reduce((s: number, c: any) => s + parseFloat(c.commissionAmount), 0);
  const pendingCommissions = commissions
    .filter((c: any) => c.status === 'PENDING')
    .reduce((s: number, c: any) => s + parseFloat(c.commissionAmount), 0);

  const activateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = { months };
      if (proofFile) {
        // In production: upload to S3 first, then send URL
        payload.paymentProof = 'proof-uploaded';
      }
      return api.post(`/admin/owners/${selectedOwnerId}/subscription`, payload);
    },
    onSuccess: () => {
      setSuccessMsg(`Subscription activated for ${months} month(s)!`);
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      setSelectedOwnerId('');
      setMonths(1);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Safari Owner Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {successMsg}
            </div>
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
            <Input
              type="number"
              min="1"
              max="24"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>

          {selectedOwnerId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Monthly Fee: {formatCurrency(2500)}</p>
              <p className="text-xl font-bold mt-1">Total: {formatCurrency(2500 * months)}</p>
            </div>
          )}

          <div>
            <Label>Upload Payment Proof (Optional)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              className="mt-1"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            onClick={() => activateMutation.mutate()}
            disabled={!selectedOwnerId || activateMutation.isPending}
            className="w-full"
          >
            {activateMutation.isPending ? 'Processing...' : 'Activate Subscription'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shared Safari Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Total Commissions</span>
              <span className="font-bold text-green-700">{formatCurrency(totalCommissions)}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Pending Collection</span>
              <span className="font-bold text-orange-600">{formatCurrency(pendingCommissions)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Collected</span>
              <span className="font-bold">{formatCurrency(totalCommissions - pendingCommissions)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner list */}
      <Card>
        <CardHeader>
          <CardTitle>All Safari Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {owners.map((owner) => (
              <div key={owner.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{owner.companyName}</p>
                  <p className="text-xs text-gray-500">{owner.user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    owner.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    owner.subscriptionStatus === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {owner.subscriptionStatus}
                  </span>
                  {owner.subscriptionEnd && (
                    <p className="text-xs text-gray-400 mt-1">
                      Until {new Date(owner.subscriptionEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
