import { useState } from "react";
import { useLogs } from "@/hooks/useLogs";
import { useServices } from "@/hooks/useServices";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";

export default function LogsPage() {
  const { logs, loading, refetch } = useLogs({ limit: 200 });
  const { services } = useServices();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (serviceFilter !== "all" && log.service_id !== serviceFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getLevelBadge = (level: string) => {
    const variants: Record<string, "destructive" | "secondary" | "outline" | "default"> = {
      ERROR: "destructive",
      WARN: "secondary",
      INFO: "default",
      DEBUG: "outline",
    };
    const colors: Record<string, string> = {
      ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
      WARN: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      INFO: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      DEBUG: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return (
      <Badge variant="outline" className={colors[level] || colors.INFO}>
        {level}
      </Badge>
    );
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return null;
    const service = services.find((s) => s.id === serviceId);
    return service?.display_name || serviceId.slice(0, 8);
  };

  const errorCount = logs.filter((l) => l.level === "ERROR").length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;
  const infoCount = logs.filter((l) => l.level === "INFO").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
            <p className="text-muted-foreground mt-1">
              Search and explore application logs
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Logs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{logs.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">Errors</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{errorCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-muted-foreground">Warnings</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{warnCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">Info</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-600">{infoCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No logs found</h3>
            <p className="text-muted-foreground">
              {logs.length === 0
                ? "No logs have been ingested yet"
                : "No logs match your filters"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg bg-card">
            <ScrollArea className="h-[600px]">
              <div className="font-mono text-sm">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-4 py-2 border-b hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-muted-foreground whitespace-nowrap text-xs">
                      {format(new Date(log.created_at), "HH:mm:ss.SSS")}
                    </span>
                    <div className="w-16">{getLevelBadge(log.level)}</div>
                    {log.service_id && (
                      <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded">
                        {getServiceName(log.service_id)}
                      </span>
                    )}
                    <span className="flex-1 break-all">{log.message}</span>
                    {log.trace_id && (
                      <span className="text-muted-foreground text-xs">
                        trace:{log.trace_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
