import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Rocket,
  Shield,
  Activity,
  Server,
  Bell,
  Target,
  FileText,
  Copy,
  Download,
} from "lucide-react";

interface ValidationCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

interface ValidationResult {
  passed: boolean;
  timestamp: string;
  environment: string;
  checks: ValidationCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export function ReleaseValidation() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const runValidation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-validation', {
        body: { action: 'run-validation', environment: 'staging' }
      });

      if (error) throw error;
      setResult(data);
      
      toast({
        title: data.passed ? "Validation Passed" : "Validation Failed",
        description: `${data.summary.passed}/${data.summary.total} checks passed`,
        variant: data.passed ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to run release validation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTestActivity = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-validation', {
        body: { action: 'generate-test-activity' }
      });

      if (error) throw error;
      
      toast({
        title: "Test Activity Generated",
        description: `Services: ${data.generated.services}, Metrics: ${data.generated.metrics}, Logs: ${data.generated.logs}`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate test activity",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyResultsToClipboard = () => {
    if (!result) return;
    
    const output = `
# Release Validation Report
Environment: ${result.environment}
Timestamp: ${result.timestamp}
Status: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}

## Summary
- Total Checks: ${result.summary.total}
- Passed: ${result.summary.passed}
- Failed: ${result.summary.failed}
- Warnings: ${result.summary.warnings}

## Detailed Results
${result.checks.map(c => `- [${c.status.toUpperCase()}] ${c.name}: ${c.message}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  };

  const exportAsJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-${result.environment}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: ValidationCheck['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getCheckIcon = (name: string) => {
    if (name.includes('Services')) return <Server className="h-4 w-4" />;
    if (name.includes('Alerts')) return <Bell className="h-4 w-4" />;
    if (name.includes('Incidents')) return <AlertTriangle className="h-4 w-4" />;
    if (name.includes('SLO')) return <Target className="h-4 w-4" />;
    if (name.includes('Error')) return <Activity className="h-4 w-4" />;
    if (name.includes('Logs')) return <FileText className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Release Validation Gate</CardTitle>
                <CardDescription>
                  Run pre-deployment checks before promoting to production
                </CardDescription>
              </div>
            </div>
            {result && (
              <Badge 
                variant={result.passed ? "default" : "destructive"} 
                className="text-sm px-3 py-1"
              >
                {result.passed ? "PASSED" : "FAILED"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={runValidation} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Run Validation
            </Button>
            <Button 
              onClick={generateTestActivity} 
              variant="outline" 
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Generate Test Activity
            </Button>
            {result && (
              <>
                <Button variant="outline" onClick={copyResultsToClipboard} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Report
                </Button>
                <Button variant="outline" onClick={exportAsJSON} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Validation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{result.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Checks</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <div className="text-2xl font-bold text-green-600">{result.summary.passed}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <div className="text-2xl font-bold text-yellow-600">{result.summary.warnings}</div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
              </div>
              <Progress 
                value={(result.summary.passed / result.summary.total) * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Validated at {new Date(result.timestamp).toLocaleString()} • Environment: {result.environment}
              </p>
            </CardContent>
          </Card>

          {/* Checklist Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Release Checklist</CardTitle>
              <CardDescription>All checks must pass to allow production deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.checks.map((check, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      check.status === 'passed' ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' :
                      check.status === 'failed' ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' :
                      'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20'
                    }`}
                  >
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getCheckIcon(check.name)}
                        <span className="font-medium">{check.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{check.message}</p>
                      {check.details && (
                        <pre className="text-xs bg-muted/50 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deployment Decision */}
          <Card className={`border-2 ${result.passed ? 'border-green-500' : 'border-red-500'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.passed ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {result.passed ? 'Ready for Production' : 'Production Deployment Blocked'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {result.passed 
                        ? 'All validation checks passed. Safe to deploy to production.'
                        : 'Fix failing checks before deploying to production.'
                      }
                    </p>
                  </div>
                </div>
                <Button 
                  disabled={!result.passed}
                  className="gap-2"
                  variant={result.passed ? "default" : "secondary"}
                >
                  <Rocket className="h-4 w-4" />
                  Deploy to Production
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
