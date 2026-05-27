import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface RouteParams {
  id: string;
}

export default function MedicalIntake() {
  const [, params] = useRoute("/patients/:id/intake");
  const patientId = params?.id ? parseInt(params.id) : 0;

  const [intakeId, setIntakeId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [intakeStatus, setIntakeStatus] = useState<"in_progress" | "completed">("in_progress");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createIntakeMutation = trpc.intake.create.useMutation();
  const chatMutation = trpc.intake.chat.useMutation();
  const completeIntakeMutation = trpc.intake.complete.useMutation();

  // Initialize intake session
  useEffect(() => {
    const initializeIntake = async () => {
      try {
        const result = await createIntakeMutation.mutateAsync({
          patientId,
          chiefComplaint: "Patient initiated medical intake",
        });
        // The result is the insert result, get the ID from it
        const newIntakeId = (result as any)[0]?.id || 1;
        setIntakeId(newIntakeId);

        // Load initial greeting from assistant
        const greeting = await chatMutation.mutateAsync({
          medicalIntakeId: newIntakeId,
          patientId,
          message: "Hello, I'm ready to help. What brings you in today?",
        });

        setMessages([
          {
            role: "assistant",
            content: greeting.message || "Hello, I'm here to help collect your medical information. What brings you in today?",
          },
        ]);
      } catch (error) {
        toast.error("Failed to initialize intake session");
      }
    };

    if (patientId && !intakeId) {
      initializeIntake();
    }
  }, [patientId, intakeId, createIntakeMutation, chatMutation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input after response arrives
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !intakeId || isLoading) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        medicalIntakeId: intakeId,
        patientId,
        message: userMessage,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.message }]);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteIntake = async () => {
    if (!intakeId) return;

    try {
      await completeIntakeMutation.mutateAsync({ id: intakeId, patientId });
      setIntakeStatus("completed");
      toast.success("Medical intake completed successfully");
      // Add completion message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thank you for providing your medical information. Your intake has been completed and will be reviewed by your healthcare provider.",
        },
      ]);
    } catch (error) {
      toast.error("Failed to complete intake");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Medical Intake</h1>
            <p className="text-sm text-gray-600 mt-1">AI-Powered Health Information Collection</p>
          </div>
          <div className="flex items-center gap-3">
            {intakeStatus === "completed" ? (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                In Progress
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-md px-4 py-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none shadow-sm flex items-center gap-2">
              <Spinner className="w-4 h-4" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your response here..."
            disabled={isLoading || intakeStatus === "completed"}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || intakeStatus === "completed"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
          {intakeStatus === "in_progress" && (
            <Button
              onClick={handleCompleteIntake}
              variant="outline"
              className="border-gray-300"
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
