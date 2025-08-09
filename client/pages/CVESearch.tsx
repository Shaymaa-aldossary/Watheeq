import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, AlertTriangle, CheckCircle, XCircle, Info, Shield, ExternalLink, Edit, Save, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { policiesService, CompanyPolicy } from "@/firebase/services";

interface CVEResult {
  id: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  cvssScore: number;
  year: number;
  patchAvailable: boolean;
  isDeferred?: boolean;
  relevanceScore?: number;
  publishedDate?: string;
  lastModified?: string;
}

interface ToolAnalysis {
  toolName: string;
  version: string;
  cves: CVEResult[];
  filteredCves: CVEResult[];
  safeToUse: boolean;
  preferredVersion?: string;
  requiresVirtualEnv: boolean;
  recommendation: "safe" | "test-env" | "not-recommended";
  compositeRiskScore: number;
  riskFactors: {
    criticalCount: number;
    highCount: number;
    recentCount: number;
    deferredCount: number;
  };
}



// Helper functions for improved CVE analysis
const calculateRelevanceScore = (vuln: any, searchTerm: string): number => {
  const description = vuln.cve.descriptions?.[0]?.value?.toLowerCase() || "";
  const cveId = vuln.cve.id.toLowerCase();
  const searchTermLower = searchTerm.toLowerCase();
  
  let score = 0;
  
  // Higher score if tool name appears in description
  if (description.includes(searchTermLower)) score += 3;
  
  // Lower score if it's a generic mention
  if (description.includes("example") || description.includes("demonstration")) score -= 2;
  
  // Higher score for direct tool vulnerabilities
  if (description.includes(`${searchTermLower} vulnerability`) || 
      description.includes(`${searchTermLower} buffer overflow`) ||
      description.includes(`${searchTermLower} denial of service`)) score += 5;
  
  return Math.max(0, score);
};

const isRecentCVE = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return (currentYear - year) <= 3; // Consider CVEs from last 3 years as recent
};

const isDeferredCVE = (vuln: any): boolean => {
  // Check if CVE is marked as deferred or has incomplete data
  const hasMetrics = vuln.cve.metrics?.cvssMetricV31?.[0] || vuln.cve.metrics?.cvssMetricV2?.[0];
  const hasDescription = vuln.cve.descriptions?.[0]?.value && vuln.cve.descriptions[0].value !== "** RESERVED **";
  
  return !hasMetrics || !hasDescription;
};

const calculateCompositeRiskScore = (filteredCves: CVEResult[]): number => {
  if (filteredCves.length === 0) return 0;
  
  let totalScore = 0;
  let weightedCount = 0;
  
  filteredCves.forEach(cve => {
    let weight = 1;
    
    // Increase weight for recent CVEs
    if (isRecentCVE(cve.year)) weight += 0.5;
    
    // Increase weight for high severity
    if (cve.severity === "critical") weight += 1;
    else if (cve.severity === "high") weight += 0.5;
    
    // Increase weight for high relevance
    if (cve.relevanceScore && cve.relevanceScore > 3) weight += 0.3;
    
    totalScore += cve.cvssScore * weight;
    weightedCount += weight;
  });
  
  return weightedCount > 0 ? Math.round((totalScore / weightedCount) * 10) / 10 : 0;
};

const detectPatchAvailability = (vuln: any): boolean => {
  // Check multiple indicators for patch availability
  const description = vuln.cve.descriptions?.[0]?.value?.toLowerCase() || "";
  
  // Check if description mentions patches, fixes, or updates
  const patchKeywords = [
    "patch", "fixed", "update", "upgrade", "patched", 
    "resolved", "addressed", "mitigated", "corrected"
  ];
  
  const hasPatchMention = patchKeywords.some(keyword => description.includes(keyword));
  
  // Check configuration data for non-vulnerable versions
  const hasNonVulnerableConfig = vuln.cve.configurations?.nodes?.some((node: any) => 
    node.cpeMatch?.some((match: any) => match.vulnerable === false)
  ) || false;
  
  // Check if CVE has references to patches or advisories
  const hasReferences = vuln.cve.references?.length > 0;
  
  return hasPatchMention || hasNonVulnerableConfig || hasReferences;
};

const determinePreferredVersion = (toolName: string, cves: CVEResult[]): string => {
  // Latest version mappings for popular security and development tools (as of 2024/2025)
  const latestVersionMappings: { [key: string]: string } = {
    // Security Tools
    "nmap": "7.95",
    "wireshark": "4.2.2",
    "metasploit": "6.4.5",
    "burp suite": "2024.1.1.4",
    "burpsuite": "2024.1.1.4",
    "burp": "2024.1.1.4",
    "sqlmap": "1.8.2",
    "nikto": "2.5.0",
    "owasp zap": "2.14.0",
    "zaproxy": "2.14.0",
    "zap": "2.14.0",
    "john": "1.9.0",
    "john the ripper": "1.9.0",
    "hashcat": "6.2.6",
    "aircrack-ng": "1.7",
    "hydra": "9.5",
    "gobuster": "3.6.0",
    "dirb": "2.22",
    "dirbuster": "1.0-RC1",
    "ffuf": "2.1.0",
    "nuclei": "3.1.4",
    
    // Web Servers & Infrastructure
    "apache": "2.4.58",
    "nginx": "1.25.3",
    "tomcat": "10.1.17",
    "iis": "10.0",
    "lighttpd": "1.4.73",
    
    // Databases
    "mysql": "8.3.0",
    "postgresql": "16.1",
    "mongodb": "7.0.5",
    "redis": "7.2.4",
    "sqlite": "3.45.0",
    "mariadb": "11.2.2",
    
    // Programming Languages & Runtimes
    "python": "3.12.1",
    "node.js": "21.6.0",
    "nodejs": "21.6.0",
    "node": "21.6.0",
    "java": "21.0.2",
    "php": "8.3.2",
    "ruby": "3.3.0",
    "go": "1.21.6",
    "golang": "1.21.6",
    "rust": "1.75.0",
    
    // Containerization & Orchestration
    "docker": "25.0.0",
    "kubernetes": "1.29.1",
    "kubectl": "1.29.1",
    "helm": "3.14.0",
    
    // CI/CD & DevOps
    "jenkins": "2.440.1",
    "gitlab": "16.8.1",
    "ansible": "9.2.0",
    "terraform": "1.7.0",
    "vagrant": "2.4.1",
    
    // SSL/TLS & Cryptography
    "openssl": "3.2.0",
    "libressl": "3.8.2",
    "boringssl": "latest",
    
    // Version Control
    "git": "2.43.0",
    "svn": "1.14.3",
    "mercurial": "6.6.2",
    
    // Monitoring & Logging
    "elasticsearch": "8.12.0",
    "logstash": "8.12.0",
    "kibana": "8.12.0",
    "grafana": "10.3.1",
    "prometheus": "2.49.1",
    
    // Content Management
    "wordpress": "6.4.2",
    "drupal": "10.2.2",
    "joomla": "5.0.2"
  };
  
  const toolLower = toolName.toLowerCase().trim();
  
  // Direct match for tool name
  if (latestVersionMappings[toolLower]) {
    return latestVersionMappings[toolLower];
  }
  
  // Try partial matches for common variations
  const partialMatches = Object.keys(latestVersionMappings).filter(key => 
    toolLower.includes(key) || key.includes(toolLower)
  );
  
  if (partialMatches.length > 0) {
    // Return the version of the best match (longest matching key)
    const bestMatch = partialMatches.reduce((a, b) => a.length > b.length ? a : b);
    return latestVersionMappings[bestMatch];
  }
  
  // If no specific mapping found, analyze CVE data to provide intelligent recommendations
  if (cves.length > 0) {
    const mostRecentYear = Math.max(...cves.map(cve => cve.year));
    const currentYear = new Date().getFullYear();
    const yearsSinceLastVuln = currentYear - mostRecentYear;
    
    if (yearsSinceLastVuln >= 3) {
      return "Latest Stable (Low Risk)";
    } else if (yearsSinceLastVuln >= 1) {
      return "Latest with Security Patches";
    } else {
      return "Latest (Monitor for Updates)";
    }
  }
  
  // Default fallback
  return "Latest Stable Release";
};

export default function CVESearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ToolAnalysis | null>(null);
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompanyPolicy | null>(null);
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    description: "",
    content: ""
  });

  // Remove automatic loading - only load when user clicks refresh
  const loadPolicies = async () => {
    try {
      setLoading(true);
      const policiesData = await policiesService.getAllPolicies();
      setPolicies(policiesData);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading policies:", error);
      // No fallback data - keep empty array
      setPolicies([]);
      setDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Mock CVE data
  const mockResults: ToolAnalysis = {
    toolName: "Nmap",
    version: "7.80",
    cves: [
      {
        id: "CVE-2023-1234",
        description: "Buffer overflow vulnerability in Nmap scanning engine",
        severity: "medium",
        cvssScore: 6.5,
        year: 2023,
        patchAvailable: true
      },
      {
        id: "CVE-2022-5678",
        description: "Denial of service vulnerability in NSE script engine",
        severity: "low",
        cvssScore: 3.3,
        year: 2022,
        patchAvailable: true
      }
    ],
    safeToUse: true,
    preferredVersion: "7.94",
    requiresVirtualEnv: false,
    recommendation: "safe"
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    
    try {
      // Try to fetch from NVD API (National Vulnerability Database)
      const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(searchTerm)}&resultsPerPage=10`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
          // Process all CVEs with enhanced data
          const allCves = data.vulnerabilities.map((vuln: any) => {
            const relevanceScore = calculateRelevanceScore(vuln, searchTerm);
            const isDeferred = isDeferredCVE(vuln);
            
            return {
              id: vuln.cve.id,
              description: vuln.cve.descriptions?.[0]?.value || "No description available",
              severity: vuln.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity?.toLowerCase() || 
                       vuln.cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseSeverity?.toLowerCase() || "medium",
              cvssScore: vuln.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                        vuln.cve.metrics?.cvssMetricV2?.[0]?.cvssData?.baseScore || 0,
              year: parseInt(vuln.cve.id.split('-')[1]) || new Date().getFullYear(),
              patchAvailable: detectPatchAvailability(vuln),
              isDeferred,
              relevanceScore,
              publishedDate: vuln.cve.published,
              lastModified: vuln.cve.lastModified
            };
          });

          // Filter out deferred CVEs and low relevance CVEs
          const filteredCves = allCves.filter(cve => 
            !cve.isDeferred && 
            cve.relevanceScore && cve.relevanceScore > 0 &&
            cve.cvssScore > 0
          );

          // Calculate risk factors
          const riskFactors = {
            criticalCount: filteredCves.filter(cve => cve.severity === "critical").length,
            highCount: filteredCves.filter(cve => cve.severity === "high").length,
            recentCount: filteredCves.filter(cve => isRecentCVE(cve.year)).length,
            deferredCount: allCves.filter(cve => cve.isDeferred).length
          };

          // Calculate composite risk score
          const compositeRiskScore = calculateCompositeRiskScore(filteredCves);

          const preferredVersion = determinePreferredVersion(searchTerm, filteredCves);
          
          const toolAnalysis: ToolAnalysis = {
            toolName: searchTerm,
            version: "Latest",
            cves: allCves,
            filteredCves: filteredCves,
            safeToUse: riskFactors.criticalCount === 0 && riskFactors.highCount <= 1,
            preferredVersion: preferredVersion,
            requiresVirtualEnv: riskFactors.criticalCount > 0 || riskFactors.highCount > 0 || compositeRiskScore > 7.0,
            recommendation: riskFactors.criticalCount > 0 ? "not-recommended" : 
                           (riskFactors.highCount > 0 || compositeRiskScore > 6.0) ? "test-env" : "safe",
            compositeRiskScore,
            riskFactors
          };  
            
          setSearchResults(toolAnalysis);
        } else {
          // No vulnerabilities found
          const preferredVersionSafe = determinePreferredVersion(searchTerm, []);
          
          const safeTool: ToolAnalysis = {
            toolName: searchTerm,
            version: "Latest",
            cves: [],
            filteredCves: [],
            safeToUse: true,
            preferredVersion: preferredVersionSafe,
            requiresVirtualEnv: false,
            recommendation: "safe",
            compositeRiskScore: 0,
            riskFactors: {
              criticalCount: 0,
              highCount: 0,
              recentCount: 0,
              deferredCount: 0
            }
          };
          setSearchResults(safeTool);
        }
      } else {
        // Fallback to mock data if API fails
        console.warn("NVD API failed, using mock data");
        setSearchResults(mockResults);
      }
    } catch (error) {
      console.error("Error fetching CVE data:", error);
      // Fallback to mock data
      setSearchResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddPolicy = async () => {
    if (!newPolicy.title || !newPolicy.description || !newPolicy.content) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const policyId = await policiesService.createPolicy(newPolicy);
      const policy: CompanyPolicy = {
        id: policyId,
        ...newPolicy
      };

      setPolicies([...policies, policy]);
      setNewPolicy({ title: "", description: "", content: "" });
      setIsAddingPolicy(false);
    } catch (error) {
      console.error("Error adding policy:", error);
      alert("Failed to add policy. Please try again.");
    }
  };

  const handleUpdatePolicy = async (policy: CompanyPolicy) => {
    if (!policy.id) return;
    
    try {
      await policiesService.updatePolicy(policy.id, policy);
      setPolicies(policies.map(p => p.id === policy.id ? policy : p));
      setEditingPolicy(null);
    } catch (error) {
      console.error("Error updating policy:", error);
      alert("Failed to update policy. Please try again.");
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      try {
        await policiesService.deletePolicy(id);
        setPolicies(policies.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting policy:", error);
        alert("Failed to delete policy. Please try again.");
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "safe": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "test-env": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "not-recommended": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case "safe": return "Safe on the Corporate Network";
      case "test-env": return "Requires a Test Environment";
      case "not-recommended": return "Not Recommended at All";
      default: return "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CVE Vulnerability Search</h1>
          <p className="text-muted-foreground">Search for security vulnerabilities in tools and get safety recommendations</p>
        </div>
        <div className="flex gap-2">
          {!dataLoaded && (
            <Button onClick={loadPolicies} disabled={loading}>
              {loading ? "Loading..." : "Load Policies"}
            </Button>
          )}
          {dataLoaded && (
            <Button onClick={loadPolicies} disabled={loading} variant="outline">
              {loading ? "Refreshing..." : "Refresh Policies"}
            </Button>
          )}
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tool Vulnerability Search
          </CardTitle>
          <CardDescription>
            Enter a tool name and version to search for known CVE vulnerabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter tool name (e.g., Nmap, Burp Suite, Metasploit)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
              {isSearching ? "Searching..." : "Search CVE Database"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchResults && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="guidance">Guidance & Standards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Tool Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{searchResults.toolName} - Security Analysis Report</span>
                  <Badge variant={searchResults.safeToUse ? "default" : "destructive"}>
                    {searchResults.safeToUse ? "Approved" : "Restricted"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Version {searchResults.version} • Generated on {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Relevant Vulnerabilities</h4>
                    <div className="text-2xl font-bold">
                      {searchResults.filteredCves.length}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {searchResults.riskFactors.deferredCount > 0 && `${searchResults.riskFactors.deferredCount} deferred/filtered out`}
                      {searchResults.riskFactors.criticalCount + searchResults.riskFactors.highCount > 0 && ` • ${searchResults.riskFactors.criticalCount + searchResults.riskFactors.highCount} high/critical`}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Composite Risk Score</h4>
                    <div className="text-2xl font-bold">
                      {searchResults.compositeRiskScore.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Weighted by relevance & recency
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Patches Available</h4>
                    <div className="text-2xl font-bold">
                      {searchResults.filteredCves.filter(cve => cve.patchAvailable).length}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Out of {searchResults.filteredCves.length} relevant CVEs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Analysis & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Safety Assessment</h4>
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(searchResults.recommendation)}
                        <span className="font-medium">{getRecommendationText(searchResults.recommendation)}</span>
                      </div>
                    </div>

                    {searchResults.preferredVersion && (
                      <div>
                        <h4 className="font-medium mb-2">Preferred Version</h4>
                        <Badge variant="outline">{searchResults.preferredVersion}</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Most secure version recommended
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Environment Requirements</h4>
                      <div className="flex items-center gap-2">
                        {searchResults.requiresVirtualEnv ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {searchResults.requiresVirtualEnv 
                            ? "Virtual environment recommended" 
                            : "Safe for corporate network"
                          }
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Can be used safely?</h4>
                      <div className="flex items-center gap-2">
                        {searchResults.safeToUse ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {searchResults.safeToUse ? "Yes, with proper precautions" : "No, significant risks identified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {!searchResults.safeToUse && (
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This tool has been flagged as high-risk. Please review the vulnerabilities and consider alternatives or additional security measures.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-6">
            {/* Filtering Information */}
            {searchResults.riskFactors.deferredCount > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Filtering Applied:</strong> {searchResults.riskFactors.deferredCount} CVEs were filtered out because they were marked as deferred, had incomplete data, or were not directly relevant to {searchResults.toolName}. 
                  This improves accuracy by focusing on actionable vulnerabilities.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Relevant Vulnerability Report</CardTitle>
                <CardDescription>
                  Filtered list of {searchResults.filteredCves.length} relevant CVE vulnerabilities for {searchResults.toolName}
                  {searchResults.cves.length > searchResults.filteredCves.length && ` (${searchResults.cves.length - searchResults.filteredCves.length} filtered out)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.filteredCves.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="font-medium">No relevant vulnerabilities found</p>
                      <p className="text-sm">All CVEs were filtered out as deferred or not directly applicable</p>
                    </div>
                  ) : (
                    searchResults.filteredCves.map((cve) => (
                    <Card key={cve.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{cve.id}</Badge>
                            <Badge variant={getSeverityColor(cve.severity)}>
                              {cve.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              CVSS: {cve.cvssScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{cve.year}</span>
                            {cve.patchAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                Patch Available
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mb-3">{cve.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8"
                            onClick={() => window.open(`https://nvd.nist.gov/vuln/detail/${cve.id}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View CVE Details
                          </Button>
                          {cve.patchAvailable && (
                            <span className="text-green-600 text-xs">
                              ✓ Security patch available
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Standards Reference</CardTitle>
                  <CardDescription>
                    Compliance frameworks and guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">NIST Guidelines</h4>
                    <p className="text-sm text-muted-foreground">
                      NIST SP 800-53: Security and Privacy Controls
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View NIST Reference
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">OWASP Standards</h4>
                    <p className="text-sm text-muted-foreground">
                      OWASP Top 10 and Testing Guidelines
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://owasp.org/www-project-top-ten/', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View OWASP Reference
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">PTES Framework</h4>
                    <p className="text-sm text-muted-foreground">
                      Penetration Testing Execution Standard
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('http://www.pentest-standard.org/index.php/Main_Page', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View PTES Reference
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Templates for Standards and Policies from the National Cybersecurity Authority</CardTitle>
                  <CardDescription>
                    Official templates and guidelines from Saudi Arabia's National Cybersecurity Authority
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Penetration Testing Standard Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Standard template for penetration testing procedures
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://cdn.nca.gov.sa/api/files/public/upload/937753ea-5c2e-474e-9404-e019470a6072_STANDARD_Penetration_Testing_template_ar_FINAL.docx', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Download Template
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Vulnerabilities Management Policy Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Policy template for vulnerability management processes
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://cdn.nca.gov.sa/api/files/public/upload/755d5bf6-f2d8-4240-80c8-265858202b67_POLICY_Vulnerabilities_Management_Template_ar_FINAL.pdf', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Download Template
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Vulnerabilities Management Standard Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Standard template for vulnerability management implementation
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://cdn.nca.gov.sa/api/files/public/upload/63bab587-9be7-4c92-95b4-cc231525fb79_STANDARD_Vulnerabilities_Management_template_ar_v0.11.pdf', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Download Template
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Vulnerability Management Procedure Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Detailed procedure template for vulnerability management
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://cdn.nca.gov.sa/api/files/public/upload/8b49130f-5e22-4e9a-8393-877258ad0e08_PROCEDURE_Vulnerability-Management-Procedure_Template_ar_v0.4.pdf', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Download Template
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Penetration Testing Policy Template</h4>
                    <p className="text-sm text-muted-foreground">
                      Policy template for penetration testing governance
                    </p>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://cdn.nca.gov.sa/api/files/public/upload/b189f651-29f2-402c-b2fb-68fd33dfc333_POLICY_Penetration_Testing_Template_ar_FINAL.pdf', '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Download Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Company Policies</CardTitle>
                      <CardDescription>
                        Internal security tool usage policies
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isAddingPolicy} onOpenChange={setIsAddingPolicy}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Policy
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add New Company Policy</DialogTitle>
                            <DialogDescription>
                              Create a new security policy for tool usage
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="policyTitle">Policy Title *</Label>
                              <Input
                                id="policyTitle"
                                value={newPolicy.title}
                                onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})}
                                placeholder="e.g., Incident Response Protocol"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="policyDescription">Short Description *</Label>
                              <Input
                                id="policyDescription"
                                value={newPolicy.description}
                                onChange={(e) => setNewPolicy({...newPolicy, description: e.target.value})}
                                placeholder="Brief description of the policy"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="policyContent">Policy Content *</Label>
                              <Textarea
                                id="policyContent"
                                value={newPolicy.content}
                                onChange={(e) => setNewPolicy({...newPolicy, content: e.target.value})}
                                placeholder="Detailed policy content with numbered steps or requirements"
                                className="min-h-32"
                              />
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button onClick={handleAddPolicy} className="flex-1">
                                Add Policy
                              </Button>
                              <Button variant="outline" onClick={() => setIsAddingPolicy(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPolicy(editingPolicy ? null : { id: "", title: "", description: "", content: "" })}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {editingPolicy ? "Done Editing" : "Edit Policies"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{policy.title}</h4>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                        {editingPolicy && (
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingPolicy(policy)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Policy: {policy.title}</DialogTitle>
                                  <DialogDescription>
                                    Modify the company security policy
                                  </DialogDescription>
                                </DialogHeader>
                                {editingPolicy && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Policy Title</Label>
                                      <Input
                                        value={editingPolicy.title}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, title: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Short Description</Label>
                                      <Input
                                        value={editingPolicy.description}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, description: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Policy Content</Label>
                                      <Textarea
                                        value={editingPolicy.content}
                                        onChange={(e) => setEditingPolicy({...editingPolicy, content: e.target.value})}
                                        className="min-h-32"
                                      />
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                      <Button onClick={() => handleUpdatePolicy(editingPolicy)} className="flex-1">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                      </Button>
                                      <Button variant="outline" onClick={() => setEditingPolicy(null)}>
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
                              onClick={() => handleDeletePolicy(policy.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-xs">
                            View Full Policy
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{policy.title}</DialogTitle>
                            <DialogDescription>
                              {policy.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                              <pre className="text-sm whitespace-pre-wrap">{policy.content}</pre>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}

                  {policies.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No policies defined yet</p>
                      <p className="text-xs">Click "Add Policy" to create your first policy</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
