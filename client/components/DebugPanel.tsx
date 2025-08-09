import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testFirebaseConnection, testServicesConnection } from '@/firebase/test-connection';
import { testTimestampConversion } from '@/firebase/test-timestamp';
import { toolsService } from '@/firebase/services';

export default function DebugPanel() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState<string | null>(null);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(testName);
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: { error: error.message } }));
    } finally {
      setLoading(null);
    }
  };

  const testToolsService = async () => {
    try {
      console.log("Testing toolsService.getApprovedTools()...");
      const tools = await toolsService.getApprovedTools();
      console.log("Tools loaded successfully:", tools);
      return { success: true, count: tools.length, tools };
    } catch (error) {
      console.error("Tools service error:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => runTest('firebase', testFirebaseConnection)}
            disabled={loading === 'firebase'}
          >
            {loading === 'firebase' ? 'Testing...' : 'Test Firebase Connection'}
          </Button>
          
          <Button 
            onClick={() => runTest('services', testServicesConnection)}
            disabled={loading === 'services'}
          >
            {loading === 'services' ? 'Testing...' : 'Test Services'}
          </Button>
          
          <Button 
            onClick={() => runTest('timestamp', testTimestampConversion)}
            disabled={loading === 'timestamp'}
          >
            {loading === 'timestamp' ? 'Testing...' : 'Test Timestamps'}
          </Button>
          
          <Button 
            onClick={() => runTest('tools', testToolsService)}
            disabled={loading === 'tools'}
          >
            {loading === 'tools' ? 'Testing...' : 'Test Tools Service'}
          </Button>
        </div>

        <div className="space-y-2">
          {Object.entries(results).map(([testName, result]) => (
            <div key={testName} className="p-2 border rounded">
              <strong>{testName}:</strong>
              <pre className="text-xs mt-1 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 