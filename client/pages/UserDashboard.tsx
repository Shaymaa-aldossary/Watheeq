import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, CheckCircle, Clock, AlertTriangle, Shield, XCircle, Bell } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toolRequestsService, reportsService, alertsService, ToolRequest, UsageReport } from "@/firebase/services";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function UserDashboard() {
  const navigate = useNavigate();
  //منهنا تعديل التنبيهات المتاخرة
  function getDurationInDays(duration: string): number {
    const map: Record<string, number> = {
      "1-week": 7,
      "2-weeks": 14,
      "1-month": 30,
      "3-months": 90,
      "6-months": 180,
      "permanent": 9999
    };
    return map[duration] || 0;
  }
  //منهنا تعديل التنبيهات المتاخرة
  // Mock data
  const { user } = useAuth();
  const [toolRequests, setToolRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueToolRequests, setOverdueToolRequests] = useState<ToolRequest[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [overdueReports, setOverdueReports] = useState<ToolRequest[]>([]);
  const [userAlerts, setUserAlerts] = useState<any[]>([]);
  const [showApprovedInNotifications, setShowApprovedInNotifications] = useState(true);
  const [showOverdueInNotifications, setShowOverdueInNotifications] = useState(true);

  // Load user's data from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("Loading user data for:", user.email);


        // Get all requests and filter by user
        const allRequests = await toolRequestsService.getAllRequests();
        const userRequests = allRequests.filter(request => 
          request.userEmail === user.email || request.userId === user.email || request.userId === user.id
        );
        console.log("User requests found:", userRequests.length);
        setToolRequests(userRequests);

        // Calculate overdue reports based on toolRequests collection
        const now = new Date();
        const overdueRequests = userRequests.filter((req) => {
          if (req.status !== "approved" || req.reportSubmitted === true || !req.approvedAt || !req.duration) return false;
          
          const approvedDate = new Date(req.approvedAt.seconds ? req.approvedAt.seconds * 1000 : req.approvedAt);
          const durationDays = getDurationInDays(req.duration);
          const deadline = new Date(approvedDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
          
          return now > deadline;
        });
        
        setOverdueReports(overdueRequests);
        setOverdueToolRequests(overdueRequests);

         // Load user alerts
         const alerts = await alertsService.getUserAlerts(user.id);
         setUserAlerts(alerts);

      } catch (error) {
        console.error("Error loading user data:", error);
        setToolRequests([]);
        setOverdueReports([]);
        setUserAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const pendingRequests = toolRequests.filter(req => req.status === "pending");
  const approvedRequests = toolRequests.filter(req => req.status === "approved");
  const rejectedRequests = toolRequests.filter(req => req.status === "rejected");


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Analyst Dashboard</h1>
          <p className="text-muted-foreground">Manage your tool requests and submit usage reports</p>
        </div>
        <div className="flex gap-2 items-center">
          <Popover open={showNotifications} onOpenChange={(open) => {
            setShowNotifications(open);
            if (!open) {
              // Hide both approved requests and overdue reports notifications when popover closes
              setShowApprovedInNotifications(false);
              setShowOverdueInNotifications(false);
            }
          }}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {((showOverdueInNotifications && overdueReports.length > 0) || (showApprovedInNotifications && approvedRequests.length > 0)) && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {(showOverdueInNotifications ? overdueReports.length : 0) + (showApprovedInNotifications ? approvedRequests.length : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Notifications</h4>
                {((showOverdueInNotifications && overdueReports.length > 0) || (showApprovedInNotifications && approvedRequests.length > 0)) ? (
                  <div className="space-y-3">
                    {/* Overdue Reports */}
                    {showOverdueInNotifications && overdueReports.length > 0 && (
                      <>
                        <div className="text-sm text-red-600 font-medium">
                          Overdue Reports ({overdueReports.length})
                        </div>
                        {overdueReports.map((request) => {
                          const approvedDate = new Date(request.approvedAt.seconds ? request.approvedAt.seconds * 1000 : request.approvedAt);
                          const now = new Date();
                          const durationDays = getDurationInDays(request.duration);
                          const deadline = new Date(approvedDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
                          
                          return (
                            <div key={request.id} className="border-l-4 border-red-500 pl-3 py-2">
                              <div className="text-sm font-medium">{request.toolName}</div>
                              <div className="text-xs text-muted-foreground">
                                Duration: {request.duration}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Approved Tools */}
                    {showApprovedInNotifications && approvedRequests.length > 0 && (
                      <>
                        <div className="text-sm text-green-600 font-medium">
                          Approved Requests ({approvedRequests.length})
                        </div>
                        {approvedRequests.map((request) => {
                          const approvedDate = new Date(request.approvedAt.seconds ? request.approvedAt.seconds * 1000 : request.approvedAt);
                          
                          return (
                            <div key={request.id} className="border-l-4 border-green-500 pl-3 py-2">
                              <div className="text-sm font-medium">{request.toolName}</div>
                              <div className="text-xs text-muted-foreground">
                                Duration: {request.duration} | Approved on {approvedDate.toLocaleDateString()}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No new notifications
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={() => navigate('/user/request')}>Request Tool</Button>
          <Button variant="outline" onClick={() => navigate('/user/report')}>Submit Report</Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setLoading(true);
              // Reload all user data
              const loadUserData = async () => {
                if (!user) return;
                try {
                  const allRequests = await toolRequestsService.getAllRequests();
                  const userRequests = allRequests.filter(request => 
                    request.userEmail === user.email || request.userId === user.email || request.userId === user.id
                  );
                  setToolRequests(userRequests);

                  // Recalculate overdue reports
                  const now = new Date();
                  const overdueRequests = userRequests.filter((req) => {
                    if (req.status !== "approved" || req.reportSubmitted === true || !req.approvedAt || !req.duration) return false;
                    
                    const approvedDate = new Date(req.approvedAt.seconds ? req.approvedAt.seconds * 1000 : req.approvedAt);
                    const durationDays = getDurationInDays(req.duration);
                    const deadline = new Date(approvedDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
                    
                    return now > deadline;
                  });
                  
                  setOverdueReports(overdueRequests);
                  setOverdueToolRequests(overdueRequests);

                  const alerts = await alertsService.getUserAlerts(user.id);
                  setUserAlerts(alerts);
                } catch (error) {
                  console.error("Error refreshing data:", error);
                } finally {
                  setLoading(false);
                }
              };
              loadUserData();
            }}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Alerts section removed - notifications moved to bell icon */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tool Requests</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolRequests.length}</div>
            <p className="text-xs text-muted-foreground">Total requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueReports.length}</div>
            <p className="text-xs text-muted-foreground">Based on approved requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Good</div>
            <p className="text-xs text-muted-foreground">On track</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
               Tool Requests
            </CardTitle>
            <CardDescription>
            Your tool requests and admin responses
            </CardDescription>
          </CardHeader>
          <CardContent>
          {loading ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : toolRequests.length > 0 ? (
              <div className="space-y-4">
                {toolRequests.filter((request) => request.status === "approved" || request.status === "rejected").map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{request.toolName}</span>
                        {request.status === "approved" && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {request.status === "rejected" && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                        {request.status === "pending" && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                           )}
                           </div>
                           <p className="text-sm text-muted-foreground">{request.purpose}</p>
                           <p className="text-xs text-muted-foreground">
                           Requested: {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                           </p>
                           {request.adminComment && (
                             <p className="text-xs text-blue-600 mt-1">
                               <strong>Admin:</strong> {request.adminComment}
                             </p>
                           )}
                           {request.reviewedDate && (
                             <p className="text-xs text-muted-foreground">
                               Reviewed: {request.reviewedDate}
                             </p>
                           )}
                         </div>
                         <div className="flex gap-2">
                           {request.status === "approved" && (
                             <Button
                             size="sm"
                             variant="outline"
                             onClick={() => navigate('/user/tools')}
                           >
                             Use Tool
                           </Button>
                           )}
                           {request.status === "rejected" && (
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => navigate('/user/request')}
                             >
                               Request Again
                             </Button>
                           )}
                         </div>
                         </div>
                ))}
              </div>
                     ) : (
                       <div className="text-center py-8 text-muted-foreground">
                         <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                         <p>No tool requests yet</p>
                         <Button
                           size="sm"
                           variant="outline"
                           className="mt-2"
                           onClick={() => navigate('/user/request')}
                         >
                           Request Your First Tool
                         </Button>
                       </div>
                     )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Requests
            </CardTitle>
            <CardDescription>
              Your tool requests awaiting admin review
            </CardDescription>
          </CardHeader>
          <CardContent>
          {loading ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                      <span className="font-medium">{request.toolName}</span>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.purpose}</p>
                      <p className="text-xs text-muted-foreground">
                      Requested: {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Environment: {request.environment}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/user/request')}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending requests</p>
                  <p className="text-xs mt-1">All your requests have been reviewed</p>
                  </div>
            )}
          </CardContent>
        </Card>
      </div>

{/* Approved and Rejected Requests */}
{(approvedRequests.length > 0 || rejectedRequests.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approved Requests */}
          {approvedRequests.length > 0 && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Approved Requests ({approvedRequests.length})
                </CardTitle>
                <CardDescription>
                  Your approved tool requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.toolName}</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.purpose}</p>
                        {request.adminComment && (
                          <p className="text-xs text-green-700 mt-1">
                            <strong>Admin:</strong> {request.adminComment}
                          </p>
                        )}
                        {request.reviewedDate && (
                          <p className="text-xs text-muted-foreground">
                            Approved: {request.reviewedDate}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/user/tools')}
                      >
                        Use Tool
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejected Requests */}
          {rejectedRequests.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Rejected Requests ({rejectedRequests.length})
                </CardTitle>
                <CardDescription>
                  Your rejected tool requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rejectedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.toolName}</span>
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.purpose}</p>
                        {request.adminComment && (
                          <p className="text-xs text-red-700 mt-1">
                            <strong>Reason:</strong> {request.adminComment}
                          </p>
                        )}
                        {request.reviewedDate && (
                          <p className="text-xs text-muted-foreground">
                            Rejected: {request.reviewedDate}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/user/request')}
                      >
                        Request Again
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Overdue Usage Reports - Based on approved tool requests older than 7 days */}
      {(() => {
        const now = new Date();
        const overdueApprovedRequests = toolRequests.filter(request => {
          if (request.status !== "approved" || !request.approvedAt) return false;

          const approvedDate = new Date(request.approvedAt.seconds ? request.approvedAt.seconds * 1000 : request.approvedAt);
          const daysSinceApproval = Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));

          return daysSinceApproval > 7;
        });

        return overdueApprovedRequests.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Overdue Usage Reports ({overdueApprovedRequests.length})
              </CardTitle>
              <CardDescription>
                Approved tool requests requiring usage reports (more than 7 days old)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueApprovedRequests.map((request) => {
                  const approvedDate = new Date(request.approvedAt.seconds ? request.approvedAt.seconds * 1000 : request.approvedAt);
                  const daysSinceApproval = Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={request.id} className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.toolName}</span>
                          <Badge variant="destructive">Report Overdue</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Approved: {approvedDate.toLocaleDateString()}
                        </p>
                        {request.adminComment && (
                          <p className="text-sm text-blue-600">
                            <strong>Admin Comment:</strong> {request.adminComment}
                          </p>
                        )}
                        <p className="text-xs text-destructive font-medium">
                          {daysSinceApproval} days since approval 
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => navigate('/user/report')}
                        >
                          Submit Report Now
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

        {/* User Alerts */}
        {userAlerts.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <AlertTriangle className="h-5 w-5" />
                Notifications ({userAlerts.length})
              </CardTitle>
              <CardDescription>
                Important messages from administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="outline" className="text-blue-700">
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.createdAt ? new Date(alert.createdAt.seconds * 1000).toLocaleDateString() : "Unknown date"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Mark alert as read
                        if (alert.id) {
                          alertsService.markAsRead(alert.id);
                          setUserAlerts(prev => prev.filter(a => a.id !== alert.id));
                        }
                      }}
                    >
                      Mark Read
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/user/request')}
            >
              <Settings className="h-6 w-6" />
              Request Tool
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/user/report')}
            >
              <FileText className="h-6 w-6" />
              Submit Usage Report
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/admin/cve-search')}
            >
              <CheckCircle className="h-6 w-6" />
              View Security Guidelines
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}