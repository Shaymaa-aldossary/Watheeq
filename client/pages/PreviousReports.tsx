import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, CheckCircle, AlertTriangle, Clock, User, Calendar, Settings, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface UsageReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  toolName: string;
  dateOfUse: string;
  submittedDate: string;
  purposeOfUse: string;
  locationOfUse: string;
  stepsDescription: string;
  outputsResults: string;
  adheredToPolicy: boolean;
  stayedWithinScope: boolean;
  noThirdPartySharing: boolean;
  noMaliciousUse: boolean;
  comments: string;
  status: "pending" | "reviewed" | "flagged";
  adminResponse?: string;
  adminComment?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  complianceScore: number;
}

export default function PreviousReports() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<UsageReport | null>(null);
  const [reports, setReports] = useState<UsageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auto-load reports when component mounts
  useEffect(() => {
    if (user) {
      loadUserReports();
    }
  }, [user]);

  // Load user reports from Firebase
  const loadUserReports = async () => {
    if (!user) {
      console.log("No user found, cannot load reports");
      return;
    }
    
    try {
      setLoading(true);
      console.log("=== Starting report loading process ===");
      console.log("Current user:", user);
      console.log("User ID:", user.id);
      console.log("User email:", user.email);
      
      const reportsRef = collection(db, "usageReports");
      let reportsData: UsageReport[] = [];
      
      // First, let's try to get all reports to see what's in the database
      console.log("Checking total reports in database...");
      const allReportsQuery = query(reportsRef, orderBy("submittedDate", "desc"));
      const allReportsSnapshot = await getDocs(allReportsQuery);
      console.log("Total reports in database:", allReportsSnapshot.size);
      
      // Log all reports to see the data structure
      allReportsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("All report data:", { 
          id: doc.id, 
          userId: data.userId, 
          userEmail: data.userEmail,
          userName: data.userName,
          toolName: data.toolName 
        });
      });
      
      // Strategy 1: Try with user.id
      console.log("Strategy 1: Querying with user.id =", user.id);
      try {
        const q1 = query(
          reportsRef,
          where("userId", "==", user.id),
          orderBy("submittedDate", "desc")
        );
        
        const querySnapshot1 = await getDocs(q1);
        console.log("Strategy 1 results:", querySnapshot1.size, "reports found");
        
        querySnapshot1.forEach((doc) => {
          const data = doc.data();
          console.log("Strategy 1 report:", { id: doc.id, userId: data.userId, userEmail: data.userEmail });
          reportsData.push({
            id: doc.id,
            ...data
          } as UsageReport);
        });
      } catch (error) {
        console.log("Strategy 1 failed:", error);
      }
      
      // Strategy 2: Try with user.email as userId
      if (reportsData.length === 0) {
        console.log("Strategy 2: Querying with user.email as userId =", user.email);
        try {
          const q2 = query(
            reportsRef,
            where("userId", "==", user.email),
            orderBy("submittedDate", "desc")
          );
          
          const querySnapshot2 = await getDocs(q2);
          console.log("Strategy 2 results:", querySnapshot2.size, "reports found");
          
          querySnapshot2.forEach((doc) => {
            const data = doc.data();
            console.log("Strategy 2 report:", { id: doc.id, userId: data.userId, userEmail: data.userEmail });
            reportsData.push({
              id: doc.id,
              ...data
            } as UsageReport);
          });
        } catch (error) {
          console.log("Strategy 2 failed:", error);
        }
      }
      
      // Strategy 3: Try with userEmail field
      if (reportsData.length === 0) {
        console.log("Strategy 3: Querying with userEmail field =", user.email);
        try {
          const q3 = query(
            reportsRef,
            where("userEmail", "==", user.email),
            orderBy("submittedDate", "desc")
          );
          
          const querySnapshot3 = await getDocs(q3);
          console.log("Strategy 3 results:", querySnapshot3.size, "reports found");
          
          querySnapshot3.forEach((doc) => {
            const data = doc.data();
            console.log("Strategy 3 report:", { id: doc.id, userId: data.userId, userEmail: data.userEmail });
            reportsData.push({
              id: doc.id,
              ...data
            } as UsageReport);
          });
        } catch (error) {
          console.log("Strategy 3 failed:", error);
        }
      }
      
      // Strategy 4: Try without orderBy (in case of index issues)
      if (reportsData.length === 0) {
        console.log("Strategy 4: Querying without orderBy");
        try {
          const q4 = query(
            reportsRef,
            where("userEmail", "==", user.email)
          );
          
          const querySnapshot4 = await getDocs(q4);
          console.log("Strategy 4 results:", querySnapshot4.size, "reports found");
          
          querySnapshot4.forEach((doc) => {
            const data = doc.data();
            console.log("Strategy 4 report:", { id: doc.id, userId: data.userId, userEmail: data.userEmail });
            reportsData.push({
              id: doc.id,
              ...data
            } as UsageReport);
          });
        } catch (error) {
          console.log("Strategy 4 failed:", error);
        }
      }
      
      console.log("=== Final Results ===");
      console.log("Total reports found for user:", reportsData.length);
      console.log("Reports data:", reportsData);
      
      setReports(reportsData);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading reports:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      setReports([]);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.purposeOfUse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline">Pending Review</Badge>;
      case "reviewed": return <Badge variant="default">Reviewed</Badge>;
      case "flagged": return <Badge variant="destructive">Flagged</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getComplianceBadge = (score: number) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge variant="default">Good</Badge>;
    if (score >= 60) return <Badge variant="outline">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const statsData = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    reviewed: reports.filter(r => r.status === "reviewed").length,
    flagged: reports.filter(r => r.status === "flagged").length,
    avgCompliance: reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.complianceScore, 0) / reports.length) : 0
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Previous Reports</h1>
            <p className="text-muted-foreground">View your submitted tool usage reports and admin responses</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-medium">Loading reports...</h3>
                <p className="text-muted-foreground">Please wait while we fetch your reports.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Previous Reports</h1>
          <p className="text-muted-foreground">View your submitted tool usage reports and admin responses</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUserReports} disabled={loading}>
            {loading ? "Loading..." : "Load Reports"}
          </Button>
          {dataLoaded && (
            <Button onClick={loadUserReports} disabled={loading} variant="outline">
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          )}
          <Button onClick={() => window.print()}>Export Reports</Button>
          
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statsData.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsData.reviewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsData.flagged}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.avgCompliance}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by tool name or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Usage Reports</CardTitle>
          <CardDescription>
            View your submitted reports and administrative responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Date Used</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {report.toolName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{report.dateOfUse}</div>
                      <div className="text-sm text-muted-foreground">
                        Submitted: {report.submittedDate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{report.purposeOfUse}</TableCell>
                  <TableCell>{getComplianceBadge(report.complianceScore)}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    {report.adminResponse ? (
                      <div className="text-sm">
                        <span className="font-medium">{report.adminResponse}</span>
                        {report.reviewedDate && (
                          <div className="text-xs text-muted-foreground">
                            {report.reviewedDate}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No response yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Report Details - {selectedReport?.toolName}
                          </DialogTitle>
                          <DialogDescription>
                            Complete report information and administrative response
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedReport && (
                          <Tabs defaultValue="report" className="space-y-4">
                            <TabsList>
                              <TabsTrigger value="report">Report Details</TabsTrigger>
                              <TabsTrigger value="response">Admin Response</TabsTrigger>
                            </TabsList>

                            <TabsContent value="report" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Usage Details</Label>
                                  <div className="p-3 bg-muted rounded-lg space-y-1">
                                    <p><strong>Tool:</strong> {selectedReport.toolName}</p>
                                    <p><strong>Date Used:</strong> {selectedReport.dateOfUse}</p>
                                    <p><strong>Purpose:</strong> {selectedReport.purposeOfUse}</p>
                                    <p><strong>Location:</strong> {selectedReport.locationOfUse}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Report Information</Label>
                                  <div className="p-3 bg-muted rounded-lg space-y-1">
                                    <p><strong>Submitted:</strong> {selectedReport.submittedDate}</p>
                                    <p><strong>Status:</strong> {selectedReport.status}</p>
                                    <p><strong>Compliance Score:</strong> {selectedReport.complianceScore}%</p>
                                    <p><strong>Reviewed By:</strong> {selectedReport.reviewedBy || "Not reviewed yet"}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Steps Performed</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{selectedReport.stepsDescription}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Results & Output</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{selectedReport.outputsResults}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Policy Compliance</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2">
                                    {selectedReport.adheredToPolicy ? 
                                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    }
                                    <span className="text-sm">Adhered to Policy</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {selectedReport.stayedWithinScope ? 
                                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    }
                                    <span className="text-sm">Stayed Within Scope</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {selectedReport.noThirdPartySharing ? 
                                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    }
                                    <span className="text-sm">No Third Party Sharing</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {selectedReport.noMaliciousUse ? 
                                      <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                    }
                                    <span className="text-sm">No Malicious Use</span>
                                  </div>
                                </div>
                              </div>

                              {selectedReport.comments && (
                                <div className="space-y-2">
                                  <Label>Your Comments</Label>
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm">{selectedReport.comments}</p>
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="response" className="space-y-4">
                              {selectedReport.adminResponse ? (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Administrative Response</Label>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <p className="text-sm font-medium">{selectedReport.adminResponse}</p>
                                    </div>
                                  </div>

                                  {selectedReport.adminComment && (
                                    <div className="space-y-2">
                                      <Label>Detailed Comments</Label>
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm">{selectedReport.adminComment}</p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    <Label>Review Information</Label>
                                    <div className="p-3 bg-muted rounded-lg space-y-1">
                                      <p className="text-sm"><strong>Reviewed By:</strong> {selectedReport.reviewedBy}</p>
                                      <p className="text-sm"><strong>Review Date:</strong> {selectedReport.reviewedDate}</p>
                                      <p className="text-sm"><strong>Final Status:</strong> {selectedReport.status}</p>
                                    </div>
                                  </div>

                                  {selectedReport.status === "flagged" && (
                                    <Alert className="border-destructive">
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>
                                        This report has been flagged for compliance issues. Please review the admin comments and take appropriate action.
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-medium mb-2">Pending Review</h3>
                                  <p className="text-muted-foreground">
                                    Your report is currently under review by the administrative team. 
                                    You will be notified once a response is available.
                                  </p>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {reports.length === 0 
                  ? "You haven't submitted any usage reports yet." 
                  : "No reports match your current search criteria."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 