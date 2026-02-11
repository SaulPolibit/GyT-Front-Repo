'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to settings page after 5 seconds
    const timer = setTimeout(() => {
      router.push('/lp-portal/settings');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto py-16 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-center">
              Subscription Successful!
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Your subscription has been activated successfully. You now have full access to all platform features.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/lp-portal/settings')}
              className="w-full"
            >
              View Subscription Details
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/lp-portal/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You will be redirected automatically in a few seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
