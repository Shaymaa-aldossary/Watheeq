
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, Users, Settings, FileText, Shield, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { toolRequestsService, reportsService, alertsService, toolsService, ToolRequest, UsageReport } from "../firebase/services";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [overdueReports, setOverdueReports] = useState([]);
  const [totalTools, setTotalTools] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState([]);

  function getDurationInDays(duration) {
    switch (duration) {
      case "1 day": return 1;
      case "3 days": return 3;
      case "1 week": return 7;
      case "2 weeks": return 14;
      default: return 30;
    }
  }

  const fetchTotalTools = async () => {
    try {
      const allTools = await toolsService.getAllTools();
      setTotalTools(allTools.length);
    } catch (error) {
      console.error("Failed to fetch total tools:", error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      // Get all tool requests to count unique users
      const allRequests = await toolRequestsService.getAllRequests();

      // Get current month start
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Filter requests from this month and get unique user IDs
      const thisMonthUsers = new Set();
      allRequests.forEach(request => {
        const requestDate = new Date(request.createdAt.seconds ? request.createdAt.seconds * 1000 : request.createdAt);
        if (requestDate >= monthStart) {
          thisMonthUsers.add(request.userId);
        }
      });

      setActiveUsers(thisMonthUsers.size);
    } catch (error) {
      console.error("Failed to fetch active users:", error);
    }
  };

  const fetchOverdueReports = async () => {
    try {
      // Fetching overdue reports...

      // Fetch all tool requests
      const allRequests = await toolRequestsService.getAllRequests();

      const now = new Date();
      const overdueList = [];

      // Filter approved requests that are more than 7 days old
      const approvedRequests = allRequests.filter(request => {
        if (request.status !== "approved" || !request.approvedAt) {
          return false;
        }

        const approvedDate = new Date(request.approvedAt.seconds ? request.approvedAt.seconds * 1000 : request.approvedAt);
        const daysSinceApproval = (now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24);

        return daysSinceApproval > 7;
      });

      // Add all approved requests older than 7 days to overdue list
      for (const request of approvedRequests) {
        overdueList.push({
          id: request.id,
          userName: request.userName,
          toolName: request.toolName,
          purpose: request.purpose,
          userEmail: request.userEmail,
          approvedAt: request.approvedAt,
          duration: request.duration
        });
      }
      setOverdueReports(overdueList);
      setRequests(allRequests);
    } catch (error) {
      console.error("Failed to fetch overdue reports:", error);
    }
  };

  // Load data from Firebase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load pending tool requests
        const allRequests = await toolRequestsService.getAllRequests();
        const pending = allRequests.filter(req => req.status === "pending");
        setPendingRequests(pending);

        // Load total tools count
        await fetchTotalTools();

        // Load active users count
        await fetchActiveUsers();

        // Load overdue usage reports
        await fetchOverdueReports();

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Send reminder notification
  const sendReminder = async (report) => {
    try {
      setSendingReminders(prev => [...prev, report.id]);

      await alertsService.createAlert({
        title: "Overdue Usage Report Reminder",
        message: `Please submit your usage report for ${report.toolName} as soon as possible. This report is overdue and required for compliance.`,
        type: "warning",
        userId: report.userId,
        isRead: false,
        alertSent: true
      });

      // Send notification to admin
      await alertsService.createAlert({
        title: "User Overdue Report Notification",
        message: `${report.userName} has not submitted the usage report for ${report.toolName}.`,
        type: "info",
        userId: "admin",
        isRead: false,
        alertSent: true
      });

      // Update the request to mark alert as sent
      if (report.id) {
        await toolRequestsService.updateRequest(report.id, { alertSent: true });
      }

      toast.success(`Reminder sent to ${report.userName} for ${report.toolName}`);
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Failed to send reminder. Please try again.");
    } finally {
      setSendingReminders(prev => prev.filter(id => id !== report.id));
    }
  };

  const stats = {
    totalTools: totalTools,
    pendingRequests: pendingRequests.length,
    overdueReports: overdueReports.length,
    activeUsers: activeUsers
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/tools')}>Add New Tool</Button>
          <Button variant="outline" onClick={() => navigate('/admin/reports')}>Export Reports</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTools}</div>
            <p className="text-xs text-muted-foreground">Approved for use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueReports}</div>
            <p className="text-xs text-muted-foreground">Reports not submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueReports.length > 0 && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{overdueReports.length} users</strong> have overdue tool usage reports. 
            Please follow up to ensure compliance with security policies.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Tool Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              User requests awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.slice(0, 5).map((request) => {
                  // Calculate request age
                  const requestDate = new Date(request.createdAt?.seconds ? request.createdAt.seconds * 1000 : request.createdAt || Date.now());
                  const now = new Date();
                  const hoursOld = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);
                  const isNew = hoursOld <= 24; // Consider requests newer than 24 hours as "new"
                  
                  return (
                    <div key={request.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                      isNew 
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950' 
                        : 'border-border'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.userName}</span>
                          <Badge variant="secondary">{request.toolName}</Badge>
                          {isNew && (
                            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.purpose}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {request.requestDate || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Environment: {request.environment}
                        </p>
                        {!isNew && hoursOld > 48 && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            {Math.floor(hoursOld / 24)} days old
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/admin/requests')}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {pendingRequests.length > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/requests')}
                    >
                      View All {pendingRequests.length} Requests
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
                <p className="text-xs mt-1">All requests have been reviewed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Overdue Usage Reports ({overdueReports.length})
            </CardTitle>
            <CardDescription>
              Users who haven't submitted required reports based on approvedAt date and duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : overdueReports.length > 0 ? (
              <div className="space-y-4">
                {overdueReports.slice(0, 5).map((req) => {
                  const approvedDate = new Date(req.approvedAt.seconds ? req.approvedAt.seconds * 1000 : req.approvedAt);
                  const now = new Date();
                  const daysOverdue = Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={req.id} className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{req.userName}</span>
                          <Badge variant="destructive">{req.toolName}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Purpose: {req.purpose}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          User Email: {req.userEmail}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Approved: {approvedDate.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-destructive font-medium">
                          {daysOverdue} days since approval 
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => sendReminder(req)}
                          disabled={sendingReminders.includes(req.id || '')}
                        >
                          {sendingReminders.includes(req.id || '') ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Send Reminder
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {overdueReports.length > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin/reports')}
                    >
                      View All {overdueReports.length} Reports
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No overdue reports</p>
                <p className="text-xs mt-1">All reports are up to date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/tools')}
            >
              <Settings className="h-6 w-6" />
              Manage Tools
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/reports')}
            >
              <FileText className="h-6 w-6" />
              Review Reports
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/requests')}
            >
              <Users className="h-6 w-6" />
              User Management
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}