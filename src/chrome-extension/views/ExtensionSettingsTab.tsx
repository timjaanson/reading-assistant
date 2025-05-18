import { ThemeToggle } from "../views-components/ThemeToggle";
import { useTheme } from "../theme/theme-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SettingsTabHeaderFooter } from "../views-components/SettingsTabHeaderFooter";

const ExtensionSettingsTab = () => {
  const { theme } = useTheme();

  return (
    <SettingsTabHeaderFooter headerText="Extension Settings" noFooter={true}>
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
    </SettingsTabHeaderFooter>
  );
};

export default ExtensionSettingsTab;
