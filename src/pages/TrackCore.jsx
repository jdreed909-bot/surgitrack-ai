import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, ExternalLink, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, isAfter, addDays } from "date-fns";

export default function TrackCore() {
  const { data: tissues = [] } = useQuery({
    queryKey: ["tissues"],
    queryFn: () => base44.entities.Tissue.list("-expiration_date", 100),
    refetchInterval: 300000,
  });

  const expiringSoon = tissues.filter(t => {
    const today = new Date();
    const expiryDate = new Date(t.expiration_date);
    const thirtyDaysFromNow = addDays(today, 30);
    return isAfter(thirtyDaysFromNow, expiryDate) && isAfter(expiryDate, today);
  });

  const expired = tissues.filter(t => {
    const today = new Date();
    const expiryDate = new Date(t.expiration_date);
    return isAfter(today, expiryDate);
  });

  const groupedByType = tissues.reduce((acc, tissue) => {
    const type = tissue.tissue_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(tissue);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Droplet className="w-8 h-8 text-blue-600" />
              TrackCore Tissue Inventory
            </h1>
            <p className="text-slate-600 mt-1">Real-time tissue availability and expiration tracking</p>
          </div>
          <Button
            onClick={() => window.open('https://trackcore.com', '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" /> Open TrackCore
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{tissues.length}</div>
            <div className="text-sm text-slate-600">Total Tissues</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-amber-600">{expiringSoon.length}</div>
            <div className="text-sm text-slate-600">Expiring Soon (30 days)</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{expired.length}</div>
            <div className="text-sm text-slate-600">Expired</div>
          </div>
        </div>

        {expired.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900">Expired Tissues</h3>
                <p className="text-sm text-red-700 mt-1">
                  {expired.length} tissue{expired.length !== 1 ? 's' : ''} have expired and must be discarded immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900">Expiring Soon</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {expiringSoon.length} tissue{expiringSoon.length !== 1 ? 's' : ''} will expire within 30 days. Plan usage accordingly.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(groupedByType).map(([type, items]) => (
            <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  {type}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{items.length} unit{items.length !== 1 ? 's' : ''} available</p>
              </div>

              <div className="divide-y">
                {items.map(tissue => {
                  const expiryDate = new Date(tissue.expiration_date);
                  const today = new Date();
                  const isExpired = isAfter(today, expiryDate);
                  const isExpiringSoon = isAfter(addDays(today, 30), expiryDate) && !isExpired;

                  return (
                    <div key={tissue.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {tissue.quantity} {tissue.unit_type || 'unit'}
                            </p>
                            {tissue.storage_location && (
                              <p className="text-xs text-slate-500 mt-1">Location: {tissue.storage_location}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {formatDate(expiryDate, 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isExpired
                              ? 'EXPIRED'
                              : `${Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))} days left`}
                          </p>
                        </div>
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Expired</Badge>
                        )}
                        {isExpiringSoon && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Soon</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {tissues.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No tissue data available. Connect to TrackCore to start syncing.</p>
            <Button
              onClick={() => window.open('https://trackcore.com', '_blank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Visit TrackCore
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}