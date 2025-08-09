import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, CheckCircle, AlertTriangle, Clock, User, Calendar, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reportsService, UsageReport } from "@/firebase/services";



export default function UserReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<UsageReport | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [reports, setReports] = useState<UsageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Remove automatic loading - only load when user clicks refresh
  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await reportsService.getAllReports();
      setReports(reportsData);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading reports:", error);
      // No fallback data - keep empty array
      setReports([]);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleSubmitResponse = async () => {
    if (!selectedReport || !selectedReport.id) return;
    
    setIsSubmittingResponse(true);
    
    try {
      const status = adminResponse === "approved" ? "reviewed" : "flagged" as const;
      
      await reportsService.updateReport(selectedReport.id, {
        status,
        adminResponse,
        adminComment,
        reviewedBy: "Current Admin",
        reviewedDate: new Date().toISOString().split('T')[0]
      });
      
      // Update local state
      setReports(reports.map(r => r.id === selectedReport.id ? {
        ...r,
        status,
        adminResponse,
        adminComment,
        reviewedBy: "Current Admin",
        reviewedDate: new Date().toISOString().split('T')[0]
      } : r));
      
      setSelectedReport(null);
      setAdminResponse("");
      setAdminComment("");
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to update report. Please try again.");
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const statsData = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    reviewed: reports.filter(r => r.status === "reviewed").length,
    flagged: reports.filter(r => r.status === "flagged").length,
    avgCompliance: Math.round(reports.reduce((sum, r) => sum + r.complianceScore, 0) / reports.length)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Reports</h1>
            <p className="text-muted-foreground">Review and respond to user tool usage reports</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-medium">Loading reports...</h3>
                <p className="text-muted-foreground">Please wait while we fetch the reports.</p>
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
          <h1 className="text-3xl font-bold text-foreground">User Reports</h1>
          <p className="text-muted-foreground">Review and respond to user tool usage reports</p>
        </div>
        <div className="flex gap-2">
          {!dataLoaded && (
            <Button onClick={loadReports} disabled={loading}>
              {loading ? "Loading..." : "Load Reports"}
            </Button>
          )}
          {dataLoaded && (
            <Button onClick={loadReports} disabled={loading} variant="outline">
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
                placeholder="Search by user name, email, or tool..."
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
          <CardTitle>Usage Reports</CardTitle>
          <CardDescription>
            Review user tool usage reports and provide administrative responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Date Used</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{report.userName}</div>
                      <div className="text-sm text-muted-foreground">{report.userEmail}</div>
                    </div>
                  </TableCell>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Usage Report Review - {selectedReport?.toolName}
                          </DialogTitle>
                          <DialogDescription>
                            Review and respond to {selectedReport?.userName  || "this user"}'s tool usage report
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
                                  <Label>User Information</Label>
                                  <div className="p-3 bg-muted rounded-lg space-y-1">
                                    <p><strong>Name:</strong> {selectedReport.userName}</p>
                                    <p><strong>Email:</strong> {selectedReport.userEmail}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Usage Details</Label>
                                  <div className="p-3 bg-muted rounded-lg space-y-1">
                                    <p><strong>Tool:</strong> {selectedReport.toolName}</p>
                                    <p><strong>Date Used:</strong> {selectedReport.dateOfUse}</p>
                                    <p><strong>Purpose:</strong> {selectedReport.purposeOfUse}</p>
                                    <p><strong>Location:</strong> {selectedReport.locationOfUse}</p>
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
                                  <Label>User Comments</Label>
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm">{selectedReport.comments}</p>
                                  </div>
                                </div>
                              )}

                              {selectedReport.status !== "pending" && selectedReport.adminResponse && (
                                <div className="space-y-2">
                                  <Label>Previous Admin Response</Label>
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                    <p className="text-sm"><strong>Response:</strong> {selectedReport.adminResponse}</p>
                                    <p className="text-sm"><strong>Comment:</strong> {selectedReport.adminComment}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Reviewed by {selectedReport.reviewedBy} on {selectedReport.reviewedDate}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="response" className="space-y-4">
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="adminResponse">Administrative Response</Label>
                                  <Select value={adminResponse} onValueChange={setAdminResponse}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select response type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="approved">Approved - Compliant Usage</SelectItem>
                                      <SelectItem value="approved-with-notes">Approved with Notes</SelectItem>
                                      <SelectItem value="requires-clarification">Requires Clarification</SelectItem>
                                      <SelectItem value="non-compliant">Non-Compliant Usage</SelectItem>
                                      <SelectItem value="policy-violation">Policy Violation</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="adminComment">Detailed Comments</Label>
                                  <Textarea
                                    id="adminComment"
                                    placeholder="Provide detailed feedback, recommendations, or follow-up actions..."
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    className="min-h-32"
                                  />
                                </div>

                                {adminResponse === "non-compliant" || adminResponse === "policy-violation" && (
                                  <Alert className="border-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      This response will flag the report for compliance review and may trigger additional security procedures.
                                    </AlertDescription>
                                  </Alert>
                                )}

                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={handleSubmitResponse}
                                    disabled={!adminResponse || isSubmittingResponse}
                                    className="flex-1"
                                  >
                                    {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedReport(null);
                                      setAdminResponse("");
                                      setAdminComment("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
