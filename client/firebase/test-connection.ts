import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export async function testFirebaseConnection() {
  console.log("Testing Firebase connection...");
  
  try {
    // Test reading from a collection (read-only operation)
    console.log("Testing read operation...");
    const testCollection = collection(db, "test");
    const querySnapshot = await getDocs(testCollection);
    console.log("Read operation successful, found", querySnapshot.size, "documents");
    
    // Test writing to a collection (but clean up immediately)
    console.log("Testing write operation...");
    const testDoc = await addDoc(testCollection, {
      test: true,
      timestamp: serverTimestamp(),
      message: "Firebase connection test"
    });
    console.log("Write operation successful, document ID:", testDoc.id);
    
    // Clean up the test document immediately
    await deleteDoc(testDoc);
    console.log("Test document cleaned up");
    
    return { success: true, message: "Firebase connection working" };
  } catch (error) {
    console.error("Firebase connection test failed:", error);
    return { success: false, error: error };
  }
}

export async function testServicesConnection() {
  console.log("Testing services connection...");
  
  try {
    // Test tools service with a more efficient approach
    console.log("Testing tools service...");
    const tools = await import('./services').then(module => module.toolsService.getApprovedTools());
    console.log("Tools service working, found", tools.length, "approved tools");
    
    // Test reports service with a more efficient approach
    console.log("Testing reports service...");
    const reports = await import('./services').then(module => module.reportsService.getAllReports());
    console.log("Reports service working, found", reports.length, "reports");
    
    return { success: true, message: "Services connection working" };
  } catch (error) {
    console.error("Services connection test failed:", error);
    return { success: false, error: error };
  }
} 