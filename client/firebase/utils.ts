// Utility function to convert Firebase timestamp to ISO string
export function convertFirebaseTimestamp(timestamp: any): string | undefined {
  if (!timestamp) return undefined;
  
  // If it's already a string, return as is
  if (typeof timestamp === 'string') return timestamp;
  
  // If it's a Firebase timestamp object
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  
  // If it's a Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  return undefined;
}

// Utility function to convert all Firebase timestamps in an object
export function convertFirebaseTimestamps(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const converted = { ...data };
  
  // Convert known timestamp fields
  if (converted.createdAt) {
    converted.createdAt = convertFirebaseTimestamp(converted.createdAt);
  }
  if (converted.updatedAt) {
    converted.updatedAt = convertFirebaseTimestamp(converted.updatedAt);
  }
  if (converted.approvedAt) {
    converted.approvedAt = convertFirebaseTimestamp(converted.approvedAt);
  }
  
  return converted;
} 