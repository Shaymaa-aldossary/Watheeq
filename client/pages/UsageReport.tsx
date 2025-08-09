import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { reportsService } from "@/firebase/services";
import ToolRequest from "./ToolRequest";
import ToolManagement from "./ToolManagement";
import { Tooltip } from "recharts";

export default function UsageReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Section 1: General Information
    userName: user?.name || "",
    dateOfUse: new Date().toISOString().split('T')[0],
    toolUsed: "",
    purposeOfUse: "",
    otherPurpose: "",
    locationOfUse: "",

    // Section 2: Steps of Use
    stepsDescription: "",

    // Section 3: Outputs/Results
    outputsResults: "",

    // Section 4: Policy Compliance
    adheredToPolicy: false,
    stayedWithinScope: false,
    noThirdPartySharing: false,
    noMaliciousUse: false,

    // Section 5: Comments
    comments: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const approvedTools = [
    "Nmap",
    "Wireshark", 
    "OWASP ZAP",
    "Burp Suite",
    "Nikto",
    "Dirb",
    "Gobuster"
  ];

  const purposeOptions = [
    { value: "training", label: "Training" },
    { value: "security-assessment", label: "Security Assessment" },
    { value: "project", label: "Project" },
    { value: "other", label: "Other" }
  ];

  const locationOptions = [
    { value: "company-device", label: "Company Device" },
    { value: "virtual-environment", label: "Virtual Environment" },
    { value: "external-network", label: "External Network" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate policy compliance
    const policyCompliance = [
      formData.adheredToPolicy,
      formData.stayedWithinScope,
      formData.noThirdPartySharing,
      formData.noMaliciousUse
    ];

    if (!policyCompliance.some(Boolean)) {
      alert("Please select at least one policy compliance statement before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate compliance score
      const complianceScore = policyCompliance.filter(Boolean).length * 25;

      await reportsService.createReport({
        alertSent: true,
        reportSubmitted: true,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        toolName: formData.toolUsed,
        dateOfUse: formData.dateOfUse,
        submittedDate: new Date().toISOString().split('T')[0],
        purposeOfUse: formData.purposeOfUse === "other" ? formData.otherPurpose : formData.purposeOfUse,
        locationOfUse: formData.locationOfUse,
        stepsDescription: formData.stepsDescription,
        outputsResults: formData.outputsResults,
        adheredToPolicy: formData.adheredToPolicy,
        stayedWithinScope: formData.stayedWithinScope,
        noThirdPartySharing: formData.noThirdPartySharing,
        noMaliciousUse: formData.noMaliciousUse,
        comments: formData.comments,
        toolRequestId: user.id,
        status: "pending",
        complianceScore
      });

      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">Report Submitted Successfully</h2>
              <p className="text-green-600">
                Your usage report has been submitted and logged in the system. 
                Thank you for maintaining compliance with security policies.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => setSubmitted(false)}>Submit Another Report</Button>
                <Button variant="outline" onClick={() => navigate("/user")}>Return to Dashboard</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tool Usage Report</h1>
          <p className="text-muted-foreground">Submit a detailed report of your security tool usage</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          All fields marked with (*) are required. Please provide complete and accurate information to ensure compliance with security policies.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              General Information
            </CardTitle>
            <CardDescription>
              Basic details about your tool usage session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Automatically filled by the system</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfUse">Date of Use *</Label>
                <Input
                  id="dateOfUse"
                  type="date"
                  value={formData.dateOfUse}
                  onChange={(e) => setFormData({...formData, dateOfUse: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toolUsed">Name of the Tool Used *</Label>
              <Input
                id="toolUsed"
                value={formData.toolUsed}
                onChange={(e) => setFormData({...formData, toolUsed: e.target.value})}
                placeholder="Enter the name of the tool you used"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Purpose of Use *</Label>
              <RadioGroup 
                value={formData.purposeOfUse} 
                onValueChange={(value) => setFormData({...formData, purposeOfUse: value})}
                className="grid grid-cols-2 gap-4"
              >
                {purposeOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {formData.purposeOfUse === "other" && (
                <Input
                  placeholder="Please specify the purpose"
                  value={formData.otherPurpose}
                  onChange={(e) => setFormData({...formData, otherPurpose: e.target.value})}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Location of Use *</Label>
              <RadioGroup 
                value={formData.locationOfUse} 
                onValueChange={(value) => setFormData({...formData, locationOfUse: value})}
                className="grid grid-cols-1 gap-4"
              >
                {locationOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Steps of Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              Steps of Use (What did you do?)
            </CardTitle>
            <CardDescription>
              Detailed description of the steps you followed while using the tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="stepsDescription">Detailed Steps *</Label>
              <Textarea
                id="stepsDescription"
                placeholder="For example:
• I scanned the company's domain with Nmap
• I used the -sV option to discover services
• I saved the results to a file without sharing them
• I did not attempt to exploit any vulnerabilities"
                value={formData.stepsDescription}
                onChange={(e) => setFormData({...formData, stepsDescription: e.target.value})}
                className="min-h-32"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Outputs/Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              Outputs / Results
            </CardTitle>
            <CardDescription>
              What did the tool result in?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="outputsResults">Tool Results *</Label>
              <Textarea
                id="outputsResults"
                placeholder="For example:
• 3 open ports were detected on an internal IP
• The tool did not show any critical results
• There were no problems with usage"
                value={formData.outputsResults}
                onChange={(e) => setFormData({...formData, outputsResults: e.target.value})}
                className="min-h-32"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Policy Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              Policy Compliance
            </CardTitle>
            <CardDescription>
              Please select at least one policy compliance statement that applies to your usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="adheredToPolicy"
                  checked={formData.adheredToPolicy}
                  onCheckedChange={(checked) => setFormData({...formData, adheredToPolicy: checked as boolean})}
                />
                <Label htmlFor="adheredToPolicy" className="text-sm">
                  I adhered to the company's policy for using the tool
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="stayedWithinScope"
                  checked={formData.stayedWithinScope}
                  onCheckedChange={(checked) => setFormData({...formData, stayedWithinScope: checked as boolean})}
                />
                <Label htmlFor="stayedWithinScope" className="text-sm">
                  I did not use the tool beyond the permitted scope
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noThirdPartySharing"
                  checked={formData.noThirdPartySharing}
                  onCheckedChange={(checked) => setFormData({...formData, noThirdPartySharing: checked as boolean})}
                />
                <Label htmlFor="noThirdPartySharing" className="text-sm">
                  I did not share any output with third parties
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="noMaliciousUse"
                  checked={formData.noMaliciousUse}
                  onCheckedChange={(checked) => setFormData({...formData, noMaliciousUse: checked as boolean})}
                />
                <Label htmlFor="noMaliciousUse" className="text-sm">
                  I did not use the tool for malicious purposes
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
              Comments or Difficulties (Optional)
            </CardTitle>
            <CardDescription>
              Any comments, technical issues, suggestions, or difficulties encountered during use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                placeholder="Any additional information you'd like to share..."
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                className="min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline">Save Draft</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Usage Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
