import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, MessageCircle } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  features?: string[];
}

export default function PlaceholderPage({ title, description, features = [] }: PlaceholderPageProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <Construction className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {features.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Planned Features:</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="text-center space-y-4 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              This page is currently under development. You can continue prompting to have me implement the specific features you need.
            </p>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Request Implementation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
