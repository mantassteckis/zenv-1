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
import { httpsCallable } from "firebase/functions"
import { functions } from "@/lib/firebase/client"
import { useDebugLogger } from "@/context/DebugProvider"
import { useCorrelationId } from "@/hooks/useCorrelationId"
// Removed Cloud Function imports - now using Next.js API route

interface TypingCustomization {
  theme: string
  font: string
}

export default function TestPage() {
  // Auth and user data
  const { user, profile, isLoading } = useAuth();
  
  // Debug logging
  const debugLogger = useDebugLogger();
  
  // Correlation ID for request tracing
  const { correlationId, getHeaders } = useCorrelationId();
  
  // Core state management
  const router = useRouter();
  const [view, setView] = useState<'config' | 'active' | 'results'>('config');
  const [selectedTime, setSelectedTime] = useState(60);
  const [textToType, setTextToType] = useState("");
  const [status, setStatus] = useState<'waiting' | 'running' | 'paused' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(60);
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  
  // Final test results state
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);

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

  // AI-generated tests state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTest, setAiTest] = useState<any>(null); // Generated test object

  // Client-side mount state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load saved preferences (only after mount)
  useEffect(() => {
    if (!isMounted) return;
    
    const savedTheme = localStorage.getItem("zenTypeTheme");
    const savedFont = localStorage.getItem("zenTypeFont");

    if (savedTheme) {
      setTypingCustomization((prev) => ({ ...prev, theme: savedTheme }));
    }
    if (savedFont) {
      setTypingCustomization((prev) => ({ ...prev, font: savedFont }));
    }
  }, [isMounted]);

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
        
        if (selectedTime) {
          queryParams.append('timeLimit', selectedTime.toString());
        }

        console.log(`🔍 Fetching tests with params: ${queryParams.toString()}`);
        
        const response = await fetch(`/api/tests?${queryParams.toString()}`, {
          headers: getHeaders()
        });
        
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
  }, [selectedDifficulty, selectedTime, activeTab]); // Now filtering by both difficulty and time

  // Handle tab switching logic
  useEffect(() => {
    if (activeTab !== 'practice' && selectedTestId) {
      console.log('🔄 Switching away from practice tab - clearing selected test');
      setSelectedTestId(null);
    }
    
    // Handle AI tab switching - restore AI test content if available
    if (activeTab === 'ai') {
      if (selectedTestId) {
        console.log('🤖 Switching to AI tab - clearing practice test selection');
        setSelectedTestId(null);
      }
      
      // Restore AI test content if we have one
      if (aiTest && aiTest.text) {
        console.log('🔄 Restoring AI test content on tab switch', {
          aiTestId: aiTest.id,
          textLength: aiTest.text.length
        });
        setTextToType(aiTest.text);
        setCurrentTestId(aiTest.id);
      } else {
        // Clear content if no AI test available
        setTextToType("");
        setCurrentTestId(null);
      }
    }
  }, [activeTab, selectedTestId, aiTest]);

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

  // AI Test Generation Handler
  const handleGenerateAiTest = useCallback(async () => {
    debugLogger.info('AI_GENERATION', 'Starting AI test generation process', {
      hasUser: !!user,
      topic: topic.trim(),
      userInterests: profile?.interests || [],
      selectedDifficulty,
      selectedTime
    }, 'app/test/page.tsx:handleGenerateAiTest');

    if (!user) {
      debugLogger.error('AI_GENERATION', 'User not authenticated', { user }, 'app/test/page.tsx:handleGenerateAiTest');
      alert('Please sign in to generate AI tests');
      return;
    }

    if (!topic.trim()) {
      debugLogger.warn('AI_GENERATION', 'Topic is empty or whitespace only', { topic }, 'app/test/page.tsx:handleGenerateAiTest');
      alert('Please enter a topic for the AI test');
      return;
    }

    debugLogger.info('AI_GENERATION', 'Input validation passed, starting generation', {
      userId: user.uid,
      topicLength: topic.trim().length,
      userInterests: profile?.interests || [],
      difficulty: selectedDifficulty,
      timeLimit: selectedTime
    }, 'app/test/page.tsx:handleGenerateAiTest');

    setIsGenerating(true);
    setAiTest(null);

    try {
      // Get user's autoSaveAiTests preference (default to false)
      const autoSaveAiTests = profile?.settings?.autoSaveAiTests || false;
      
      debugLogger.info('AI_GENERATION', 'Retrieved user preferences', {
        userId: user.uid,
        autoSaveAiTests,
        hasProfile: !!profile,
        hasSettings: !!profile?.settings,
        userInterests: profile?.interests || []
      }, 'app/test/page.tsx:handleGenerateAiTest');

      // Prepare request data
      const requestData = {
        topic: topic.trim(),
        difficulty: selectedDifficulty,
        timeLimit: selectedTime,
        saveTest: autoSaveAiTests,
        userInterests: profile?.interests || []
      };

      debugLogger.info('AI_GENERATION', 'Preparing to call Cloud Function', {
        requestData
      }, 'app/test/page.tsx:handleGenerateAiTest');

      // Call the Cloud Function
      const generateAiTest = httpsCallable(functions, 'generateAiTest');
      
      debugLogger.debug('AI_GENERATION', 'Calling Cloud Function', {
        topic: requestData.topic,
        difficulty: requestData.difficulty,
        timeLimit: requestData.timeLimit,
        userInterests: requestData.userInterests
      }, 'app/test/page.tsx:handleGenerateAiTest');

      // Call the Cloud Function
      const result = await generateAiTest(requestData);
      const data = result.data as any;

      debugLogger.info('AI_GENERATION', 'Cloud Function response received', {
        success: data?.success,
        textLength: data?.text?.length || 0,
        wordCount: data?.wordCount || 0,
        testId: data?.testId || 'unknown'
      }, 'app/test/page.tsx:handleGenerateAiTest');
      
      debugLogger.debug('AI_GENERATION', 'Processing generated text', {
        dataType: typeof data,
        dataKeys: Object.keys(data),
        hasText: !!(data?.text),
        textLength: data?.text?.length || 0,
        hasTestId: !!(data?.testId),
        success: data?.success
      }, 'app/test/page.tsx:handleGenerateAiTest');

      // If there's a local text generation fallback, use a different variable name
      // const data = { ... } // This line causes the duplicate variable error
      // Use localData instead if you need a fallback

      if (!data.text) {
        debugLogger.error('AI_GENERATION', 'No text content generated', { data }, 'app/test/page.tsx:handleGenerateAiTest');
        throw new Error('No text content generated');
      }

      // Create test object similar to PreMadeTest structure
      const generatedTest = {
        id: data.testId || `ai_${Date.now()}`,
        text: data.text,
        difficulty: selectedDifficulty,
        category: 'ai_generated',
        source: 'AI Generated',
        wordCount: data.wordCount || data.text.split(' ').length,
        timeLimit: selectedTime,
        topic: topic.trim(),
        saved: data.saved || false
      };

      debugLogger.info('AI_GENERATION', 'Generated test object created', {
        testId: generatedTest.id,
        textLength: generatedTest.text.length,
        wordCount: generatedTest.wordCount,
        saved: generatedTest.saved,
        category: generatedTest.category
      }, 'app/test/page.tsx:handleGenerateAiTest');

      console.log('🤖 AI-generated text preview:', data.text.substring(0, 100) + '...');
      
      setAiTest(generatedTest);
      console.log('✅ AI test object created and set to state');
      
      // Auto-select the AI test for better UX (user doesn't need to click the card)
      console.log('🤖 Auto-selecting the generated AI test');
      setTextToType(generatedTest.text);
      setCurrentTestId(generatedTest.id);
      console.log('🤖 AI test auto-selected with text length:', generatedTest.text.length);
      debugLogger.info('AI_GENERATION', 'AI test generation completed successfully', {
        testReady: true,
        testId: generatedTest.id
      }, 'app/test/page.tsx:handleGenerateAiTest');

    } catch (error: any) {
      debugLogger.critical('AI_GENERATION', 'AI test generation failed', {
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        errorDetails: error?.details,
        stack: error?.stack,
        userId: user?.uid,
        topic: topic.trim(),
        difficulty: selectedDifficulty
      }, 'app/test/page.tsx:handleGenerateAiTest');

      // Show user-friendly error message
      const userMessage = error?.message || 'Unknown error occurred during test generation';
      alert(`Failed to generate test: ${userMessage}`);
    } finally {
      setIsGenerating(false);
      debugLogger.debug('AI_GENERATION', 'AI generation process ended', {
        isGenerating: false
      }, 'app/test/page.tsx:handleGenerateAiTest');
    }
  }, [user, topic, selectedDifficulty, selectedTime, debugLogger]);

  // AI Test Selection Handler
  const handleAiTestSelection = useCallback(() => {
    console.log('🤖 AI TEST CARD CLICKED - Selection started', { 
      hasAiTest: !!aiTest, 
      testId: aiTest?.id,
      currentTab: activeTab,
      timestamp: new Date().toISOString()
    });

    if (!aiTest) {
      console.warn('❌ CRITICAL: No AI test available for selection');
      return;
    }

    console.log('🔍 BEFORE TEXT UPDATE - Current state:', {
      aiTestId: aiTest.id,
      aiTestTopic: aiTest.topic,
      aiTextLength: aiTest.text?.length,
      aiTextPreview: `"${aiTest.text.substring(0, 50)}..."`,
      currentTextToType: `"${textToType.substring(0, 50)}..."`,
      currentTextLength: textToType.length,
      isCurrentlyDummy: textToType.includes('The quick brown fox'),
      areTextsEqual: textToType === aiTest.text
    });
    
    // Update the text to type with AI generated content
    console.log('🔄 UPDATING textToType with AI content...');
    setTextToType(aiTest.text);
    
    console.log('🆔 UPDATING currentTestId...');
    setCurrentTestId(aiTest.id);
    
    // Clear any existing user input and reset typing state
    console.log('🔄 RESETTING typing state...');
    setUserInput("");
    setCurrentIndex(0);
    setErrors(0);
    setStatus('waiting');
    setTimeLeft(selectedTime);
    
    console.log('✅ AI TEST SELECTION COMPLETE - State updates dispatched', {
      newTestId: aiTest.id,
      newTextLength: aiTest.text.length,
      resetComplete: true
    });
    
    // Auto-select the AI test if there's no current text (for better UX)
    if (!textToType || textToType.length === 0) {
      console.log('🤖 Auto-selecting AI test since no text is set');
      // No need for timeout since we're in the same function
      // The text will be set synchronously above
    }
    
    // Verify state update worked (React state updates are async)
    setTimeout(() => {
      console.log('🔍 VERIFICATION: Checking if textToType was actually updated:', {
        currentTextToType: `"${textToType.substring(0, 50)}..."`,
        expectedAiText: `"${aiTest.text.substring(0, 50)}..."`,
        wasUpdated: textToType === aiTest.text,
        stillDummy: textToType.includes('The quick brown fox')
      });
    }, 100);
  }, [aiTest, selectedTime, textToType, activeTab]);

  // Add a ref to track if test is already being ended
  const isEndingTestRef = useRef(false);

  // Test lifecycle functions
  const endTest = useCallback(async () => {
    // Prevent multiple calls to endTest with double protection
    if (status !== 'running') {
      console.log('🛑 endTest called but status is not running, ignoring:', status);
      return;
    }

    // Second layer of protection - check if already ending
    if (isEndingTestRef.current) {
      console.log('🛑 endTest already in progress, preventing duplicate call');
      return;
    }

    // Set flag immediately to prevent concurrent calls
    isEndingTestRef.current = true;
    console.log('🏁 endTest started - setting flags to prevent duplicates');
    
    // Immediately set status to prevent race conditions
    setStatus('finished');
    setView('results');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Calculate final results for display (for both authenticated and guest users)
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
    
    // Save final results to state for display
    setFinalWpm(wpm);
    setFinalAccuracy(accuracy);

    // Save test result using Cloud Function if user is authenticated
    if (user) {
      try {
        
        const testResultData = {
          wpm: wpm,
          accuracy: accuracy,
          errors: Math.max(0, errors), // Ensure errors is not negative
          timeTaken: Math.max(0, timeTaken), // Ensure timeTaken is not negative
          textLength: Math.max(0, textToType.length), // Ensure textLength is not negative
          userInput: userInput || '', // Ensure userInput is a string
          testType: activeTab === 'ai' ? 'ai-generated' : 'practice', // Dynamic test type based on active tab
          difficulty: selectedDifficulty || 'Medium', // Ensure difficulty has a default and matches expected values
          testId: currentTestId || `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Ensure testId exists and is unique
        };
        
        console.log('💾 SUBMITTING TEST RESULT via API route:', {
          ...testResultData,
          isAiGenerated: activeTab === 'ai',
          hasAiTest: !!aiTest,
          aiTestId: aiTest?.id,
          aiTestTopic: aiTest?.topic
        });
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
          headers: getHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          }),
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error details:', {
          code: error instanceof Error ? (error as any).code : undefined,
          message: errorMessage,
          details: error instanceof Error ? (error as any).details : undefined
        });
        
        // Show error feedback to user
        // TODO: Add error toast notification
        alert(`Failed to save test result: ${errorMessage}. Please try again.`);
      }
    } else {
      console.log('User not authenticated, not saving test result');
    }

    // Reset the ending flag at the very end
    isEndingTestRef.current = false;
    console.log('✅ endTest completed - reset ending flag');
  }, [user, selectedTime, timeLeft, userInput, textToType, errors, selectedDifficulty, currentTestId, status]);

  // Update the ref whenever endTest changes
  useEffect(() => {
    endTestRef.current = endTest;
  }, [endTest]);

  // Track textToType state changes for critical debugging
  useEffect(() => {
    console.log('🔄 textToType STATE CHANGED:', {
      newLength: textToType.length,
      isDummyText: textToType.includes('The quick brown fox'),
      isAiText: !textToType.includes('The quick brown fox') && textToType.length > 100,
      preview: `"${textToType.substring(0, 50)}..."`,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' | ')
    });
  }, [textToType]);

  useEffect(() => {
    if (debugLogger.isDebugEnabled && aiTest) {
      console.log('🔍 DEBUG: aiTest updated', {
        testId: aiTest.id,
        textLength: aiTest.text?.length || 0,
        topic: aiTest.topic
      });
    }
  }, [aiTest, debugLogger]);

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
    console.log('🚀 START TYPING CLICKED - Starting test with current state:', {
      textToTypePreview: `"${textToType.substring(0, 50)}..."`,
      textToTypeLength: textToType.length,
      isDummyText: textToType.includes('The quick brown fox'),
      isAiText: !textToType.includes('The quick brown fox') && textToType.length > 100,
      hasAiTest: !!aiTest,
      aiTestId: aiTest?.id,
      currentTestId: currentTestId,
      activeTab,
      timestamp: new Date().toISOString()
    });
    
    // Reset the ending flag for new test (prevent issues from previous test)
    isEndingTestRef.current = false;
    console.log('🔄 Reset ending flag for new test');
    
    // CRITICAL CHECK: If we're in AI tab but still have dummy text, something is wrong
    if (activeTab === 'ai' && textToType.includes('The quick brown fox')) {
      console.error('🚨 CRITICAL ISSUE: AI tab selected but textToType still contains dummy text!');
      console.error('🚨 AI Test State:', {
        aiTest: aiTest ? {
          id: aiTest.id,
          textLength: aiTest.text?.length,
          textPreview: aiTest.text?.substring(0, 50)
        } : 'null'
      });
    }
    
    setUserInput("");
    setCurrentIndex(0);
    setErrors(0);
    setTimeLeft(selectedTime);
    setStatus('waiting');
    setView('active');
    
    // Generate a test ID for practice tests only (don't override AI test IDs)
    if (activeTab === 'practice' || !currentTestId) {
      const testId = `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentTestId(testId);
      console.log('🆔 Generated new practice test ID:', testId);
    } else {
      console.log('🆔 Keeping existing test ID (AI test):', currentTestId);
    }
    
    console.log('✅ START TEST COMPLETE - View switched to active', {
      finalTextPreview: `"${textToType.substring(0, 50)}..."`,
      finalTextLength: textToType.length,
      finalTestId: currentTestId,
      readyToType: true
    });
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [selectedTime, textToType, aiTest, activeTab, currentTestId]);

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

  // Early return for loading state to prevent hydration issues
  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Calculate stats
  const wpm = status === 'running' && timeLeft < selectedTime
    ? Math.round((userInput.length / 5) / ((selectedTime - timeLeft) / 60))
    : 0;
  
  const accuracy = userInput.length > 0
    ? Math.round(((userInput.length - errors) / userInput.length) * 100)
    : 100;

  // Render text with character highlighting
  const renderText = () => {
    // One-time diagnostic to track what's being rendered (prevent infinite loops)
    if (textToType.length > 0) {
      const textSignature = textToType.substring(0, 20);
      if ((window as any).zenTypeLastRenderLog !== textSignature) {
        console.log('🎨 RENDERING TEXT - What user sees:', {
          textLength: textToType.length,
          textPreview: `"${textToType.substring(0, 50)}..."`,
          isDummyText: textToType.includes('The quick brown fox'),
          isAiContent: !textToType.includes('The quick brown fox') && textToType.length > 100,
          currentTab: activeTab,
          hasAiTest: !!aiTest,
          aiTestId: aiTest?.id,
          timestamp: new Date().toISOString()
        });
        (window as any).zenTypeLastRenderLog = textSignature;
      }
    }
    
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
                                <div className="text-sm text-muted-foreground">
                                  <span>{test.wordCount} words</span>
                                  <span className="mx-2">•</span>
                                  <span>{test.timeLimit < 60 ? `${test.timeLimit}s` : `${test.timeLimit / 60}m`}</span>
                                </div>
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
                    
                    {/* AI Generation Section */}
                    {!isGenerating && !aiTest && (
                      <div className="mt-4">
                        <Button
                          onClick={handleGenerateAiTest}
                          disabled={!topic.trim() || isGenerating}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                          {isGenerating ? 'Generating...' : 'Generate Test'}
                        </Button>
                      </div>
                    )}
                    
                    {/* Loading Animation */}
                    {isGenerating && (
                      <div className="mt-4 text-center space-y-4">
                        <div className="animate-pulse">
                          <div className="flex justify-center mb-4">
                            <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full animate-bounce"></div>
                          </div>
                          <p className="text-foreground text-lg">Your expert typing coach is generating a new test...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Generated Test Display */}
                    {console.log('🔍 AI TEST CARD RENDER CHECK:', {
                      hasAiTest: !!aiTest,
                      aiTestId: aiTest?.id,
                      isGenerating,
                      shouldShowCard: aiTest && !isGenerating,
                      topic,
                      aiTestTextLength: aiTest?.text?.length,
                      timestamp: new Date().toISOString()
                    })}
                    {aiTest && !isGenerating && (
                      <div className="mt-4">
                        {/* AI Test Card Rendering */}
                        <GlassCard 
                          className={`p-4 border-2 cursor-pointer transition-all duration-200 hover:border-primary/50`}
                          onClick={(e) => {
                            console.log('🔥 AI TEST CARD CLICKED! Event triggered:', {
                              aiTestId: aiTest?.id,
                              eventType: e.type,
                              timestamp: new Date().toISOString()
                            });
                            handleAiTestSelection();
                          }}
                          style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }} // Temporary red tint for visibility
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">AI Generated: {topic}</h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedDifficulty} • ~{aiTest?.wordCount || 100} words
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {aiTest?.text?.substring(0, 100)}...
                          </p>
                        </GlassCard>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <Button
                onClick={() => {
                  console.log('🚀 START TYPING BUTTON CLICKED:', {
                    textToType: textToType || 'EMPTY',
                    textLength: textToType?.length || 0,
                    hasText: !!textToType && textToType.length > 0,
                    currentActiveTab: activeTab,
                    hasAiTest: !!aiTest,
                    aiTestId: aiTest?.id,
                    selectedTestId: selectedTestId || 'none',
                    shouldBeDisabled: (activeTab === 'practice' && !selectedTestId) || (activeTab === 'ai' && !aiTest),
                    timestamp: new Date().toISOString()
                  });
                  startTest();
                }}
                disabled={
                  (activeTab === 'practice' && !selectedTestId) || 
                  (activeTab === 'ai' && !aiTest)
                }
                className={`
                  w-full text-xl py-6
                  ${((activeTab === 'practice' && !selectedTestId) || (activeTab === 'ai' && !aiTest))
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }
                `}
              >
                {activeTab === 'practice' && !selectedTestId 
                  ? 'Select a test to begin'
                  : activeTab === 'ai' && !aiTest
                  ? 'Generate a test to begin'
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
                  <div className="text-4xl font-bold text-primary mb-2">{finalWpm}</div>
                  <div className="text-foreground">WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{finalAccuracy}%</div>
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