'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, Clock, Database, Globe, AlertTriangle } from 'lucide-react';

interface PerformanceMetric {
  timestamp: string;
  endpoint: string;
  method: string;
  totalTime: number;
  databaseTime: number;
  externalServiceTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  queryCount: number;
  externalCallCount: number;
  userId?: string;
  correlationId: string;
}

interface PerformanceStats {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalRequests: number;
  errorRate: number;
  slowRequestCount: number;
  avgDatabaseTime: number;
  avgExternalServiceTime: number;
  topSlowEndpoints: Array<{
    endpoint: string;
    avgTime: number;
    requestCount: number;
  }>;
  errorsByEndpoint: Array<{
    endpoint: string;
    errorCount: number;
    errorRate: number;
  }>;
  requestVolumeOverTime: Array<{
    timestamp: string;
    count: number;
    errorCount: number;
  }>;
  responseTimeOverTime: Array<{
    timestamp: string;
    avgTime: number;
    p95Time: number;
    p99Time: number;
  }>;
  slowestQueries: Array<{
    query: string;
    avgDuration: number;
    count: number;
    collection?: string;
  }>;
  databaseTimeOverTime: Array<{
    timestamp: string;
    avgDbTime: number;
    queryCount: number;
  }>;
}

interface PerformanceDashboardProps {
  className?: string;
}

export function PerformanceDashboard({ className }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      
      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      
      switch (timeRange) {
        case '15m':
          startTime.setMinutes(endTime.getMinutes() - 15);
          break;
        case '1h':
          startTime.setHours(endTime.getHours() - 1);
          break;
        case '6h':
          startTime.setHours(endTime.getHours() - 6);
          break;
        case '24h':
          startTime.setHours(endTime.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(endTime.getDate() - 7);
          break;
      }

      // Fetch both performance logs and stats
      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/v1/admin/logs/search?` + new URLSearchParams({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          pageSize: '500'
        })),
        fetch(`/api/v1/admin/performance/stats?timeRange=${timeRange}&_t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        })
      ]);

      if (!logsResponse.ok) {
        throw new Error(`Failed to fetch performance logs: ${logsResponse.statusText}`);
      }
      
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch performance stats: ${statsResponse.statusText}`);
      }

      const [logsData, statsData] = await Promise.all([
        logsResponse.json(),
        statsResponse.json()
      ]);
      
      if (!logsData.success) {
        throw new Error(logsData.message || 'Failed to fetch performance logs');
      }
      
      if (!statsData.success) {
        throw new Error(statsData.message || 'Failed to fetch performance stats');
      }

      // Parse performance metrics from log entries
      const performanceMetrics: PerformanceMetric[] = [];
      
      logsData.logs.forEach((log: any) => {
        const metric: PerformanceMetric = {
          timestamp: log.timestamp,
          endpoint: log.endpoint || 'unknown',
          method: log.method || 'unknown',
          totalTime: log.performanceMetrics?.responseTime || 0,
          databaseTime: 0, // Not tracked yet
          externalServiceTime: 0, // Not tracked yet
          statusCode: log.statusCode || 200,
          requestSize: 0, // Not tracked yet
          responseSize: 0, // Not tracked yet
          queryCount: 0, // Not tracked yet
          externalCallCount: 0, // Not tracked yet
          userId: log.userId,
          correlationId: log.correlationId || 'unknown'
        };
        performanceMetrics.push(metric);
      });

      setMetrics(performanceMetrics);
      
      // Use stats from the API instead of calculating locally
      const apiStats: PerformanceStats = {
        avgResponseTime: statsData.data.avgResponseTime || 0,
        p95ResponseTime: statsData.data.p95ResponseTime || 0,
        p99ResponseTime: statsData.data.p99ResponseTime || 0,
        totalRequests: statsData.data.totalRequests || 0,
        errorRate: statsData.data.errorRate || 0,
        slowRequestCount: statsData.data.slowRequestCount || 0,
        avgDatabaseTime: statsData.data.avgDatabaseTime || 0,
        avgExternalServiceTime: 0, // Not calculated yet
        topSlowEndpoints: statsData.data.slowestEndpoints
          .filter((ep: any) => ep.avgTime !== undefined)
          .map((ep: any) => ({
            endpoint: ep.endpoint,
            avgTime: ep.avgTime,
            requestCount: ep.count
          })),
        errorsByEndpoint: statsData.data.errorsByEndpoint.map((ep: any) => ({
          endpoint: ep.endpoint,
          errorCount: ep.errorCount || 0,
          errorRate: ep.errorRate || 0
        })),
        requestVolumeOverTime: statsData.data.requestVolumeOverTime || [],
        responseTimeOverTime: statsData.data.responseTimeOverTime || [],
        slowestQueries: statsData.data.slowestQueries || [],
        databaseTimeOverTime: statsData.data.databaseTimeOverTime || []
      };
      
      setStats(apiStats);
      
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (metrics: PerformanceMetric[]): PerformanceStats => {
    const responseTimes = metrics.map(m => m.totalTime).sort((a, b) => a - b);
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const slowRequestCount = metrics.filter(m => m.totalTime > 2000).length;
    
    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    
    // Group by endpoint for analysis
    const endpointGroups = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);
    
    // Calculate top slow endpoints
    const topSlowEndpoints = Object.entries(endpointGroups)
      .map(([endpoint, endpointMetrics]) => ({
        endpoint,
        avgTime: endpointMetrics.reduce((sum, m) => sum + m.totalTime, 0) / endpointMetrics.length,
        requestCount: endpointMetrics.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    // Calculate errors by endpoint
    const errorsByEndpoint = Object.entries(endpointGroups)
      .map(([endpoint, endpointMetrics]) => {
        const errorCount = endpointMetrics.filter(m => m.statusCode >= 400).length;
        return {
          endpoint,
          errorCount,
          errorRate: (errorCount / endpointMetrics.length) * 100
        };
      })
      .filter(e => e.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 5);
    
    return {
      avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      totalRequests: metrics.length,
      errorRate: (errorCount / metrics.length) * 100,
      slowRequestCount,
      avgDatabaseTime: metrics.reduce((sum, m) => sum + m.databaseTime, 0) / metrics.length,
      avgExternalServiceTime: metrics.reduce((sum, m) => sum + m.externalServiceTime, 0) / metrics.length,
      topSlowEndpoints,
      errorsByEndpoint,
      requestVolumeOverTime: [],
      responseTimeOverTime: [],
      slowestQueries: [],
      databaseTimeOverTime: []
    };
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };



  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    fetchPerformanceData();
    
    // Set up auto-refresh
    const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [timeRange]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={`${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading performance data: {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={fetchPerformanceData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time API performance monitoring and analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15m</SelectItem>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="6h">Last 6h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7d</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      {!stats ? (
        <Alert>
          <AlertDescription>
            No performance data available for the selected time range.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats ? getStatusColor(stats.avgResponseTime, { good: 500, warning: 1000 }) : ''}`}>
                  {stats ? formatDuration(stats.avgResponseTime) : '0ms'}
                </div>
                <p className="text-xs text-muted-foreground">
                  P95: {stats ? formatDuration(stats.p95ResponseTime) : '0ms'} | P99: {stats ? formatDuration(stats.p99ResponseTime) : '0ms'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats ? stats.totalRequests.toLocaleString() : '0'}</div>
                <p className="text-xs text-muted-foreground">
                  {stats ? stats.slowRequestCount : 0} slow requests ({'>'}2s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats ? getStatusColor(stats.errorRate, { good: 1, warning: 5 }) : ''}`}>
                  {stats ? stats.errorRate.toFixed(2) : '0.00'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats ? Math.round((stats.errorRate / 100) * stats.totalRequests) : 0} failed requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg DB Time</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats ? getStatusColor(stats.avgDatabaseTime, { good: 100, warning: 500 }) : ''}`}>
                  {stats ? formatDuration(stats.avgDatabaseTime) : '0ms'}
                </div>
                <p className="text-xs text-muted-foreground">
                  External: {stats ? formatDuration(stats.avgExternalServiceTime) : '0ms'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slowest Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Slowest Endpoints</CardTitle>
                <CardDescription>
                  Endpoints with highest average response times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!stats || stats.topSlowEndpoints.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slow endpoints detected</p>
                  ) : (
                    stats.topSlowEndpoints.map((endpoint, index) => (
                      <div key={`${endpoint.endpoint}-${endpoint.avgTime}-${endpoint.requestCount}-${index}`} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{endpoint.endpoint}</p>
                          <p className="text-xs text-muted-foreground">
                            {endpoint.requestCount} requests
                          </p>
                        </div>
                        <Badge variant={endpoint.avgTime > 2000 ? 'destructive' : endpoint.avgTime > 1000 ? 'secondary' : 'default'}>
                          {formatDuration(endpoint.avgTime)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Endpoint</CardTitle>
                <CardDescription>
                  Endpoints with highest error rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!stats || stats.errorsByEndpoint.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No errors detected</p>
                  ) : (
                    stats.errorsByEndpoint.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{endpoint.endpoint}</p>
                          <p className="text-xs text-muted-foreground">
                            {endpoint.errorCount} errors
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {endpoint.errorRate.toFixed(1)}%
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Performance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slowest Database Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Slowest Database Queries</CardTitle>
                <CardDescription>
                  Database queries with highest average execution times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!stats || !stats.slowestQueries || stats.slowestQueries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slow queries detected</p>
                  ) : (
                    stats.slowestQueries.map((query, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium font-mono text-blue-600 truncate">
                              {query.query}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{query.count} executions</span>
                              {query.collection && (
                                <span>• Collection: {query.collection}</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={query.avgDuration > 500 ? 'destructive' : query.avgDuration > 100 ? 'secondary' : 'default'}>
                            {formatDuration(query.avgDuration)}
                          </Badge>
                        </div>
                        {index < stats.slowestQueries.length - 1 && (
                          <div className="border-b border-gray-100"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Database Time Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Database Performance Trends</CardTitle>
                <CardDescription>
                  Database execution time and query volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!stats || !stats.databaseTimeOverTime || stats.databaseTimeOverTime.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No database trend data available</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.databaseTimeOverTime.slice(-5).map((timePoint, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {new Date(timePoint.timestamp).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timePoint.queryCount} queries executed
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={timePoint.avgDbTime > 200 ? 'destructive' : timePoint.avgDbTime > 100 ? 'secondary' : 'default'}>
                              {formatDuration(timePoint.avgDbTime)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {stats.databaseTimeOverTime.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Showing last 5 time intervals
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default PerformanceDashboard;