import { ThemeToggle } from "../views-components/ThemeToggle";
import { useTheme } from "../theme/theme-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ExtensionSettingsTab = () => {
  const { theme } = useTheme();

  return (
    <div className="p-4 overflow-x-hidden">
      <h2 className="text-lg font-semibold mb-4">Extension Settings</h2>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current theme: {theme}</span>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtensionSettingsTab;
