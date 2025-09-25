"use client"

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDebug } from '@/context/DebugProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Bug, X, Download, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, 
  Filter, Search, AlertCircle, Info, AlertTriangle, Zap, Clock,
  Database, Globe, User, Settings, TestTube, Brain, Play, Send,
  BarChart3, FileText, Layers, Target, Trophy
} from 'lucide-react';
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },
  'SYSTEM': { icon: Settings, color: 'text-gray-500', description: 'System-level operations' },
  'USER_INTERACTION': { icon: Target, color: 'text-emerald-400', description: 'User clicks and inputs' },
  'RATE_LIMITING': { icon: Clock, color: 'text-amber-400', description: 'Rate limiting operations and monitoring' },
  'LEADERBOARD': { icon: Trophy, color: 'text-gold-400', description: 'Leaderboard operations and ranking updates' }
};
import type { DebugLevel, DebugCategory } from '@/context/DebugProvider';

interface CategoryConfig {
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'AI_GENERATION': { icon: Brain, color: 'text-purple-400', description: 'AI test generation flow' },
  'PRACTICE_TEST': { icon: TestTube, color: 'text-green-400', description: 'Practice test operations' },
  'TEST_SUBMISSION': { icon: Send, color: 'text-blue-400', description: 'Test submission tracking' },
  'CONSOLE_ERRORS': { icon: AlertCircle, color: 'text-red-400', description: 'Console errors and warnings' },
  'DEBUG_SYSTEM': { icon: Settings, color: 'text-gray-400', description: 'Debug utility operations' },
  'AUTH': { icon: User, color: 'text-yellow-400', description: 'Authentication operations' },
  'API': { icon: Globe, color: 'text-cyan-400', description: 'API requests and responses' },
  'FIREBASE': { icon: Database, color: 'text-orange-400', description: 'Firebase operations' },
  'UI': { icon: Layers, color: 'text-indigo-400', description: 'User interface interactions' },
  'PERFORMANCE': { icon: BarChart3, color: 'text-pink-400', description: 'Performance monitoring' },