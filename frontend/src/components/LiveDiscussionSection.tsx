'use client';

import { useState, useEffect, useRef } from 'react';
import { useRawData, useSimulationMetadata, useDataStore } from '@/lib/DataStore';
import { useSimulation } from '@/context/SimulationContext';

interface LiveMessage {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'candidate' | 'mediator' | 'audience';
  candidateId?: string;
}

export default function LiveDiscussionSection() {
  const epochData = useRawData();
  const metadata = useSimulationMetadata();
  const { addDiscussionMessage } = useDataStore();
  const { state: simulationState } = useSimulation();
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [currentDebateIndex, setCurrentDebateIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Get current topic and question information
  const getCurrentTopicAndQuestion = () => {
    if (!epochData?.debates || !metadata || currentDebateIndex >= epochData.debates.length) {
      return { topic: null, question: null };
    }

    const currentDebate = epochData.debates[currentDebateIndex];
    const topic = metadata.topics.find(t => t.id === currentDebate.topic_id);
    
    return {
      topic: topic,
      question: currentDebate.question
    };
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [liveMessages]);

  // Initialize with first message when simulation starts playing
  useEffect(() => {
    if (epochData?.debates && metadata && simulationState.isPlaying && liveMessages.length === 0) {
      const allStatements = getAllStatements();
      if (allStatements.length > 0) {
        const firstStatementData = allStatements[0];
        const candidateName = firstStatementData.statement.type === 'candidate' && firstStatementData.statement.candidate_id
          ? metadata.candidates.find(c => c.id === firstStatementData.statement.candidate_id)?.name || firstStatementData.statement.candidate_id
          : 'Moderator';

        const initialMessage: LiveMessage = {
          id: `initial-${Date.now()}`,
          author: candidateName,
          content: firstStatementData.statement.statement,
          timestamp: new Date(),
          type: firstStatementData.statement.type === 'mediator' ? 'mediator' : 'candidate',
          candidateId: firstStatementData.statement.candidate_id
        };

        setLiveMessages([initialMessage]);
        setCurrentStatementIndex(1); // Start from index 1 since we already showed the first one
      }
    }
  }, [epochData, metadata, simulationState.isPlaying]);

  // Clear messages when simulation stops
  useEffect(() => {
    if (!simulationState.isPlaying) {
      setLiveMessages([]);
      setCurrentStatementIndex(0);
      setCurrentDebateIndex(0);
    }
  }, [simulationState.isPlaying]);

  // Auto-advance through statements
  useEffect(() => {
    if (!epochData?.debates || !metadata || !simulationState.isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startAutoAdvance = () => {
      const allStatements = getAllStatements();
      const totalStatements = allStatements.length;
      
      // Calculate timing to finish all statements by epoch end
      // Base epoch duration is 120 seconds for 1x speed
      const baseEpochDuration = 120000; // 120 seconds in milliseconds
      const epochDuration = baseEpochDuration / simulationState.speed;
      const statementInterval = epochDuration / totalStatements;
      
      // Ensure minimum interval of 500ms for readability
      const finalInterval = Math.max(500, statementInterval);
      
      intervalRef.current = setInterval(() => {
        const allStatements = getAllStatements();
        
        if (currentStatementIndex < allStatements.length) {
          const statementData = allStatements[currentStatementIndex];
          const candidateName = statementData.statement.type === 'candidate' && statementData.statement.candidate_id
            ? metadata.candidates.find(c => c.id === statementData.statement.candidate_id)?.name || statementData.statement.candidate_id
            : 'Moderator';

          const newMessage: LiveMessage = {
            id: `msg-${Date.now()}-${currentStatementIndex}`,
            author: candidateName,
            content: statementData.statement.statement,
            timestamp: new Date(),
            type: statementData.statement.type === 'mediator' ? 'mediator' : 'candidate',
            candidateId: statementData.statement.candidate_id
          };

          setLiveMessages(prev => [...prev, newMessage]);
          setCurrentStatementIndex(prev => prev + 1);
          
          // Update current debate index when we move to a new question
          // Find the debate that corresponds to this statement
          const currentDebate = epochData.debates.find(d => 
            d.topic_id === statementData.topicId && d.question.id === statementData.questionId
          );
          if (currentDebate) {
            const debateIndex = epochData.debates.indexOf(currentDebate);
            if (debateIndex !== currentDebateIndex) {
              setCurrentDebateIndex(debateIndex);
            }
          }
        } else {
          // Reset to beginning for continuous loop
          setCurrentStatementIndex(0);
          setCurrentDebateIndex(0);
        }
      }, finalInterval);
    };

    startAutoAdvance();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [epochData, metadata, simulationState.isPlaying, simulationState.speed, currentStatementIndex]);

  const getMessageStyle = (message: LiveMessage) => {
    // Get all unique candidate names to determine styling
    const allStatements = getAllStatements();
    const candidateNames = [...new Set(allStatements
      .map(s => s.statement)
      .filter(s => s.type === 'candidate' && s.candidate_id)
      .map(s => {
        const candidate = metadata?.candidates.find(c => c.id === s.candidate_id);
        return candidate?.name || s.candidate_id;
      })
      .filter(Boolean))];

    const isModerator = message.type === 'mediator';
    const isCandidate1 = message.author === candidateNames[0];
    const isCandidate2 = message.author === candidateNames[1];

    // Determine styling based on speaker
    let alignmentClass = 'justify-start';
    let bubbleClass = 'bg-gray-100 text-gray-900 rounded-bl-md';
    let textColor = 'text-gray-800';
    let authorColor = 'text-gray-600';

    if (isModerator) {
      alignmentClass = 'justify-center';
      bubbleClass = 'bg-green-50 text-gray-900 rounded-md border border-green-200';
      textColor = 'text-gray-800';
      authorColor = 'text-green-700';
    } else if (isCandidate1) {
      alignmentClass = 'justify-start';
      bubbleClass = 'bg-blue-50 text-gray-900 rounded-bl-md border border-blue-200';
      textColor = 'text-gray-800';
      authorColor = 'text-blue-700';
    } else if (isCandidate2) {
      alignmentClass = 'justify-end';
      bubbleClass = 'bg-red-50 text-gray-900 rounded-br-md border border-red-200';
      textColor = 'text-gray-800';
      authorColor = 'text-red-700';
    }

    return {
      alignment: alignmentClass,
      bubble: bubbleClass,
      author: authorColor,
      text: textColor
    };
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="relative col-span-2">
      <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
        {/* Header */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Candidate Debate</h3>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-6 pb-6 sm:px-8 sm:pb-8 overflow-y-auto">
          <div className="space-y-4">
            {liveMessages.map((message) => {
              const style = getMessageStyle(message);
              
              return (
                <div key={message.id} className={`flex ${style.alignment}`}>
                  <div className={`max-w-2xl px-4 py-3 rounded-2xl ${style.bubble} animate-fade-in`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-sm font-medium ${style.author}`}>
                        {message.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.type === 'mediator' ? 'Moderator' : 'Candidate'}
                      </span>
                    </div>
                    <p className={`text-sm ${style.text} leading-relaxed`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {liveMessages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-pulse">
                <p className="text-sm">
                  {simulationState.isPlaying ? 'Starting debate...' : 'Press play to start the debate'}
                </p>
                <p className="text-xs mt-1">
                  {simulationState.isPlaying ? 'Messages will appear here' : 'Select a simulation and press play'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
