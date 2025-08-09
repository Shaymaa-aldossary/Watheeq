import { convertFirebaseTimestamp, convertFirebaseTimestamps } from './utils';

// Test the timestamp conversion functions
export function testTimestampConversion() {
  console.log("Testing timestamp conversion...");
  
  // Test Firebase timestamp object
  const firebaseTimestamp = { seconds: 1704067200, nanoseconds: 0 };
  const converted = convertFirebaseTimestamp(firebaseTimestamp);
  console.log("Firebase timestamp converted:", converted);
  
  // Test string timestamp
  const stringTimestamp = "2024-01-01T00:00:00.000Z";
  const convertedString = convertFirebaseTimestamp(stringTimestamp);
  console.log("String timestamp converted:", convertedString);
  
  // Test object with timestamps
  const testObject = {
    id: "test",
    name: "Test",
    createdAt: firebaseTimestamp,
    updatedAt: firebaseTimestamp,
    approvedAt: firebaseTimestamp
  };
  
  const convertedObject = convertFirebaseTimestamps(testObject);
  console.log("Object with timestamps converted:", convertedObject);
  
  return {
    firebaseTimestamp: converted,
    stringTimestamp: convertedString,
    object: convertedObject
  };
} 