import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, Settings, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { toolRequestsService } from "@/firebase/services";
import { request } from "http";


export default function ToolRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    toolName: "",
    purpose: "",
    environment: "",
    duration: "",
    justification: "",
    alternativesConsidered: "",
    approvedAt: "",
    riskAssessment: "" 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const environmentOptions = [
    { value: "production", label: "Production Environment" },
    { value: "testing", label: "Testing Environment" },
    { value: "virtual", label: "Virtual Environment" },
    { value: "isolated", label: "Isolated Network" }
  ];

  const durationOptions = [
    { value: "1-week", label: "1 Week" },
    { value: "2-weeks", label: "2 Weeks" },
    { value: "1-month", label: "1 Month" },
    { value: "3-months", label: "3 Months" },
    { value: "6-months", label: "6 Months" },
    { value: "permanent", label: "Permanent Access" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await toolRequestsService.createRequest({
        alertSent: true,
        reportSubmitted: true,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        toolName: formData.toolName,
        purpose: formData.purpose,
        environment: formData.environment,
        duration: formData.duration,
        justification: formData.justification,
        alternativesConsidered: formData.alternativesConsidered,
        riskAssessment: formData.riskAssessment,
        status: "pending"
      });
      
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
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
              <h2 className="text-2xl font-bold text-green-700">Request Submitted Successfully</h2>
              <p className="text-green-600">
                Your tool request has been submitted for administrator review. 
                You will be notified once a decision has been made.
              </p>
              <div className="bg-white border border-green-200 rounded-lg p-4 text-left">
                <h3 className="font-medium text-green-700 mb-2">Request Details:</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Tool:</strong> {formData.toolName}</p>
                  <p><strong>Purpose:</strong> {formData.purpose}</p>
                  <p><strong>Environment:</strong> {formData.environment}</p>
                  <p><strong>Duration:</strong> {formData.duration}</p>
                </div>
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => setSubmitted(false)}>Submit Another Request</Button>
                <Button variant="outline" onClick={() => navigate("/user")}>Return to Dashboard</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Request Tool</h1>
          <p className="text-muted-foreground">Submit a request for approval to use a new security tool</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please provide detailed information about the tool and its intended use. 
          Requests with insufficient detail may be rejected.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tool Information
            </CardTitle>
            <CardDescription>
              Basic details about the tool you want to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toolName">Tool Name *</Label>
              <Input
                id="toolName"
                placeholder="e.g., Metasploit, Sqlmap, John the Ripper"
                value={formData.toolName}
                onChange={(e) => setFormData({...formData, toolName: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Use *</Label>
              <Textarea
                id="purpose"
                placeholder="Describe what you plan to use this tool for (e.g., penetration testing, vulnerability assessment, network analysis)"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="min-h-24"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Environment *</Label>
                <RadioGroup 
                  value={formData.environment} 
                  onValueChange={(value) => setFormData({...formData, environment: value})}
                  className="space-y-2"
                >
                  {environmentOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="text-sm">{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration Needed *</Label>
                <Select onValueChange={(value) => setFormData({...formData, duration: value})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Justification */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Justification</CardTitle>
            <CardDescription>
              Provide comprehensive reasoning for why this tool is needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="justification">Business Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why this tool is necessary for your work, what specific capabilities it provides, and how it will be used in your security assessments."
                value={formData.justification}
                onChange={(e) => setFormData({...formData, justification: e.target.value})}
                className="min-h-32"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternativesConsidered">Alternatives Considered</Label>
              <Textarea
                id="alternativesConsidered"
                placeholder="List any alternative tools you considered and explain why they don't meet your requirements."
                value={formData.alternativesConsidered}
                onChange={(e) => setFormData({...formData, alternativesConsidered: e.target.value})}
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskAssessment">Risk Assessment</Label>
              <Textarea
                id="riskAssessment"
                placeholder="Describe any potential risks associated with using this tool and how you plan to mitigate them."
                value={formData.riskAssessment}
                onChange={(e) => setFormData({...formData, riskAssessment: e.target.value})}
                className="min-h-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Please note:</strong> Your request will be reviewed by the security team. 
            The approval process includes a CVE vulnerability assessment and may take 3-5 business days. 
            You will receive detailed security instructions if your request is approved.
          </AlertDescription>
        </Alert>

        {/* Submit Button */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline">Save Draft</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting Request..." : "Submit Tool Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
