import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  Bug, 
  TrendingUp, 
  Users, 
  Clock, 
  Wifi,
  Server,
  Zap,
  RefreshCw
} from 'lucide-react';
import { errorHandler } from '@/lib/errorHandler';
import { NetworkStatus } from '@/components/NetworkStatus';
import { ErrorReporting } from '@/components/ErrorReporting';

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  byComponent: Record<string, number>;
  byHour: Record<string, number>;
  recent: number;
  resolved: number;
}

export const ErrorDashboard: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState(errorHandler.getErrorLogs());
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    byType: {},
    byComponent: {},
    byHour: {},
    recent: 0,
    resolved: 0
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const updateData = () => {
      const logs = errorHandler.getErrorLogs();
      setErrorLogs(logs);
      setStats(calculateStats(logs));
      setLastUpdate(new Date());
    };

    updateData();
    const interval = setInterval(updateData, 10000); // Update every 10 seconds

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateStats = (logs: Array<{
    timestamp: string;
    type: string;
    context?: { component?: string };
    handled: boolean;
  }>): ErrorStats => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: ErrorStats = {
      total: logs.length,
      byType: {},
      byComponent: {},
      byHour: {},
      recent: 0,
      resolved: 0
    };

    logs.forEach(log => {
      const logTime = new Date(log.timestamp);
      
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // Count by component
      const component = log.context?.component || 'Unknown';
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
      
      // Count recent errors (last hour)
      if (logTime > oneHourAgo) {
        stats.recent++;
      }
      
      // Count by hour for trend analysis
      const hour = logTime.getHours();
      const hourKey = `${hour}:00`;
      stats.byHour[hourKey] = (stats.byHour[hourKey] || 0) + 1;
      
      // Count resolved (handled) errors
      if (log.handled) {
        stats.resolved++;
      }
    });

    return stats;
  };

  const getHealthScore = () => {
    if (stats.total === 0) return 100;
    const recentErrorRate = stats.recent / Math.max(stats.total, 1);
    const resolvedRate = stats.resolved / stats.total;
    return Math.max(0, Math.round((1 - recentErrorRate + resolvedRate) * 50));
  };

  const getChartData = () => {
    return Object.entries(stats.byType).map(([type, count]) => ({
      name: type,
      value: count,
      color: type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'
    }));
  };

  const getTrendData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date().getHours() - 23 + i + 24) % 24;
      const hourKey = `${hour}:00`;
      return {
        hour: hourKey,
        errors: stats.byHour[hourKey] || 0
      };
    });
    return hours;
  };

  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Application Health Dashboard</CardTitle>
                <CardDescription>
                  Real-time monitoring and error tracking
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Last updated</div>
                <div className="text-sm font-medium">
                  {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthScore}%</p>
              </div>
              <div className={`p-3 rounded-full ${
                healthScore > 80 ? 'bg-green-100' : healthScore > 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Zap className={`w-6 h-6 ${
                  healthScore > 80 ? 'text-green-600' : healthScore > 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <Progress 
              value={healthScore} 
              className={`mt-3 ${
                healthScore > 80 ? 'bg-green-100' : healthScore > 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.resolved} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent (1h)</p>
                <p className="text-2xl font-bold">{stats.recent}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last hour activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connection</p>
                <p className="text-2xl font-bold">{isOnline ? 'Online' : 'Offline'}</p>
              </div>
              <div className={`p-3 rounded-full ${
                isOnline ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Wifi className={`w-6 h-6 ${
                  isOnline ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Network status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Network Status Details */}
      <NetworkStatus showDetails />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Error Types</CardTitle>
                <CardDescription>Distribution of error types</CardDescription>
              </CardHeader>
              <CardContent>
                {getChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No error data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Components with Most Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Components</CardTitle>
                <CardDescription>Components with most errors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byComponent)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([component, count]) => (
                      <div key={component} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{component}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  
                  {Object.keys(stats.byComponent).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No component errors recorded
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Trends</CardTitle>
              <CardDescription>Errors over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="errors" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.byComponent).map(([component, count]) => (
              <Card key={component}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{component}</h3>
                    <Badge variant={count > 5 ? 'destructive' : count > 2 ? 'default' : 'secondary'}>
                      {count} errors
                    </Badge>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span>Error rate</span>
                      <span>{Math.round((count / stats.total) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(count / Math.max(stats.total, 1)) * 100} 
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-4">
          <ErrorReporting />
        </TabsContent>
      </Tabs>

      {/* Recent Alerts */}
      {stats.recent > 5 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>High error rate detected!</strong> {stats.recent} errors in the last hour. 
            Consider investigating the most frequent issues.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Hook for showing the error dashboard
export function useErrorDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  
  const showDashboard = () => setIsVisible(true);
  const hideDashboard = () => setIsVisible(false);
  
  return {
    isVisible,
    showDashboard,
    hideDashboard
  };
}