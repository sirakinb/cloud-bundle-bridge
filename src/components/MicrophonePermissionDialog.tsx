
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, RefreshCw, Settings } from "lucide-react";

interface MicrophonePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorType: "permission-denied" | "not-found" | "in-use" | "other";
  onRetry: () => void;
}

export function MicrophonePermissionDialog({
  open,
  onOpenChange,
  errorType,
  onRetry,
}: MicrophonePermissionDialogProps) {
  const getBrowserInstructions = () => {
    const browser = detectBrowser();
    
    switch (browser) {
      case "chrome":
        return (
          <>
            <p className="mb-2">To enable your microphone in Chrome:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Click the lock/site settings icon in the address bar</li>
              <li>Find "Microphone" in the permissions list</li>
              <li>Change the setting to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </>
        );
      case "firefox":
        return (
          <>
            <p className="mb-2">To enable your microphone in Firefox:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Click the lock icon in the address bar</li>
              <li>Select "Connection Secure"</li>
              <li>Click "More Information"</li>
              <li>Go to "Permissions" tab</li>
              <li>Find "Use the Microphone" and change to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </>
        );
      case "safari":
        return (
          <>
            <p className="mb-2">To enable your microphone in Safari:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Click Safari in the top menu</li>
              <li>Select "Settings for This Website..."</li>
              <li>Find "Microphone" and select "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </>
        );
      case "edge":
        return (
          <>
            <p className="mb-2">To enable your microphone in Edge:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Click the lock icon in the address bar</li>
              <li>Find "Microphone" in the permissions list</li>
              <li>Change the setting to "Allow"</li>
              <li>Refresh the page</li>
            </ol>
          </>
        );
      default:
        return (
          <>
            <p className="mb-2">To enable your microphone:</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              <li>Look for site permissions in your browser settings or the address bar</li>
              <li>Find microphone permissions and enable them for this site</li>
              <li>Refresh the page</li>
            </ol>
          </>
        );
    }
  };

  const detectBrowser = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.indexOf("chrome") > -1) return "chrome";
    if (userAgent.indexOf("safari") > -1) return "safari";
    if (userAgent.indexOf("firefox") > -1) return "firefox";
    if (userAgent.indexOf("edg") > -1) return "edge";
    
    return "unknown";
  };

  const getErrorContent = () => {
    switch (errorType) {
      case "permission-denied":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MicOff className="h-5 w-5 text-destructive" />
                Microphone Access Denied
              </DialogTitle>
              <DialogDescription>
                ClearStudy needs microphone access to record lectures.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-md border mb-4">
                {getBrowserInstructions()}
              </div>
              <p className="text-sm text-muted-foreground">
                After enabling microphone access, click the "Try Again" button below to start recording.
              </p>
            </div>
          </>
        );
      case "not-found":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MicOff className="h-5 w-5 text-destructive" />
                No Microphone Detected
              </DialogTitle>
              <DialogDescription>
                ClearStudy couldn't find a microphone connected to your device.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">Please check that:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Your microphone is properly connected</li>
                <li>It's not disabled in your system settings</li>
                <li>No other application is currently using it</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Once your microphone is connected, click "Try Again" to start recording.
              </p>
            </div>
          </>
        );
      case "in-use":
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MicOff className="h-5 w-5 text-destructive" />
                Microphone In Use
              </DialogTitle>
              <DialogDescription>
                Your microphone is currently being used by another application.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">To resolve this issue:</p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Close other applications that might be using your microphone (video conferencing, voice chat, etc.)</li>
                <li>Restart your browser</li>
                <li>If using external microphone, try unplugging and plugging it back in</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                After freeing your microphone, click "Try Again" to start recording.
              </p>
            </div>
          </>
        );
      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MicOff className="h-5 w-5 text-destructive" />
                Microphone Error
              </DialogTitle>
              <DialogDescription>
                There was an unexpected error accessing your microphone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Please try the following steps:</p>
              <ul className="list-disc pl-5 space-y-2 my-4">
                <li>Refresh the page</li>
                <li>Check your browser settings to ensure microphone access is allowed</li>
                <li>Restart your browser</li>
                <li>Try a different browser if the issue persists</li>
              </ul>
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {getErrorContent()}
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              const browser = detectBrowser();
              let settingsUrl = "";
              
              if (browser === "chrome") {
                settingsUrl = "chrome://settings/content/microphone";
              } else if (browser === "edge") {
                settingsUrl = "edge://settings/content/microphone";
              }
              
              if (settingsUrl) {
                try {
                  window.open(settingsUrl, '_blank');
                } catch (e) {
                  console.error("Couldn't open settings URL:", e);
                  alert(`Please open ${settingsUrl} in your browser to access microphone settings`);
                }
              } else {
                alert("Please check your browser settings to update microphone permissions");
              }
            }}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Browser Settings
          </Button>
          <Button 
            type="submit" 
            onClick={onRetry} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
