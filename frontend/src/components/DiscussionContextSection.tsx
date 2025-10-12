'use client';

import { useState, useEffect } from 'react';
import { useRawData, useSimulationMetadata } from '@/lib/DataStore';
import { useSimulation } from '@/context/SimulationContext';

export default function DiscussionContextSection() {
  const epochData = useRawData();
  const metadata = useSimulationMetadata();
  const { state: simulationState } = useSimulation();
  const [currentDebateIndex, setCurrentDebateIndex] = useState(0);

  // Get all statements in correct hierarchical order: Epoch → Topics → Questions → Responses
  const getAllStatements = () => {
    if (!epochData?.debates) return [];
    
    const allStatements: Array<{
      statement: any;
      topicIndex: number;
      questionIndex: number;
      statementIndex: number;
      topicId: string;
      questionId: string;
    }> = [];
    
    // Group debates by topic first
    const debatesByTopic = epochData.debates.reduce((acc, debate) => {
      if (!acc[debate.topic_id]) {
        acc[debate.topic_id] = [];
      }
      acc[debate.topic_id].push(debate);
      return acc;
    }, {} as Record<string, typeof epochData.debates>);

    // Process topics in order
    Object.entries(debatesByTopic).forEach(([topicId, debates]) => {
      const topicIndex = metadata?.topics.findIndex(t => t.id === topicId) || 0;
      
      // Process questions within each topic in order
      debates.forEach((debate, questionIndex) => {
        // Process statements within each question in order
        debate.statements.forEach((statement, statementIndex) => {
          allStatements.push({
            statement,
            topicIndex,
            questionIndex,
            statementIndex,
            topicId,
            questionId: debate.question.id
          });
        });
      });
    });
    
    return allStatements;
  };

  // Track current debate based on simulation progress
  useEffect(() => {
    if (!simulationState.isPlaying || !epochData?.debates) {
      setCurrentDebateIndex(0);
      return;
    }

    // Calculate which debate we should be showing based on time
    // This should ideally sync with LiveDiscussionSection's current position
    const allStatements = getAllStatements();
    const totalStatements = allStatements.length;
    
    const interval = setInterval(() => {
      setCurrentDebateIndex(prev => {
        // Calculate which debate we should be showing based on epoch timing
        // Base epoch duration is 120 seconds for 1x speed
        const baseEpochDuration = 120000; // 120 seconds in milliseconds
        const epochDuration = baseEpochDuration / simulationState.speed;
        const elapsedSeconds = Math.floor(Date.now() / 1000) % Math.floor(epochDuration / 1000);
        const debateProgress = (elapsedSeconds / (epochDuration / 1000)) * epochData.debates.length;
        const newIndex = Math.floor(debateProgress) % epochData.debates.length;
        return newIndex;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [simulationState.isPlaying, epochData?.debates]);

  // Get current topic and question information
  const getCurrentTopicAndQuestion = () => {
    if (!epochData?.debates || !metadata || currentDebateIndex >= epochData.debates.length) {
      return { topic: null, question: null };
    }

    const currentDebate = epochData.debates[currentDebateIndex];
    if (!currentDebate) {
      return { topic: null, question: null };
    }

    const topic = metadata.topics.find(t => t.id === currentDebate.topic_id);
    
    return {
      topic: topic,
      question: currentDebate.question
    };
  };

  const { topic, question } = getCurrentTopicAndQuestion();

  return (
    <div className="relative">
      <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
        {/* Header */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Discussion Context</h3>
          <p className="mt-1 text-sm text-gray-600">
            Current topic and question
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-6 sm:px-8 sm:pb-8 overflow-y-auto">
          {simulationState.isPlaying && topic && question ? (
            <div className="space-y-4">
              {/* Topic Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      {topic.title}
                    </h4>
                    <p className="text-xs text-blue-700">
                      {topic.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Question Section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">
                      Current Question
                    </h4>
                    <div className="bg-white border border-green-200 rounded-md p-3">
                      <p className="text-sm text-gray-700">
                        {question.text}
                      </p>
                    </div>
                    {/* Debug info */}
                    <div className="mt-2 text-xs text-gray-500">
                      Debate {currentDebateIndex + 1} of {epochData?.debates?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-pulse">
                <p className="text-sm">
                  {simulationState.isPlaying ? 'Loading context...' : 'Press play to see discussion context'}
                </p>
                <p className="text-xs mt-1">
                  {simulationState.isPlaying ? 'Topic and question will appear here' : 'Select a simulation and press play'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}