'use client';

import { useState } from 'react';
import { PayrollSchedule } from '@/lib/types';

interface Props {
  schedule?: PayrollSchedule;
  onSave: (schedule: PayrollSchedule) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export default function ScheduleConfig({ schedule, onSave, onRemove, onClose }: Props) {
  const [startDate, setStartDate] = useState(schedule?.startDate ?? new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<PayrollSchedule['frequency']>(schedule?.frequency ?? 'monthly');
  const [customDays, setCustomDays] = useState(schedule?.customDays ?? 30);

  const handleSave = () => {
    onSave({
      startDate,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      lastProcessedDate: schedule?.lastProcessedDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Payout Schedule</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">&times;</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as PayrollSchedule['frequency'])}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
            >
              <option value="biweekly">Biweekly (every 14 days)</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom interval</option>
            </select>
          </div>

          {frequency === 'custom' && (
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Interval (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={e => setCustomDays(parseInt(e.target.value) || 30)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg transition text-sm"
          >
            Save Schedule
          </button>
          {schedule && onRemove && (
            <button
              onClick={onRemove}
              className="px-4 py-2.5 border border-red-800 text-red-400 hover:bg-red-900/30 rounded-lg transition text-sm"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
