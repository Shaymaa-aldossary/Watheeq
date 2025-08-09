import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, Search, Download, ExternalLink, Shield, AlertTriangle, CheckCircle, Clock, FileText, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { toolsService, Tool, toolRequestsService } from "@/firebase/services";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export default function AvailableTools() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [isLaunching, setIsLaunching] = useState<string | null>(null);
  const [usageNotes, setUsageNotes] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auto-load tools when component mounts
  useEffect(() => {
    loadTools();
  }, []);

  // Tool request form state
  const [isRequestingTool, setIsRequestingTool] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({
    toolName: "",
    purpose: "",
    environment: "",
    duration: "",
    justification: "",
    alternativesConsidered: "",
    riskAssessment: ""
  });

  // Get unique categories for filtering - filter out empty/null/undefined values
  const categories = ["all", ...Array.from(new Set(
    tools
      .map(tool => tool.category)
      .filter(category => category && category.trim() !== "")
  ))];

  // Filter tools based on search and category
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Load all tools from Firebase tools collection
  const loadTools = async () => {
    try {
      setLoading(true);
      console.log("Loading all tools from Firebase tools collection...");

      const toolsSnapshot = await getDocs(collection(db, "tools"));
      const toolsData = [];

      toolsSnapshot.forEach((doc) => {
        const toolData = doc.data();
        toolsData.push({
          id: doc.id,
          name: toolData.name || "",
          description: toolData.description || "",
          category: toolData.category || "",
          version: toolData.version || "1.0.0",
          securityLevel: toolData.securityLevel || "medium",
          environment: toolData.environment || "production",
          isApproved: toolData.isApproved || false,
          documentation: toolData.documentation || "",
          downloadUrl: toolData.downloadUrl || "",
          webInterface: toolData.webInterface || ""
        });
      });

      console.log("Tools loaded from Firebase:", toolsData);

      if (toolsData && toolsData.length > 0) {
        setTools(toolsData);
        console.log("Successfully loaded", toolsData.length, "tools from Firebase");
      } else {
        console.log("No tools found in Firebase tools collection");
        setTools([]);
      }
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading tools:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      setTools([]);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityBadge = (level: string) => {
    switch (level) {
      case "low": return <Badge variant="outline">Low Risk</Badge>;
      case "medium": return <Badge variant="default">Medium Risk</Badge>;
      case "high": return <Badge variant="destructive">High Risk</Badge>;
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

  const handleToolLaunch = async (tool: Tool) => {
    try {
      setIsLaunching(tool.id);

      // Simulate tool launch
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update usage count - skip for now since these properties don't exist in Tool type
      // await toolsService.updateTool(tool.id, {
      //   usageCount: (tool.usageCount || 0) + 1,
      //   lastUsed: new Date().toISOString().split('T')[0]
      // });

      // Refresh tools list
      loadTools();

      alert(`Successfully launched ${tool.name}!`);
    } catch (error) {
      console.error("Error launching tool:", error);
      alert("Failed to launch tool. Please try again.");
    } finally {
      setIsLaunching(null);
    }
  };

  const handleToolRequest = async () => {
    if (!user) {
      alert("Please log in to request tools.");
      return;
    }

    if (!requestForm.toolName || !requestForm.purpose || !requestForm.environment || !requestForm.duration || !requestForm.justification) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmittingRequest(true);

      await toolRequestsService.createRequest({
        userId: user.id || user.email || "unknown",
        userName: user.name || user.email || "Unknown User",
        userEmail: user.email || "unknown@example.com",
        toolName: requestForm.toolName,
        purpose: requestForm.purpose,
        environment: requestForm.environment,
        duration: requestForm.duration,
        justification: requestForm.justification,
        alternativesConsidered: requestForm.alternativesConsidered,
        riskAssessment: requestForm.riskAssessment,
        status: "pending",
        alertSent: false
      });

      // Reset form
      setRequestForm({
        toolName: "",
        purpose: "",
        environment: "",
        duration: "",
        justification: "",
        alternativesConsidered: "",
        riskAssessment: ""
      });

      setIsRequestingTool(false);
    } catch (error) {
      console.error("Error submitting tool request:", error);
      alert("Failed to submit tool request. Please try again.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Available Tools</h1>
            <p className="text-muted-foreground">Access your approved security tools and track usage</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-medium">Loading tools...</h3>
                <p className="text-muted-foreground">Please wait while we fetch your available tools.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Available Tools</h1>
          <p className="text-muted-foreground">Access your approved security tools and track usage</p>
        </div>
                 <div className="flex gap-2">
           <Button onClick={loadTools} disabled={loading}>
             {loading ? "Loading..." : "Load Tools"}
           </Button>
           {dataLoaded && (
             <Button onClick={loadTools} disabled={loading} variant="outline">
               {loading ? "Refreshing..." : "Refresh"}
             </Button>
           )}

          <Dialog open={isRequestingTool} onOpenChange={setIsRequestingTool}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request New Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Request New Security Tool
                </DialogTitle>
                <DialogDescription>
                  Submit a request for approval to use a new security tool
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="toolName">Tool Name *</Label>
                  <Input
                    id="toolName"
                    placeholder="e.g., Metasploit, Sqlmap, John the Ripper"
                    value={requestForm.toolName}
                    onChange={(e) => setRequestForm({...requestForm, toolName: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Use *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe what you plan to use this tool for (e.g., penetration testing, vulnerability assessment, network analysis)"
                    value={requestForm.purpose}
                    onChange={(e) => setRequestForm({...requestForm, purpose: e.target.value})}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Environment *</Label>
                    <RadioGroup
                      value={requestForm.environment}
                      onValueChange={(value) => setRequestForm({...requestForm, environment: value})}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="production" id="production" />
                        <Label htmlFor="production" className="text-sm">Production Environment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="testing" id="testing" />
                        <Label htmlFor="testing" className="text-sm">Testing Environment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="virtual" id="virtual" />
                        <Label htmlFor="virtual" className="text-sm">Virtual Environment</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="isolated" id="isolated" />
                        <Label htmlFor="isolated" className="text-sm">Isolated Network</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration Needed *</Label>
                    <Select value={requestForm.duration} onValueChange={(value) => setRequestForm({...requestForm, duration: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-week">1 Week</SelectItem>
                        <SelectItem value="2-weeks">2 Weeks</SelectItem>
                        <SelectItem value="1-month">1 Month</SelectItem>
                        <SelectItem value="3-months">3 Months</SelectItem>
                        <SelectItem value="6-months">6 Months</SelectItem>
                        <SelectItem value="permanent">Permanent Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification">Business Justification *</Label>
                  <Textarea
                    id="justification"
                    placeholder="Explain why this tool is necessary for your work, what specific capabilities it provides, and how it will be used in your security assessments."
                    value={requestForm.justification}
                    onChange={(e) => setRequestForm({...requestForm, justification: e.target.value})}
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternativesConsidered">Alternatives Considered</Label>
                  <Textarea
                    id="alternativesConsidered"
                    placeholder="List any alternative tools you've considered and why they don't meet your needs"
                    value={requestForm.alternativesConsidered}
                    onChange={(e) => setRequestForm({...requestForm, alternativesConsidered: e.target.value})}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskAssessment">Risk Assessment</Label>
                  <Textarea
                    id="riskAssessment"
                    placeholder="Describe any potential risks associated with using this tool and how you plan to mitigate them"
                    value={requestForm.riskAssessment}
                    onChange={(e) => setRequestForm({...requestForm, riskAssessment: e.target.value})}
                    className="min-h-24"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={handleToolRequest}
                    disabled={isSubmittingRequest}
                    className="flex-1"
                    size="lg"
                  >
                    {isSubmittingRequest ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsRequestingTool(false)}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search tools</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search tools by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {tool.name}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {getSecurityBadge(tool.securityLevel)}
                {getEnvironmentBadge(tool.environment)}
                <Badge variant="outline">v{tool.version}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Used:</span>
                  <span>Never</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage Count:</span>
                  <span>0 times</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{tool.category}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedTool(tool)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {selectedTool?.name}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedTool?.description}
                      </DialogDescription>
                    </DialogHeader>

                    {selectedTool && (
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="details">Details</TabsTrigger>
                          <TabsTrigger value="usage">Usage</TabsTrigger>
                          <TabsTrigger value="security">Security</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Version</Label>
                              <div>v{selectedTool.version}</div>
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <div>{selectedTool.category}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Environment</Label>
                            <div>{getEnvironmentBadge(selectedTool.environment)}</div>
                          </div>
                          <div className="space-y-2">
                            <Label>Security Level</Label>
                            <div>{getSecurityBadge(selectedTool.securityLevel)}</div>
                          </div>
                          <div className="space-y-2">
                            <Label>Documentation</Label>
                            <p className="text-sm text-muted-foreground">
                              {selectedTool.documentation}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="usage" className="space-y-4">
                                                      <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Last Used</Label>
                                <div>Never</div>
                              </div>
                              <div className="space-y-2">
                                <Label>Usage Count</Label>
                                <div>0 times</div>
                              </div>
                            </div>

                          <div className="space-y-2">
                            <Label htmlFor="usageNotes">Usage Notes</Label>
                            <Textarea
                              id="usageNotes"
                              placeholder="Add notes about your intended use of this tool..."
                              value={usageNotes}
                              onChange={(e) => setUsageNotes(e.target.value)}
                            />
                          </div>

                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Remember to submit a usage report after using this tool to maintain compliance.
                            </AlertDescription>
                          </Alert>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-4">
                          <Alert className={selectedTool.securityLevel === "high" ? "border-destructive" : ""}>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Security Level: {selectedTool.securityLevel.toUpperCase()}</strong>
                              <br />
                              {selectedTool.securityLevel === "high" && 
                                "This tool requires isolated environment and additional security measures."
                              }
                              {selectedTool.securityLevel === "medium" && 
                                "This tool requires careful usage and monitoring. Follow all security guidelines."
                              }
                              {selectedTool.securityLevel === "low" && 
                                "This tool has minimal security restrictions but still requires responsible usage."
                              }
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-2">
                            <Label>Environment Requirements</Label>
                            <p className="text-sm">
                              This tool must be used in: <strong>{selectedTool.environment}</strong> environment
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Security Guidelines</Label>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              <li>Only use on authorized targets</li>
                              <li>Follow company security policies</li>
                              <li>Do not share outputs with unauthorized parties</li>
                              {selectedTool.securityLevel === "high" && (
                                <li>Additional approval required for sensitive operations</li>
                              )}
                            </ul>
                          </div>
                        </TabsContent>

                        <div className="flex gap-2 pt-4">
                          {selectedTool.downloadUrl && (
                            <Button variant="outline" onClick={() => window.open(selectedTool.downloadUrl, '_blank')}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                        </div>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No tools found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or request access to new tools.
                </p>
              </div>
              <Button onClick={() => setIsRequestingTool(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Request New Tool
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
