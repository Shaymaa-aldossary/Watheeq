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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Clock, CheckCircle, XCircle, AlertTriangle, Settings, FileText, Search, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toolRequestsService } from "@/firebase/services";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface ToolRequest {
  id: string;
  alertSent: true,
  userId: string;
  userName: string;
  userEmail: string;
  toolName: string;
  purpose: string;
  environment: string;
  duration: string;
  justification: string;
  alternativesConsidered: string;
  riskAssessment: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  adminComment?: string;
  securityInstructions?: string;
  approvedEnvironment?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

export default function UserRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ToolRequest | null>(null);
  const [adminDecision, setAdminDecision] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [securityInstructions, setSecurityInstructions] = useState("");
  const [approvedEnvironment, setApprovedEnvironment] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ToolRequest[]>([]);

  

  // Load tool requests from Firebase
  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsData = await toolRequestsService.getAllRequests();
      setRequests(requestsData);
    } catch (error) {
      console.error("Error loading tool requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Load requests on component mount
  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline">Pending Review</Badge>;
      case "approved": return <Badge variant="default">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getEnvironmentBadge = (env: string) => {
    switch (env) {
      case "production": return <Badge variant="default">Production</Badge>;
      case "virtual": return <Badge variant="outline">Virtual</Badge>;
      case "isolated": return <Badge variant="destructive">Isolated</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest) return;
    
    setIsSubmittingDecision(true);
    
    try {
      console.log("Submitting decision for request:", selectedRequest.id);
      console.log("Admin decision:", adminDecision);
      console.log("Admin comment:", adminComment);
      //من هنا تغيير الاتنبيهات النتاخرة
      const updatedRequest = {
        status: adminDecision as "approved" | "rejected",
        adminResponse: adminDecision,
        adminComment: adminComment,
        securityInstructions: adminDecision === "approved" ? securityInstructions : undefined,
        approvedEnvironment: adminDecision === "approved" ? approvedEnvironment : undefined,
        reviewedBy: "Current Admin",
        reviewedDate: new Date().toISOString().split('T')[0],
        ...(adminDecision === "approved" && {
          approvedAt: new Date().toISOString(),
          reportSubmitted: false
        })
      };
            //من هنا نهاية تغيير الاتنبيهات النتاخرة

      console.log("Update data being sent:", updatedRequest);
      
      // Update the request in Firebase
      await toolRequestsService.updateRequest(selectedRequest.id, updatedRequest);
      
      console.log("Request updated successfully, updating local state...");
      
      // Update local state
      setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, ...updatedRequest } : r));
      setSelectedRequest(null);
      setAdminDecision("");
      setAdminComment("");
      setSecurityInstructions("");
      setApprovedEnvironment("");
      
      console.log("Decision submitted successfully!");
    } catch (error) {
      console.error("Error updating request:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to update request: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const statsData = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Requests</h1>
            <p className="text-muted-foreground">Review and approve user requests for new security tools</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-medium">Loading requests...</h3>
                <p className="text-muted-foreground">Please wait while we fetch the tool requests.</p>
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
          <h1 className="text-3xl font-bold text-foreground">User Requests</h1>
          <p className="text-muted-foreground">Review and approve user requests for new security tools</p>
        </div>

      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
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
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsData.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsData.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user name, email, or tool..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Access Requests</CardTitle>
          <CardDescription>
            Review user requests for new security tools and provide approval decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tool Requested</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{request.userName}</div>
                      <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {request.toolName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate" title={request.purpose}>
                      {request.purpose}
                    </div>
                  </TableCell>
                  <TableCell>{getEnvironmentBadge(request.environment)}</TableCell>
                  <TableCell>{request.duration.replace("-", " ")}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Tool Request Review - {selectedRequest?.toolName}
                          </DialogTitle>
                          <DialogDescription>
                            Review and decide on {selectedRequest?.userName}'s tool access request
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedRequest && (
                          <Tabs defaultValue="request" className="space-y-4">
                            <TabsList>
                              <TabsTrigger value="request">Request Details</TabsTrigger>
                              <TabsTrigger value="decision">Admin Decision</TabsTrigger>
                            </TabsList>

                            <TabsContent value="request" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Requestor Information</Label>
                                  <div className="p-3 bg-muted rounded-lg space-y-1">
                                    <p><strong>Name:</strong> {selectedRequest.userName}</p>
                                    <p><strong>Email:</strong> {selectedRequest.userEmail}</p>
                                    <p><strong>Request Date:</strong> {selectedRequest.requestDate}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Tool Requirements</Label>
                                  <div className="p-3 bg-muted rounded-lg space-y-1">
                                    <p><strong>Tool:</strong> {selectedRequest.toolName}</p>
                                    <p><strong>Environment:</strong> {selectedRequest.environment}</p>
                                    <p><strong>Duration:</strong> {selectedRequest.duration.replace("-", " ")}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Purpose of Use</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{selectedRequest.purpose}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Business Justification</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{selectedRequest.justification}</p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Alternatives Considered</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">
                                    {selectedRequest.alternativesConsidered || "Not specified"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Risk Assessment</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">
                                    {selectedRequest.riskAssessment || "Not provided"}
                                  </p>
                                </div>
                              </div>

                              {selectedRequest.status !== "pending" && selectedRequest.adminResponse && (
                                <div className="space-y-2">
                                  <Label>Previous Admin Decision</Label>
                                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                                    <p className="text-sm">
                                      <strong>Decision:</strong> {selectedRequest.adminResponse === "approved" ? "Approved" : "Rejected"}
                                    </p>
                                    <p className="text-sm"><strong>Comment:</strong> {selectedRequest.adminComment}</p>
                                    {selectedRequest.securityInstructions && (
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium">Security Instructions:</p>
                                        <pre className="text-xs bg-white p-2 rounded border whitespace-pre-wrap">
                                          {selectedRequest.securityInstructions}
                                        </pre>
                                      </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Reviewed by {selectedRequest.reviewedBy} on {selectedRequest.reviewedDate}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="decision" className="space-y-4">
                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <Label>Administrative Decision</Label>
                                  <RadioGroup value={adminDecision} onValueChange={setAdminDecision}>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="approved" id="approved" />
                                      <Label htmlFor="approved">Approve Request</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="rejected" id="rejected" />
                                      <Label htmlFor="rejected">Reject Request</Label>
                                    </div>
                                  </RadioGroup>
                                </div>

                                {adminDecision === "approved" && (
                                  <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="space-y-2">
                                      <Label>Approved Environment</Label>
                                      <Select value={approvedEnvironment} onValueChange={setApprovedEnvironment}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select environment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="production">Production Environment</SelectItem>
                                          <SelectItem value="virtual">Virtual Environment</SelectItem>
                                          <SelectItem value="isolated">Isolated Environment</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="securityInstructions">Security Instructions</Label>
                                      <Textarea
                                        id="securityInstructions"
                                        placeholder="Provide detailed security instructions and usage guidelines..."
                                        value={securityInstructions}
                                        onChange={(e) => setSecurityInstructions(e.target.value)}
                                        className="min-h-32"
                                      />
                                    </div>

                                    <Alert>
                                      <Shield className="h-4 w-4" />
                                      <AlertDescription>
                                        User will receive detailed security instructions and must acknowledge compliance before tool access is granted.
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label htmlFor="adminComment">Admin Comments</Label>
                                  <Textarea
                                    id="adminComment"
                                    placeholder="Provide feedback, reasoning for decision, or additional requirements..."
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    className="min-h-24"
                                  />
                                </div>

                                {adminDecision === "rejected" && adminComment.trim().length < 3 && (
                                  <Alert className="border-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      Please provide a brief reason for rejection (at least 3 characters).
                                    </AlertDescription>
                                  </Alert>
                                )}

                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    onClick={handleSubmitDecision}
                                    disabled={!adminDecision || (adminDecision === "rejected" && adminComment.trim().length < 3) || isSubmittingDecision}
                                    className="flex-1"
                                  >
                                    {isSubmittingDecision ? "Submitting..." : "Submit Decision"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedRequest(null);
                                      setAdminDecision("");
                                      setAdminComment("");
                                      setSecurityInstructions("");
                                      setApprovedEnvironment("");
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
