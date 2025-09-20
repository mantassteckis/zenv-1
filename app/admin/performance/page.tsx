import { Metadata } from 'next';
import PerformanceDashboard from '@/src/components/admin/PerformanceDashboard';

export const metadata: Metadata = {
  title: 'Performance Dashboard - ZenType Admin',
  description: 'Real-time API performance monitoring and analytics',
};

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-6">
      <PerformanceDashboard />
    </div>
  );
}