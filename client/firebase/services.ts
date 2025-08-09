import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { convertFirebaseTimestamps } from './utils';

// Types
export interface UsageReport {
  id?: string;
  alertSent: boolean,
  reportSubmitted: boolean,
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
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  toolRequestId?: string
}

export interface ToolRequest {
  id?: string;
  alertSent: boolean,
  userId: string;
  userName: string;
  userEmail: string;
  toolName: string;
  purpose: string;
  environment: string;
  duration: string;
  justification: string;
  alternativesConsidered?: string;
  riskAssessment?: string;
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  adminComment?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  reportSubmitted?: boolean;
  
}

export interface Tool {
  id?: string;
  name: string;
  description: string;
  category: string;
  version: string;
  securityLevel: "low" | "medium" | "high";
  environment: "production" | "virtual" | "isolated";
  documentation: string;
  downloadUrl?: string;
  webInterface?: string;
  isApproved: boolean;
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
}

export interface Alert {
  id?: string;
  alertSent: boolean,
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  userId?: string; // If null, it's a global alert
  isRead: boolean;
  createdAt?: any;
  approvedAt?: any;
}

// Usage Reports Service
export const reportsService = {
  async createReport(report: Omit<UsageReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log("Creating report with data:", report);
      const docRef = await addDoc(collection(db, "usageReports"), {
        ...report,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Report created successfully with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error in createReport:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to create report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateReport(id: string, updates: Partial<UsageReport>): Promise<void> {
    try {
      const docRef = doc(db, "usageReports", id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error in updateReport:", error);
      throw new Error(`Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getUserReports(userId: string): Promise<UsageReport[]> {
    const q = query(
      collection(db, "usageReports"),
      where("userId", "==", userId),
      orderBy("submittedDate", "desc")
    );
    
    const querySnapshot = await getDocs(q);
          return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirebaseTimestamps(doc.data())
      })) as UsageReport[];
  },

  async getAllReports(): Promise<UsageReport[]> {
    try {
      const q = query(
        collection(db, "usageReports"),
        orderBy("submittedDate", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirebaseTimestamps(doc.data())
      })) as UsageReport[];
    } catch (error) {
      console.error("Error in getAllReports:", error);
      throw new Error(`Failed to fetch reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getReport(id: string): Promise<UsageReport | null> {
    const docRef = doc(db, "usageReports", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertFirebaseTimestamps(docSnap.data())
      } as UsageReport;
    }
    return null;
  }
};

// Tool Requests Service
export const toolRequestsService = {
  async createRequest(request: Omit<ToolRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log("Creating tool request with data:", request);
      const docRef = await addDoc(collection(db, "toolRequests"), {
        ...request,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Tool request created successfully with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error in createRequest:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to create tool request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateRequest(id: string, updates: Partial<ToolRequest>): Promise<void> {
    try {
      console.log("Updating tool request with ID:", id);
      console.log("Update data:", updates);
      
      const docRef = doc(db, "toolRequests", id);
      
      // Remove undefined values to avoid Firebase errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      console.log("Clean updates:", cleanUpdates);
      
      await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });
      
      console.log("Tool request updated successfully");
    } catch (error) {
      console.error("Error in updateRequest:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to update tool request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getUserRequests(userId: string): Promise<ToolRequest[]> {
    const q = query(
      collection(db, "toolRequests"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirebaseTimestamps(doc.data())
    })) as ToolRequest[];
  },

  async getAllRequests(): Promise<ToolRequest[]> {
    const q = query(
      collection(db, "toolRequests"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirebaseTimestamps(doc.data())
    })) as ToolRequest[];
  },

  async getRequest(id: string): Promise<ToolRequest | null> {
    const docRef = doc(db, "toolRequests", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertFirebaseTimestamps(docSnap.data())
      } as ToolRequest;
    }
    return null;
  }
};

// Tools Service
export const toolsService = {
  async createTool(tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log("Creating tool with data:", tool);
      const docRef = await addDoc(collection(db, "tools"), {
        ...tool,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Tool created successfully with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error in createTool:", error);
      console.error("Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      throw new Error(`Failed to create tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateTool(id: string, updates: Partial<Tool>): Promise<void> {
    const docRef = doc(db, "tools", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteTool(id: string): Promise<void> {
    const docRef = doc(db, "tools", id);
    await deleteDoc(docRef);
  },

  async getApprovedTools(): Promise<Tool[]> {
    const q = query(
      collection(db, "tools"),
      where("isApproved", "==", true),
      orderBy("name")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirebaseTimestamps(doc.data())
    })) as Tool[];
  },

  async getAllTools(): Promise<Tool[]> {
    try {
      const q = query(
        collection(db, "tools"),
        orderBy("name")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertFirebaseTimestamps(doc.data())
      })) as Tool[];
    } catch (error) {
      console.error("Error in getAllTools:", error);
      throw new Error(`Failed to fetch tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getTool(id: string): Promise<Tool | null> {
    const docRef = doc(db, "tools", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertFirebaseTimestamps(docSnap.data())
      } as Tool;
    }
    return null;
  }
};

// Alerts Service
export const alertsService = {
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, "alerts"), {
      ...alert,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async markAsRead(id: string): Promise<void> {
    const docRef = doc(db, "alerts", id);
    await updateDoc(docRef, {
      isRead: true
    });
  },

  async getUserAlerts(userId: string): Promise<Alert[]> {
    const q = query(
      collection(db, "alerts"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirebaseTimestamps(doc.data())
    })) as Alert[];
  },

  async getGlobalAlerts(): Promise<Alert[]> {
    const q = query(
      collection(db, "alerts"),
      where("userId", "==", null),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirebaseTimestamps(doc.data())
    })) as Alert[];
  },

  async deleteAlert(id: string): Promise<void> {
    const docRef = doc(db, "alerts", id);
    await deleteDoc(docRef);
  }
};

// Company Policies Service
export interface CompanyPolicy {
  id?: string;
  title: string;
  description: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
}

export const policiesService = {
  async createPolicy(policy: Omit<CompanyPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, "policies"), {
      ...policy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updatePolicy(id: string, updates: Partial<CompanyPolicy>): Promise<void> {
    const docRef = doc(db, "policies", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deletePolicy(id: string): Promise<void> {
    const docRef = doc(db, "policies", id);
    await deleteDoc(docRef);
  },

  async getAllPolicies(): Promise<CompanyPolicy[]> {
    const q = query(
      collection(db, "policies"),
      orderBy("title")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertFirebaseTimestamps(doc.data())
    })) as CompanyPolicy[];
  },

  async getPolicy(id: string): Promise<CompanyPolicy | null> {
    const docRef = doc(db, "policies", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertFirebaseTimestamps(docSnap.data())
      } as CompanyPolicy;
    }
    return null;
  }
}; 