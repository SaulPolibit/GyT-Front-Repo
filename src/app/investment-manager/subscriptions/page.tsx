'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  RefreshCcw
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

interface UserSubscription {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  role: number;
  lastLogin: string;
  subscriptionDetails?: any;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    canceled: 0,
    trialing: 0,
    pastDue: 0,
    mrr: 0
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [searchTerm, statusFilter, subscriptions]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch all users (admin endpoint)
      const response = await fetch(getApiUrl('/api/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const users = data.users || data;

      // Filter users with Stripe subscriptions
      const usersWithSubscriptions = users.filter((user: any) =>
        user.stripeCustomerId || user.stripeSubscriptionId
      );

      setSubscriptions(usersWithSubscriptions);
      calculateStats(usersWithSubscriptions);
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (subs: UserSubscription[]) => {
    const total = subs.length;
    const active = subs.filter(s => s.subscriptionStatus === 'active').length;
    const canceled = subs.filter(s => s.subscriptionStatus === 'canceled').length;
    const trialing = subs.filter(s => s.subscriptionStatus === 'trialing').length;
    const pastDue = subs.filter(s => s.subscriptionStatus === 'past_due').length;

    // Estimate MRR (assuming $20 base for active subscriptions)
    const mrr = active * 20; // This is a rough estimate

    setStats({ total, active, canceled, trialing, pastDue, mrr });
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.email.toLowerCase().includes(term) ||
        sub.firstName?.toLowerCase().includes(term) ||
        sub.lastName?.toLowerCase().includes(term) ||
        sub.stripeCustomerId?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.subscriptionStatus === statusFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      active: { variant: 'default', icon: CheckCircle2 },
      trialing: { variant: 'secondary', icon: Calendar },
      canceled: { variant: 'destructive', icon: XCircle },
      past_due: { variant: 'destructive', icon: AlertCircle },
      incomplete: { variant: 'outline', icon: AlertCircle },
    };

    const config = variants[status] || { variant: 'outline', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status || 'No subscription'}
      </Badge>
    );
  };

  const getRoleName = (role: number) => {
    const roles: Record<number, string> = {
      0: 'Root',
      1: 'Admin',
      2: 'Support',
      3: 'Investor',
      4: 'Guest'
    };
    return roles[role] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all user subscriptions
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active customers with subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.canceled}</div>
            <p className="text-xs text-muted-foreground">
              Canceled subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.mrr}</div>
            <p className="text-xs text-muted-foreground">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            Search and filter user subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSubscriptions}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Subscription ID</TableHead>
                  <TableHead>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No subscriptions match your filters'
                        : 'No subscriptions found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.userId}>
                      <TableCell className="font-medium">
                        {sub.firstName} {sub.lastName}
                      </TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleName(sub.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sub.subscriptionStatus)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.stripeCustomerId ? (
                          <span className="text-muted-foreground">
                            {sub.stripeCustomerId.substring(0, 20)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.stripeSubscriptionId ? (
                          <span className="text-muted-foreground">
                            {sub.stripeSubscriptionId.substring(0, 20)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.lastLogin
                          ? new Date(sub.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredSubscriptions.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
