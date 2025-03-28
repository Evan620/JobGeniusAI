import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { AiSettings } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  aiSettings: AiSettings;
  onUpdateSettings: (settings: Partial<AiSettings>) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant({ aiSettings, onUpdateSettings }: AIAssistantProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'I found 3 new jobs matching your profile today. Would you like me to prepare custom applications?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setChatMessages([...chatMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Send message to AI
      const response = await apiRequest('POST', '/api/ai-chat', {
        message: inputMessage,
        previousMessages: chatMessages
      });
      
      const data = await response.json();
      
      // Add AI response to chat
      setTimeout(() => {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message to AI assistant",
        variant: "destructive"
      });
      setIsTyping(false);
    }
  };

  const handleSettingChange = (key: keyof AiSettings, value: boolean | number) => {
    onUpdateSettings({ [key]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-[#2D3E50]">AI Assistant</CardTitle>
          <div className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
            <span className="text-xs text-gray-500">Active</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4">
        <div className="mb-6 space-y-4">
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-[#2D3E50] mb-2">AI Job Search Status</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Job boards scraped</span>
                    <span className="text-[#2D3E50] font-medium">3/4</span>
                  </div>
                  <Progress value={75} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Jobs analyzed</span>
                    <span className="text-[#2D3E50] font-medium">128/150</span>
                  </div>
                  <Progress value={85} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Auto-applications</span>
                    <span className="text-[#2D3E50] font-medium">8/10</span>
                  </div>
                  <Progress value={80} className="h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-[#2D3E50] mb-2">AI Control Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-apply" className="text-sm text-gray-600 flex-grow">
                    Auto-apply to jobs (80%+ match)
                  </Label>
                  <Switch 
                    id="auto-apply" 
                    checked={aiSettings.autoApply}
                    onCheckedChange={(checked) => handleSettingChange('autoApply', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="customize-resume" className="text-sm text-gray-600 flex-grow">
                    Customize resumes for each job
                  </Label>
                  <Switch 
                    id="customize-resume" 
                    checked={aiSettings.customizeResumes}
                    onCheckedChange={(checked) => handleSettingChange('customizeResumes', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-alerts" className="text-sm text-gray-600 flex-grow">
                    Daily job search alerts
                  </Label>
                  <Switch 
                    id="daily-alerts" 
                    checked={aiSettings.dailyAlerts}
                    onCheckedChange={(checked) => handleSettingChange('dailyAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-[#2D3E50] mb-3">AI Assistant Chat</h3>
              <ScrollArea className="h-[180px] bg-white rounded-lg p-2 border border-gray-200 mb-3">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-start mb-2",
                      msg.role === 'user' && "justify-end"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-[#4AC1BD] flex items-center justify-center flex-shrink-0 text-white text-xs">
                        AI
                      </div>
                    )}
                    <div 
                      className={cn(
                        "p-2 rounded-lg max-w-[85%]",
                        msg.role === 'assistant' 
                          ? "ml-2 bg-gray-50" 
                          : "mr-2 bg-[#2D3E50] bg-opacity-10"
                      )}
                    >
                      <p className="text-sm text-[#2D3E50]">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-[#2D3E50] flex items-center justify-center flex-shrink-0 text-white text-xs">
                        U
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-start mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#4AC1BD] flex items-center justify-center flex-shrink-0 text-white text-xs">
                      AI
                    </div>
                    <div className="ml-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Ask your AI assistant..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  className="flex-grow rounded-r-none"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-[#4AC1BD] hover:bg-opacity-90 rounded-l-none"
                  disabled={isTyping || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
