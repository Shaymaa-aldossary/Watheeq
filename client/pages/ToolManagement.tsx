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
import { Switch } from "@/components/ui/switch";
import { Settings, Plus, Edit, Trash2, Search, Download, Shield, AlertTriangle, CheckCircle, Users, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toolsService, Tool } from "@/firebase/services";

interface ToolWithStats extends Tool {
  isActive: boolean;
  approvedUsers: number;
  totalUsage: number;
  lastUpdated: string;
  cveCount: number;
  vulnerabilityScore: number;
}

export default function ToolManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [newTool, setNewTool] = useState({
    name: "",
    description: "",
    category: "",
    version: "",
    securityLevel: "medium" as const,
    environment: "virtual" as const,
    downloadUrl: "",
    webInterface: "",
    documentation: ""
  });

  // Tools data from Firebase
  const [tools, setTools] = useState<ToolWithStats[]>([]);

  // Get unique categories for filtering
  const categories = ["all", ...Array.from(new Set(tools.map(tool => tool.category).filter(category => category && category.trim() !== "")))];

  // Filter tools based on search and category
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Remove automatic loading - only load when user clicks refresh
  const loadTools = async () => {
    try {
      setLoading(true);
      const toolsData = await toolsService.getAllTools();
      // Convert Tool to ToolWithStats with default values
      const toolsWithStats: ToolWithStats[] = toolsData.map(tool => ({
        ...tool,
        isActive: tool.isApproved || false,
        approvedUsers: 0,
        totalUsage: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        cveCount: 0,
        vulnerabilityScore: 0
      }));
      setTools(toolsWithStats);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading tools:", error);
      // Fallback to mock data if Firebase fails
      setTools([
        {
          id: "1",
          name: "Nmap",
          description: "Network discovery and security auditing tool",
          category: "Network Security",
          version: "7.94",
          securityLevel: "medium",
          environment: "production",
          isApproved: true,
          isActive: true,
          approvedUsers: 15,
          totalUsage: 234,
          lastUpdated: "2024-01-15",
          downloadUrl: "https://nmap.org/download.html",
          webInterface: "https://nmap-web.company.local",
          documentation: "Network mapping and port scanning tool. Use responsibly on authorized networks only.",
          cveCount: 2,
          vulnerabilityScore: 6.5
        },
        {
          id: "2",
          name: "Wireshark", 
          description: "Network protocol analyzer for packet inspection",
          category: "Network Security",
          version: "4.2.0",
          securityLevel: "low",
          environment: "production",
          isApproved: true,
          isActive: true,
          approvedUsers: 12,
          totalUsage: 187,
          lastUpdated: "2024-01-12",
          downloadUrl: "https://www.wireshark.org/download.html",
          documentation: "Packet capture and analysis tool. Ensure compliance with data privacy policies.",
          cveCount: 1,
          vulnerabilityScore: 3.2
        }
      ]);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTool = async () => {
    try {
      const toolData = {
        ...newTool,
        isApproved: true,
        lastUsed: new Date().toISOString().split('T')[0],
        usageCount: 0
      };

      await toolsService.createTool(toolData);

      // Reset form
      setNewTool({
        name: "",
        description: "",
        category: "",
        version: "",
        securityLevel: "medium",
        environment: "virtual",
        downloadUrl: "",
        webInterface: "",
        documentation: ""
      });

      setIsAddingTool(false);
      loadTools(); // Refresh the list
    } catch (error) {
      console.error("Error adding tool:", error);
      alert("Failed to add tool. Please try again.");
    }
  };

  const handleEditTool = async (tool: ToolWithStats) => {
    try {
      const toolData = {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        version: tool.version,
        securityLevel: tool.securityLevel,
        environment: tool.environment,
        downloadUrl: tool.downloadUrl,
        webInterface: tool.webInterface,
        documentation: tool.documentation
      };

      await toolsService.updateTool(tool.id, toolData);
      setEditingTool(null);
      loadTools(); // Refresh the list
    } catch (error) {
      console.error("Error updating tool:", error);
      alert("Failed to update tool. Please try again.");
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;

    try {
      await toolsService.deleteTool(id);
      loadTools(); // Refresh the list
    } catch (error) {
      console.error("Error deleting tool:", error);
      alert("Failed to delete tool. Please try again.");
    }
  };

  const toggleToolStatus = async (id: string) => {
    try {
      const tool = tools.find(t => t.id === id);
      if (!tool) return;

      await toolsService.updateTool(id, { isApproved: !tool.isActive });
      loadTools(); // Refresh the list
    } catch (error) {
      console.error("Error toggling tool status:", error);
      alert("Failed to update tool status. Please try again.");
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

  const getVulnerabilityBadge = (score: number) => {
    if (score === 0) return <Badge variant="secondary">No CVEs</Badge>;
    if (score < 4) return <Badge variant="outline">Low</Badge>;
    if (score < 7) return <Badge variant="default">Medium</Badge>;
    return <Badge variant="destructive">High</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tool Management</h1>
            <p className="text-muted-foreground">Manage security tools, permissions, and configurations</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto animate-spin" />
              <div>
                <h3 className="text-lg font-medium">Loading tools...</h3>
                <p className="text-muted-foreground">Please wait while we fetch the tools.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Tool Management</h1>
          <p className="text-muted-foreground">Manage security tools, permissions, and configurations</p>
        </div>
        <div className="flex gap-2">
          {!dataLoaded && (
            <Button onClick={loadTools} disabled={loading}>
              {loading ? "Loading..." : "Load Tools"}
            </Button>
          )}
          {dataLoaded && (
            <Button onClick={loadTools} disabled={loading} variant="outline">
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          )}
          <Dialog open={isAddingTool} onOpenChange={setIsAddingTool}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Security Tool</DialogTitle>
                <DialogDescription>
                  Configure a new tool for security team usage
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tool Name *</Label>
                    <Input
                      id="name"
                      value={newTool.name}
                      onChange={(e) => setNewTool({...newTool, name: e.target.value})}
                      placeholder="e.g., Nmap, Burp Suite"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version *</Label>
                    <Input
                      id="version"
                      value={newTool.version}
                      onChange={(e) => setNewTool({...newTool, version: e.target.value})}
                      placeholder="e.g., 7.94"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newTool.description}
                    onChange={(e) => setNewTool({...newTool, description: e.target.value})}
                    placeholder="Brief description of the tool's purpose"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={newTool.category}
                      onChange={(e) => setNewTool({...newTool, category: e.target.value})}
                      placeholder="e.g., Network Security"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Security Level</Label>
                    <Select value={newTool.securityLevel} onValueChange={(value: any) => setNewTool({...newTool, securityLevel: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Environment</Label>
                    <Select value={newTool.environment} onValueChange={(value: any) => setNewTool({...newTool, environment: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="virtual">Virtual</SelectItem>
                        <SelectItem value="isolated">Isolated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="downloadUrl">Download URL (Optional)</Label>
                    <Input
                      id="downloadUrl"
                      value={newTool.downloadUrl}
                      onChange={(e) => setNewTool({...newTool, downloadUrl: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webInterface">Web Interface (Optional)</Label>
                    <Input
                      id="webInterface"
                      value={newTool.webInterface}
                      onChange={(e) => setNewTool({...newTool, webInterface: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentation">Documentation (Optional)</Label>
                  <Textarea
                    id="documentation"
                    value={newTool.documentation}
                    onChange={(e) => setNewTool({...newTool, documentation: e.target.value})}
                    placeholder="Additional documentation or usage notes"
                  />
                </div>

                <div className="flex gap-2 pt-6 border-t">
                  <Button 
                    onClick={handleAddTool}
                    className="flex-1"
                    size="lg"
                  >
                    Add Tool
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsAddingTool(false)}
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tools..."
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

      {/* Tools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Tools Overview</CardTitle>
          <CardDescription>
            Manage all security tools, their permissions, and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>CVEs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">v{tool.version}</div>
                    </div>
                  </TableCell>
                  <TableCell>{tool.category}</TableCell>
                  <TableCell>{getSecurityBadge(tool.securityLevel)}</TableCell>
                  <TableCell>{getEnvironmentBadge(tool.environment)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {tool.approvedUsers}
                    </div>
                  </TableCell>
                  <TableCell>{tool.totalUsage}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{getVulnerabilityBadge(tool.vulnerabilityScore)}</div>
                      {tool.cveCount > 0 && (
                        <div className="text-xs text-muted-foreground">{tool.cveCount} CVEs</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tool.isActive}
                        onCheckedChange={() => toggleToolStatus(tool.id)}
                      />
                      <span className="text-sm">
                        {tool.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTool(tool)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          {editingTool && (
                            <div className="space-y-4">
                              <DialogHeader>
                                <DialogTitle>Edit Tool: {editingTool.name}</DialogTitle>
                                <DialogDescription>
                                  Update tool configuration and settings
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Name</Label>
                                  <Input
                                    value={editingTool.name}
                                    onChange={(e) => setEditingTool({...editingTool, name: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Version</Label>
                                  <Input
                                    value={editingTool.version}
                                    onChange={(e) => setEditingTool({...editingTool, version: e.target.value})}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={editingTool.description}
                                  onChange={(e) => setEditingTool({...editingTool, description: e.target.value})}
                                />
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button onClick={() => handleEditTool(editingTool)} className="flex-1">
                                  Save Changes
                                </Button>
                                <Button variant="outline" onClick={() => setEditingTool(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTool(tool.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tools.length}</div>
            <p className="text-xs text-muted-foreground">
              {tools.filter(t => t.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Tools</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {tools.filter(t => t.securityLevel === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">Require special handling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools.reduce((sum, tool) => sum + tool.approvedUsers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all tools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CVE Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tools.reduce((sum, tool) => sum + tool.cveCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active vulnerabilities</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}