"use client"

import type React from "react"
import { useRef, useCallback, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Target, Zap, RotateCcw, BarChart3, Palette, Type } from "lucide-react"
import { useAuth } from "@/context/AuthProvider"
import { PreMadeTest } from "@/lib/types/database"
// Removed Cloud Function imports - now using Next.js API route

interface TypingCustomization {
  theme: string
  font: string
}

export default function TestPage() {
  // Auth and user data
  const { user } = useAuth();
  
  // Core state management
  const router = useRouter();
  const [view, setView] = useState<'config' | 'active' | 'results'>('config');
  const [selectedTime, setSelectedTime] = useState(60);
  const [textToType, setTextToType] = useState("The quick brown fox jumps over the lazy dog. This is a comprehensive typing test designed to evaluate your speed and accuracy. Practice makes perfect when it comes to developing muscle memory for efficient typing. The more you practice, the better you become at typing without looking at the keyboard. Focus on accuracy first, then gradually increase your speed as you become more comfortable with the keyboard layout. Typing is an essential skill in today's digital world, and mastering it can significantly improve your productivity. Whether you're writing emails, coding, or creating documents, good typing skills will save you time and effort. Remember to maintain proper posture while typing and take breaks to avoid strain. The goal is to type smoothly and efficiently without making too many errors. Keep practicing regularly to see continuous improvement in your typing abilities.");
  const [status, setStatus] = useState<'waiting' | 'running' | 'paused' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(60);
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishButtonRef = useRef<HTMLButtonElement>(null);
  const endTestRef = useRef<() => Promise<void>>();

  // Additional UI state for configuration
  const [activeTab, setActiveTab] = useState("practice");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");
  const [topic, setTopic] = useState("");
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [typingCustomization, setTypingCustomization] = useState<TypingCustomization>({
    theme: "default",
    font: "fira-code",
  });

  // Pre-made tests management state
  const [preMadeTests, setPreMadeTests] = useState<PreMadeTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem("zenTypeTheme");
    const savedFont = localStorage.getItem("zenTypeFont");

    if (savedTheme) {
      setTypingCustomization((prev) => ({ ...prev, theme: savedTheme }));
    }
    if (savedFont) {
      setTypingCustomization((prev) => ({ ...prev, font: savedFont }));
    }
  }, []);

  // Fetch pre-made tests from API
  useEffect(() => {
    const fetchTests = async () => {
      // Only fetch for practice tests
      if (activeTab !== 'practice') {
        return;
      }

      setTestsLoading(true);
      setTestsError(null);
      
      try {
        // Construct query string with current filters
        const queryParams = new URLSearchParams();
        
        if (selectedDifficulty) {
          queryParams.append('difficulty', selectedDifficulty);
        }
        
        // Note: We no longer filter by timeLimit since tests are now wordCount-based
        // Users can select their preferred time duration independently of test content

        console.log(`🔍 Fetching tests with params: ${queryParams.toString()}`);
        
        const response = await fetch(`/api/tests?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        console.log(`✅ Fetched ${data.tests?.length || 0} pre-made tests`);
        setPreMadeTests(data.tests || []);
        
      } catch (error) {
        console.error('❌ Error fetching pre-made tests:', error);
        setTestsError(error instanceof Error ? error.message : 'Failed to load tests');
        setPreMadeTests([]);
      } finally {
        setTestsLoading(false);
      }
    };

    fetchTests();
  }, [selectedDifficulty, activeTab]); // Removed selectedTime since tests are now wordCount-based

  // Handle tab switching logic
  useEffect(() => {
    if (activeTab !== 'practice' && selectedTestId) {
      console.log('🔄 Switching away from practice tab - clearing selected test');
      setSelectedTestId(null);
    }
    
    // Only set dummy text when switching TO AI tab, not when staying on practice
    if (activeTab === 'ai' && selectedTestId) {
      console.log('🤖 Switching to AI tab - setting default text');
      setTextToType("The quick brown fox jumps over the lazy dog. This is a comprehensive typing test designed to evaluate your speed and accuracy. Practice makes perfect when it comes to developing muscle memory for efficient typing. The more you practice, the better you become at typing without looking at the keyboard. Focus on accuracy first, then gradually increase your speed as you become more comfortable with the keyboard layout. Typing is an essential skill in today's digital world, and mastering it can significantly improve your productivity. Whether you're writing emails, coding, or creating documents, good typing skills will save you time and effort. Remember to maintain proper posture while typing and take breaks to avoid strain. The goal is to type smoothly and efficiently without making too many errors. Keep practicing regularly to see continuous improvement in your typing abilities.");
      setCurrentTestId(null);
    }
  }, [activeTab, selectedTestId]);

  // Test selection handler
  const handleTestSelection = useCallback((test: PreMadeTest) => {
    console.log('🎯 Test selected:', test.id, 'Source:', test.source, 'WordCount:', test.wordCount);
    console.log('📝 Test text preview:', test.text.substring(0, 100) + '...');
    
    // Update selected test ID
    setSelectedTestId(test.id);
    
    // Update the text to type with selected test content - THIS IS CRITICAL
    setTextToType(test.text);
    console.log('✍️ textToType updated to selected test content');
    
    // Update current test ID (critical for result saving)
    setCurrentTestId(test.id);
    
    // Clear any existing user input and reset typing state
    setUserInput("");
    setCurrentIndex(0);
    setErrors(0);
    setStatus('waiting');
    
    // Reset time based on selected time (not test's recommended time for now)
    setTimeLeft(selectedTime);
    
    console.log('✅ Test selection complete. Current textToType length:', test.text.length);
    console.log('🚀 Ready to start typing the selected test.');
  }, [selectedTime]);

  // Test lifecycle functions
  const endTest = useCallback(async () => {
    // Prevent multiple calls to endTest
    if (status !== 'running') {
      console.log('endTest called but status is not running, ignoring');
      return;
    }
    
    // Immediately set status to prevent race conditions
    setStatus('finished');
    setView('results');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Save test result using Cloud Function if user is authenticated
    if (user) {
      try {
        const timeTaken = Math.max(1, selectedTime - timeLeft); // Ensure minimum 1 second
        
        // Calculate WPM safely - handle division by zero
        let wpm = 0;
        if (timeTaken > 0 && userInput.length > 0) {
          wpm = Math.round((userInput.length / 5) / (timeTaken / 60));
        }
        
        // Calculate accuracy safely - handle division by zero
        let accuracy = 0;
        if (userInput.length > 0) {
          accuracy = Math.round(((userInput.length - errors) / userInput.length) * 100);
        }
        
        // Ensure values are valid numbers (not NaN or Infinity)
        wpm = isNaN(wpm) || !isFinite(wpm) ? 0 : Math.max(0, wpm);
        accuracy = isNaN(accuracy) || !isFinite(accuracy) ? 0 : Math.max(0, Math.min(100, accuracy));
        
        const testResultData = {
          wpm: wpm,
          accuracy: accuracy,
          errors: Math.max(0, errors), // Ensure errors is not negative
          timeTaken: Math.max(0, timeTaken), // Ensure timeTaken is not negative
          textLength: Math.max(0, textToType.length), // Ensure textLength is not negative
          userInput: userInput || '', // Ensure userInput is a string
          testType: 'practice', // Could be 'practice', 'ai-generated', etc.
          difficulty: selectedDifficulty || 'Medium', // Ensure difficulty has a default and matches expected values
          testId: currentTestId || `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Ensure testId exists and is unique
        };
        
        console.log('Submitting test result via API route:', testResultData);
        console.log('Validation check - all values are valid:', {
          wpm: typeof wpm === 'number' && !isNaN(wpm),
          accuracy: typeof accuracy === 'number' && !isNaN(accuracy),
          errors: typeof errors === 'number' && !isNaN(errors),
          timeTaken: typeof timeTaken === 'number' && !isNaN(timeTaken),
          textLength: typeof textToType.length === 'number' && !isNaN(textToType.length)
        });
        console.log('Raw calculation values:', {
          selectedTime,
          timeLeft,
          timeTaken,
          userInputLength: userInput.length,
          errors,
          textToTypeLength: textToType.length
        });
        
        // Call the Next.js API route instead of Cloud Function
        const response = await fetch('/api/submit-test-result', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify(testResultData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to save test result');
        }
        
        console.log('Test result submitted successfully:', result);
        
        // Show success feedback to user
        // TODO: Add toast notification for better UX
        
      } catch (error) {
        console.error('Error submitting test result:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        
        // Show error feedback to user
        // TODO: Add error toast notification
        alert(`Failed to save test result: ${error.message || 'Unknown error'}. Please try again.`);
      }
    } else {
      console.log('User not authenticated, not saving test result');
    }
  }, [user, selectedTime, timeLeft, userInput, textToType, errors, selectedDifficulty, currentTestId, status]);

  // Update the ref whenever endTest changes
  useEffect(() => {
    endTestRef.current = endTest;
  }, [endTest]);

  // Simple timer logic - starts when status is 'running', stops when not
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Call endTest via ref when timer ends - this ensures proper state without dependency issues
            if (endTestRef.current) {
              endTestRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status]); // ← CRITICAL: Only depend on status, use ref for endTest

  const startTest = useCallback(() => {
    setUserInput("");
    setCurrentIndex(0);
    setErrors(0);
    setTimeLeft(selectedTime);
    setStatus('waiting');
    setView('active');
    
    // Generate a test ID for practice tests
    // For now, we'll use a simple timestamp-based ID
    // In the future, this could be a proper PreMadeTest ID
    const testId = `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentTestId(testId);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [selectedTime]);

  const tryAgain = useCallback(() => {
    setView('config');
    setStatus('waiting');
  }, []);

  // Core typing engine - SIMPLE AND RELIABLE
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    
    const key = event.key;

    // ENTER KEY STARTS THE TIMER
    if (key === 'Enter' && status === 'waiting') {
      setStatus('running');
      return;
    }

    // Don't process other keys if not running
    if (status !== 'running') {
      return;
    }

    // Handle character input
    if (key.length === 1) {
      const targetChar = textToType[currentIndex];
      const isCorrect = key === targetChar;
      
      if (!isCorrect) {
        setErrors(prev => prev + 1);
      }
      
      setUserInput(prev => prev + key);
      setCurrentIndex(prev => prev + 1);
      
      // Check if test is complete
      if (currentIndex + 1 >= textToType.length && status === 'running') {
        endTest();
      }
    }
    
    // Handle backspace
    else if (key === 'Backspace') {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setUserInput(prev => prev.slice(0, -1));
      }
    }
  }, [status, textToType, currentIndex, endTest]);

  // Pause/Resume toggle
  const togglePause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('running');
    }
  }, [status]);

  // Calculate stats
  const wpm = status === 'running' && timeLeft < selectedTime
    ? Math.round((userInput.length / 5) / ((selectedTime - timeLeft) / 60))
    : 0;
  
  const accuracy = userInput.length > 0
    ? Math.round(((userInput.length - errors) / userInput.length) * 100)
    : 100;

  // Render text with character highlighting
  const renderText = () => {
    return textToType.split('').map((char, index) => {
      let className = "transition-colors duration-150";
      
      if (index < currentIndex) {
        // Already typed characters
        const typedChar = userInput[index];
        className += typedChar === char ? " text-green-500" : " text-red-500";
      } else if (index === currentIndex && status === 'running') {
        // Current character with cursor
        className += " text-foreground bg-[#00BFFF]/20 border-b-2 border-[#00BFFF]";
      } else {
        // Future characters
        className += " text-muted-foreground";
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Configuration constants
  const timeOptions = ["30", "60", "120", "300"];
  const difficultyOptions = ["Easy", "Medium", "Hard"];

  const typingThemes = [
    { id: "default", name: "Default", gradient: "from-background to-background", textColor: "text-foreground" },
    { id: "neon-wave", name: "Neon Wave", gradient: "from-purple-900/20 to-cyan-900/20", textColor: "text-cyan-300" },
    { id: "sunset", name: "Sunset", gradient: "from-orange-900/20 to-pink-900/20", textColor: "text-orange-200" },
    { id: "forest", name: "Forest", gradient: "from-green-900/20 to-emerald-900/20", textColor: "text-green-200" },
    { id: "ocean", name: "Ocean", gradient: "from-blue-900/20 to-teal-900/20", textColor: "text-blue-200" },
    { id: "midnight", name: "Midnight", gradient: "from-slate-900/40 to-indigo-900/40", textColor: "text-slate-200" },
  ];

  const fontOptions = [
    { id: "fira-code", name: "Fira Code", className: "font-mono" },
    { id: "jetbrains-mono", name: "JetBrains Mono", className: "font-mono" },
    { id: "source-code-pro", name: "Source Code Pro", className: "font-mono" },
    { id: "roboto-mono", name: "Roboto Mono", className: "font-mono" },
    { id: "ubuntu-mono", name: "Ubuntu Mono", className: "font-mono" },
  ];

  const currentTheme = typingThemes.find((t) => t.id === typingCustomization.theme) || typingThemes[0];
  const currentFont = fontOptions.find((f) => f.id === typingCustomization.font) || fontOptions[0];

  // Configuration View
  if (view === 'config') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">Configure Your Test</h1>
              <p className="text-muted-foreground">
                Customize your typing test settings for the perfect practice session
              </p>
            </div>
            <GlassCard className="space-y-8">
              <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                if (value === "practice") setTopic("");
              }}>
                <TabsList className="grid w-full grid-cols-2 bg-accent">
                  <TabsTrigger
                    value="practice"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Practice Test
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    AI-Generated Test
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="practice" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground text-lg mb-3 block">
                        <Clock className="inline mr-2 h-5 w-5" />
                        Time
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {timeOptions.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === parseInt(time) ? "default" : "outline"}
                            onClick={() => setSelectedTime(parseInt(time))}
                            className={
                              selectedTime === parseInt(time)
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "border-border text-foreground hover:bg-accent"
                            }
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground text-lg mb-3 block">
                        <Target className="inline mr-2 h-5 w-5" />
                        Difficulty
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {difficultyOptions.map((difficulty) => (
                          <Button
                            key={difficulty}
                            variant={selectedDifficulty === difficulty ? "default" : "outline"}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={
                              selectedDifficulty === difficulty
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "border-border text-foreground hover:bg-accent"
                            }
                          >
                            {difficulty}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Test Selection Section */}
                    <div>
                      <Label className="text-foreground text-lg mb-3 block">
                        <Type className="inline mr-2 h-5 w-5" />
                        Choose Test
                      </Label>
                      
                      {testsLoading && (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="ml-3 text-muted-foreground">Loading tests...</span>
                        </div>
                      )}
                      
                      {testsError && (
                        <div className="text-center py-8">
                          <p className="text-destructive mb-4">❌ {testsError}</p>
                          <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()}
                            className="border-border text-foreground hover:bg-accent"
                          >
                            Try Again
                          </Button>
                        </div>
                      )}
                      
                      {!testsLoading && !testsError && preMadeTests.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">No tests available for the current filters.</p>
                          <p className="text-sm text-muted-foreground">Try changing the difficulty or time settings.</p>
                        </div>
                      )}
                      
                      {!testsLoading && !testsError && preMadeTests.length > 0 && (
                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                          {preMadeTests.map((test) => (
                            <div
                              key={test.id}
                              className={`
                                p-4 rounded-lg border cursor-pointer transition-all duration-200
                                ${selectedTestId === test.id
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                  : 'border-border hover:border-primary/50 hover:bg-accent'
                                }
                              `}
                              onClick={() => handleTestSelection(test)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{test.source}</span>
                                  <span className={`
                                    px-2 py-1 rounded text-xs font-medium
                                    ${test.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                      test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                    }
                                  `}>
                                    {test.difficulty}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">{test.wordCount} words</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {test.text.substring(0, 120)}...
                              </p>
                              {selectedTestId === test.id && (
                                <div className="mt-2 text-sm text-primary font-medium">
                                  ✓ Selected - Ready to start typing
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="ai" className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground text-lg mb-3 block">
                        <Clock className="inline mr-2 h-5 w-5" />
                        Time
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {timeOptions.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === parseInt(time) ? "default" : "outline"}
                            onClick={() => setSelectedTime(parseInt(time))}
                            className={
                              selectedTime === parseInt(time)
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "border-border text-foreground hover:bg-accent"
                            }
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground text-lg mb-3 block">
                        <Target className="inline mr-2 h-5 w-5" />
                        Difficulty
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {difficultyOptions.map((difficulty) => (
                          <Button
                            key={difficulty}
                            variant={selectedDifficulty === difficulty ? "default" : "outline"}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={
                              selectedDifficulty === difficulty
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "border-border text-foreground hover:bg-accent"
                            }
                          >
                            {difficulty}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="topic" className="text-foreground text-lg mb-3 block">
                        <Zap className="inline mr-2 h-5 w-5" />
                        Topic
                      </Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Technology, Nature, History"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="bg-accent border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <Button
                onClick={startTest}
                disabled={activeTab === 'practice' && !selectedTestId}
                className={`
                  w-full text-xl py-6
                  ${activeTab === 'practice' && !selectedTestId
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }
                `}
              >
                {activeTab === 'practice' && !selectedTestId 
                  ? 'Select a test to begin'
                  : 'Start Typing'
                }
              </Button>
            </GlassCard>
          </div>
        </main>
      </div>
    );
  }

  // Active Typing View
  if (view === 'active') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{wpm}</div>
                <div className="text-muted-foreground text-sm">WPM</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{accuracy}%</div>
                <div className="text-muted-foreground text-sm">Accuracy</div>
              </GlassCard>
              <GlassCard className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{formatTime(timeLeft)}</div>
                <div className="text-muted-foreground text-sm">Time</div>
              </GlassCard>
            </div>

            <div className="flex justify-end space-x-4">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={typingCustomization.theme}
                  onValueChange={(value) => {
                    setTypingCustomization((prev) => ({ ...prev, theme: value }));
                    localStorage.setItem("zenTypeTheme", value);
                  }}
                >
                  <SelectTrigger className="w-32 h-8 text-xs glass-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border">
                    {typingThemes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id} className="text-xs">
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={typingCustomization.font}
                  onValueChange={(value) => {
                    setTypingCustomization((prev) => ({ ...prev, font: value }));
                    localStorage.setItem("zenTypeFont", value);
                  }}
                >
                  <SelectTrigger className="w-32 h-8 text-xs glass-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-border">
                    {fontOptions.map((font) => (
                      <SelectItem key={font.id} value={font.id} className={`text-xs ${font.className}`}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={`p-8 cursor-text bg-gradient-to-br ${currentTheme.gradient} glass-card rounded-lg border border-border/50 backdrop-blur-sm`}
              onClick={() => inputRef.current?.focus()}
            >
              <div
                className={`text-xl leading-relaxed mb-6 select-none ${currentFont.className} ${currentTheme.textColor} word-wrap break-word overflow-wrap break-word`}
                style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
              >
                {renderText()}
              </div>

              <input
                ref={inputRef}
                className="absolute opacity-0 pointer-events-none"
                onKeyDown={handleKeyDown}
                autoFocus
                value=""
                onChange={() => {}}
                style={{ left: "-9999px" }}
              />

              <div className="h-1 bg-border rounded-full mb-4">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(currentIndex / textToType.length) * 100}%` }}
                ></div>
              </div>

              <div className="text-center text-muted-foreground">
                {status === 'waiting' ? (
                  <p className="text-sm">Press <strong>ENTER</strong> to start the test, then begin typing</p>
                ) : (
                  <p className="text-sm">Click here and start typing to continue the test</p>
                )}
              </div>
            </div>

            {/* Virtual Keyboard */}
            <GlassCard className="p-6">
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((key) => (
                    <div
                      key={key}
                      className="w-10 h-10 bg-accent rounded flex items-center justify-center text-foreground text-sm"
                    >
                      {key}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-1">
                  {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((key) => (
                    <div
                      key={key}
                      className="w-10 h-10 bg-accent rounded flex items-center justify-center text-foreground text-sm"
                    >
                      {key}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-1">
                  {["Z", "X", "C", "V", "B", "N", "M"].map((key) => (
                    <div
                      key={key}
                      className="w-10 h-10 bg-accent rounded flex items-center justify-center text-foreground text-sm"
                    >
                      {key}
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <div className="w-64 h-10 bg-accent rounded flex items-center justify-center text-foreground text-sm">
                    SPACE
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-center gap-4">
              <Button
                onClick={togglePause}
                variant="outline"
                className="border-border text-foreground hover:bg-accent bg-transparent"
              >
                {status === 'running' ? 'Pause' : 'Resume'}
              </Button>
              <Button
                ref={finishButtonRef}
                onClick={endTest}
                variant="outline"
                className="border-border text-foreground hover:bg-accent bg-transparent"
              >
                Finish Test
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Results View
  if (view === 'results') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">Test Complete!</h1>
              <p className="text-muted-foreground">Here's how you performed</p>
            </div>
            <GlassCard className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{wpm}</div>
                  <div className="text-foreground">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{accuracy}%</div>
                  <div className="text-foreground">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{errors}</div>
                  <div className="text-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{formatTime(selectedTime - timeLeft)}</div>
                  <div className="text-foreground">Time Taken</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={tryAgain}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline" 
                  className="flex-1 border-border text-foreground hover:bg-accent bg-transparent"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </GlassCard>
          </div>
        </main>
      </div>
    );
  }

  return null;
}