import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toolsService, policiesService } from './services';

// Sample tools data
const sampleTools = [
  {
    name: "Nmap",
    description: "Network discovery and security auditing tool for identifying open ports and services",
    category: "Network Security",
    version: "7.94",
    securityLevel: "medium" as const,
    environment: "production" as const,
    documentation: "Network mapping and port scanning tool. Use responsibly on authorized networks only.",
    downloadUrl: "https://nmap.org/download.html",
    webInterface: "https://nmap-web.company.local",
    isApproved: true
  },
  {
    name: "Wireshark",
    description: "Network protocol analyzer for deep packet inspection and traffic analysis",
    category: "Network Security",
    version: "4.2.0",
    securityLevel: "low" as const,
    environment: "production" as const,
    documentation: "Packet capture and analysis tool. Ensure compliance with data privacy policies.",
    downloadUrl: "https://www.wireshark.org/download.html",
    isApproved: true
  },
  {
    name: "OWASP ZAP",
    description: "Web application security scanner for finding vulnerabilities in web apps",
    category: "Web Security",
    version: "2.14.0",
    securityLevel: "medium" as const,
    environment: "virtual" as const,
    documentation: "Web application security testing proxy. Use only on authorized applications.",
    downloadUrl: "https://www.zaproxy.org/download/",
    webInterface: "https://zap-web.company.local",
    isApproved: true
  },
  {
    name: "Burp Suite",
    description: "Advanced web vulnerability scanner and penetration testing toolkit",
    category: "Web Security",
    version: "2023.12",
    securityLevel: "high" as const,
    environment: "isolated" as const,
    documentation: "Professional web app security testing platform. Requires isolated environment.",
    webInterface: "https://burp-suite.company.local",
    isApproved: true
  },
  {
    name: "Nikto",
    description: "Web server scanner for identifying security issues and misconfigurations",
    category: "Web Security",
    version: "2.5.0",
    securityLevel: "medium" as const,
    environment: "virtual" as const,
    documentation: "Web server vulnerability scanner. Scan only authorized web servers.",
    downloadUrl: "https://github.com/sullo/nikto",
    isApproved: true
  },
  {
    name: "Gobuster",
    description: "Directory and file brute-forcer for web applications and servers",
    category: "Web Security",
    version: "3.6",
    securityLevel: "medium" as const,
    environment: "virtual" as const,
    documentation: "Directory brute-forcing tool. Use rate limiting to avoid service disruption.",
    downloadUrl: "https://github.com/OJ/gobuster",
    isApproved: true
  },
  
];

// Sample policies data
const samplePolicies = [
  {
    title: "Tool Approval Process",
    description: "All security tools must be approved before use",
    content: "1. Submit tool request through official channels\n2. Security team reviews tool and associated risks\n3. CVE analysis is performed\n4. Decision communicated within 5 business days\n5. Approved tools are added to authorized list"
  },
  {
    title: "Usage Reporting",
    description: "Submit usage reports within 24 hours of tool use",
    content: "1. Complete usage report form after each tool session\n2. Include purpose, steps performed, and results\n3. Submit within 24 hours of tool usage\n4. Maintain compliance with security policies\n5. Late reports may result in tool access suspension"
  },
  {
    title: "Environment Restrictions",
    description: "High-risk tools must be used in isolated environments",
    content: "1. Low-risk tools: Production environment allowed\n2. Medium-risk tools: Virtual environment required\n3. High-risk tools: Isolated network mandatory\n4. Critical tools: Special approval and monitoring\n5. Unauthorized environment usage prohibited"
  },
  {
    title: "Data Handling Requirements",
    description: "Proper handling of sensitive data during security assessments",
    content: "1. All test data must be anonymized\n2. Production data usage requires special approval\n3. Test results must be securely stored\n4. Data retention policies must be followed\n5. No sharing of sensitive findings externally"
  }
];

// Sample usage reports data
const sampleReports = [
  {
    userId: "user1",
    userName: "John Doe",
    userEmail: "john.doe@company.com",
    toolName: "Nmap",
    dateOfUse: "2024-01-14",
    submittedDate: "2024-01-15",
    purposeOfUse: "Security Assessment",
    locationOfUse: "Company Device",
    stepsDescription: "Performed network scan on authorized subnet 192.168.1.0/24 using nmap -sS -sV commands. Identified open ports and services as part of quarterly security assessment.",
    outputsResults: "Found 15 active hosts with various services including SSH (22), HTTP (80), and HTTPS (443). No unexpected services detected. Results saved to secure location.",
    adheredToPolicy: true,
    stayedWithinScope: true,
    noThirdPartySharing: true,
    noMaliciousUse: true,
    comments: "Scan completed successfully with no issues encountered.",
    status: "reviewed" as const,
    adminResponse: "Excellent use of the tool for legitimate troubleshooting. Report approved.",
    adminComment: "Well documented analysis. Consider scheduling follow-up testing during next maintenance window.",
    reviewedBy: "Admin User",
    reviewedDate: "2024-01-14",
    complianceScore: 100
  },
  {
    userId: "user2",
    userName: "Jane Smith",
    userEmail: "jane.smith@company.com",
    toolName: "Wireshark",
    dateOfUse: "2024-01-12",
    submittedDate: "2024-01-13",
    purposeOfUse: "Network troubleshooting",
    locationOfUse: "Virtual Environment",
    stepsDescription: "Captured network traffic on test interface to analyze packet loss issues. Used display filters to isolate relevant traffic.",
    outputsResults: "Identified intermittent packet drops during peak hours. Generated report for network team review.",
    adheredToPolicy: true,
    stayedWithinScope: true,
    noThirdPartySharing: true,
    noMaliciousUse: true,
    comments: "",
    status: "reviewed" as const,
    adminResponse: "Approved - Compliant Usage",
    adminComment: "Good troubleshooting work. Results have been shared with the network team.",
    reviewedBy: "Admin User",
    reviewedDate: "2024-01-14",
    complianceScore: 95
  },
  {
    userId: "user3",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@company.com",
    toolName: "OWASP ZAP",
    dateOfUse: "2024-01-10",
    submittedDate: "2024-01-15",
    purposeOfUse: "Web Application Testing",
    locationOfUse: "Virtual Environment",
    stepsDescription: "Performed automated security scan on development web application. Used spider and active scan features.",
    outputsResults: "Discovered 3 medium-risk vulnerabilities including XSS and SQL injection possibilities.",
    adheredToPolicy: true,
    stayedWithinScope: false,
    noThirdPartySharing: true,
    noMaliciousUse: true,
    comments: "Had to extend testing to additional endpoints for thorough coverage.",
    status: "flagged" as const,
    adminResponse: "Requires Clarification",
    adminComment: "Please provide additional details about scope extension. Testing beyond approved scope requires pre-authorization.",
    reviewedBy: "Admin User",
    reviewedDate: "2024-01-16",
    complianceScore: 70
  }
];

// Sample tool requests data
const sampleRequests = [
  {
    userId: "user1",
    userName: "John Doe",
    userEmail: "john.doe@company.com",
    toolName: "Metasploit",
    purpose: "Penetration testing of internal systems",
    environment: "isolated",
    duration: "1-month",
    justification: "Need advanced exploitation framework for comprehensive security assessments. Current tools lack the depth required for thorough penetration testing.",
    alternativesConsidered: "Considered Core Impact and Canvas but Metasploit offers better community support and documentation.",
    riskAssessment: "Will be used only in isolated environment with proper access controls. All activities will be logged and monitored.",
    status: "pending" as const
  },
  {
    userId: "user2",
    userName: "Jane Smith",
    userEmail: "jane.smith@company.com",
    toolName: "Sqlmap",
    purpose: "SQL injection testing for web applications",
    environment: "virtual",
    duration: "2-weeks",
    justification: "Required for automated SQL injection testing during web application security assessments.",
    alternativesConsidered: "Manual testing is too time-consuming and error-prone.",
    riskAssessment: "Will only be used on authorized test environments with proper safeguards.",
    status: "approved" as const,
    adminResponse: "Approved for use in virtual environment",
    adminComment: "Good justification provided. Ensure proper logging and monitoring.",
    reviewedBy: "Admin User",
    reviewedDate: "2024-01-10"
  }
];

export async function initializeDatabase() {
  console.log("Initializing database with sample data...");
  
  try {
    // Check if tools already exist before adding
    const existingTools = await toolsService.getApprovedTools();
    if (existingTools.length === 0) {
      console.log("Adding sample tools...");
      for (const tool of sampleTools) {
        await toolsService.createTool(tool);
      }
    } else {
      console.log("Tools already exist, skipping tools initialization");
    }
    
    // Check if policies already exist before adding
    const existingPolicies = await policiesService.getAllPolicies();
    if (existingPolicies.length === 0) {
      console.log("Adding sample policies...");
      for (const policy of samplePolicies) {
        await policiesService.createPolicy(policy);
      }
    } else {
      console.log("Policies already exist, skipping policies initialization");
    }
    
    // Add sample usage reports (these are user data, so we can add them)
    console.log("Adding sample usage reports...");
    const reportsRef = collection(db, "usageReports");
    for (const report of sampleReports) {
      await addDoc(reportsRef, {
        ...report,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      });
    }
    
    // Add sample tool requests (these are user data, so we can add them)
    console.log("Adding sample tool requests...");
    const requestsRef = collection(db, "toolRequests");
    for (const request of sampleRequests) {
      await addDoc(requestsRef, {
        ...request,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        approvedAt: serverTimestamp()
      });
    }
    
    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Function to check if database is empty
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const tools = await toolsService.getApprovedTools();
    const policies = await policiesService.getAllPolicies();
    
    return tools.length === 0 && policies.length === 0;
  } catch (error) {
    console.error("Error checking database status:", error);
    return true; // Assume empty if error occurs
  }
}

// Function to initialize database only if empty
export async function initializeDatabaseIfEmpty() {
  const isEmpty = await isDatabaseEmpty();
  if (isEmpty) {
    await initializeDatabase();
  } else {
    console.log("Database already contains data, skipping initialization.");
  }
} 