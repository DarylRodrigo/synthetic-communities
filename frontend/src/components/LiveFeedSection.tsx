'use client';

import { useState, useEffect, useRef } from 'react';
import { useNewsItems, useDataStore } from '@/lib/DataStore';
import { useSimulation } from '@/context/SimulationContext';

interface LiveFeedItem {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  reactions: { emoji: string; count: number; targetCount: number; isAnimating?: boolean }[];
  isNew?: boolean;
}

export default function LiveFeedSection() {
  const newsItems = useNewsItems();
  const { updateNewsItemReactions } = useDataStore();
  const { state: simulationState } = useSimulation();
  const [liveFeedItems, setLiveFeedItems] = useState<LiveFeedItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new items arrive
  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [liveFeedItems]);

  // Initialize with first few items when simulation starts playing
  useEffect(() => {
    if (newsItems.length > 0 && simulationState.isPlaying && liveFeedItems.length === 0) {
      const initialItems = newsItems.slice(0, 3).map(item => ({
        ...item,
        timestamp: new Date(),
        isNew: true,
        reactions: item.reactions.map(reaction => ({ 
          ...reaction, 
          count: 0,
          targetCount: reaction.count,
          isAnimating: false 
        }))
      }));
      setLiveFeedItems(initialItems);
      setCurrentItemIndex(3);
    }
  }, [newsItems, simulationState.isPlaying]);

  // Clear feed when simulation stops
  useEffect(() => {
    if (!simulationState.isPlaying) {
      setLiveFeedItems([]);
      setCurrentItemIndex(0);
    }
  }, [simulationState.isPlaying]);

  // Auto-add new feed items
  useEffect(() => {
    if (newsItems.length === 0 || !simulationState.isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startAutoFeed = () => {
      const totalItems = newsItems.length;
      
      // Calculate timing to finish all feed items by epoch end
      // Base epoch duration is 120 seconds for 1x speed
      const baseEpochDuration = 120000; // 120 seconds in milliseconds
      const epochDuration = baseEpochDuration / simulationState.speed;
      const itemInterval = epochDuration / totalItems;
      
      // Ensure minimum interval of 1 second for feed readability
      const finalInterval = Math.max(1000, itemInterval);
      
      intervalRef.current = setInterval(() => {
        if (currentItemIndex < newsItems.length) {
          const newItem = {
            ...newsItems[currentItemIndex],
            timestamp: new Date(),
            isNew: true,
            reactions: newsItems[currentItemIndex].reactions.map(reaction => ({ 
              ...reaction, 
              count: 0,
              targetCount: reaction.count,
              isAnimating: false 
            }))
          };

          setLiveFeedItems(prev => [...prev, newItem]);
          setCurrentItemIndex(prev => prev + 1);

          // Start reaction animations after a short delay
          setTimeout(() => {
            setLiveFeedItems(prev => 
              prev.map(item => {
                if (item.id === newItem.id) {
                  return {
                    ...item,
                    reactions: item.reactions.map(reaction => ({
                      ...reaction,
                      isAnimating: true
                    }))
                  };
                }
                return item;
              })
            );

            // Animate count increment
            const animateCount = (itemId: string, reactionIndex: number, currentCount: number, targetCount: number) => {
              if (currentCount < targetCount) {
                setTimeout(() => {
                  setLiveFeedItems(prev => 
                    prev.map(item => {
                      if (item.id === itemId) {
                        return {
                          ...item,
                          reactions: item.reactions.map((reaction, index) => {
                            if (index === reactionIndex) {
                              return {
                                ...reaction,
                                count: currentCount + 1
                              };
                            }
                            return reaction;
                          })
                        };
                      }
                      return item;
                    })
                  );
                  animateCount(itemId, reactionIndex, currentCount + 1, targetCount);
                }, 150); // Increment every 150ms
              } else {
                // Stop animation when target is reached
                setTimeout(() => {
                  setLiveFeedItems(prev => 
                    prev.map(item => {
                      if (item.id === itemId) {
                        return {
                          ...item,
                          reactions: item.reactions.map((reaction, index) => {
                            if (index === reactionIndex) {
                              return {
                                ...reaction,
                                isAnimating: false
                              };
                            }
                            return reaction;
                          })
                        };
                      }
                      return item;
                    })
                  );
                }, 500); // Stop animation after reaching target
              }
            };

            // Start count animation for each reaction
            newItem.reactions.forEach((reaction, index) => {
              if (reaction.targetCount > 0) {
                animateCount(newItem.id, index, 0, reaction.targetCount);
              }
            });

          }, 1000); // Delay before starting reactions

          // Remove the "new" animation after a few seconds
          setTimeout(() => {
            setLiveFeedItems(prev => 
              prev.map(item => 
                item.id === newItem.id ? { ...item, isNew: false } : item
              )
            );
          }, 3000);
        } else {
          // Reset to beginning for continuous loop
          setCurrentItemIndex(0);
        }
      }, finalInterval); // Use dynamic interval based on speed
    };

    startAutoFeed();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [newsItems, currentItemIndex, simulationState.isPlaying, simulationState.speed]);

  // Auto-update reactions occasionally
  useEffect(() => {
    const reactionInterval = setInterval(() => {
      setLiveFeedItems(prev => 
        prev.map(item => {
          // Randomly update reaction counts
          const shouldUpdate = Math.random() < 0.3; // 30% chance
          if (shouldUpdate && item.reactions.length > 0) {
            const updatedReactions = item.reactions.map(reaction => ({
              ...reaction,
              count: reaction.count + Math.floor(Math.random() * 3) // Add 0-2 reactions
            }));
            return { ...item, reactions: updatedReactions };
          }
          return item;
        })
      );
    }, 6000); // Update reactions every 6 seconds

    return () => clearInterval(reactionInterval);
  }, []);

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const handleReactionClick = (itemId: string, reactionIndex: number) => {
    setLiveFeedItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const updatedReactions = [...item.reactions];
          updatedReactions[reactionIndex] = {
            ...updatedReactions[reactionIndex],
            count: updatedReactions[reactionIndex].count + 1,
            targetCount: updatedReactions[reactionIndex].targetCount + 1
          };
          return { ...item, reactions: updatedReactions };
        }
        return item;
      })
    );
  };

  return (
    <div className="relative">
      <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
        {/* Header */}
        <div className="px-6 pt-6 sm:px-8 sm:pt-8 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Social Media</h3>
          </div>
        </div>

        {/* Feed Items */}
        <div className="flex-1 px-6 pb-6 sm:px-8 sm:pb-8 overflow-y-auto">
          <div className="space-y-4">
            {liveFeedItems.map((item) => (
              <div 
                key={item.id} 
                className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all duration-300 ${
                  item.isNew ? 'animate-slide-in bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {item.author.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{item.author}</span>
                      <span className="text-xs text-gray-500">{formatTime(item.timestamp)}</span>
                      {item.isNew && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.content}</p>

                    {/* Reactions */}
                    <div className="flex items-center space-x-2">
                      {item.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          onClick={() => handleReactionClick(item.id, index)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 ${
                            reaction.isAnimating ? 'animate-reaction-pop bg-blue-100' : ''
                          }`}
                        >
                          <span className={`text-sm transition-transform duration-300 ${
                            reaction.isAnimating ? 'animate-pulse' : ''
                          }`}>
                            {reaction.emoji}
                          </span>
                          <span className={`text-xs text-gray-600 transition-all duration-300 ${
                            reaction.isAnimating ? 'animate-count-increment font-bold text-blue-600' : ''
                          }`}>
                            {reaction.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>

          {liveFeedItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-pulse">
                <p className="text-sm">
                  {simulationState.isPlaying ? 'Loading social media activity...' : 'Press play to start social media'}
                </p>
                <p className="text-xs mt-1">
                  {simulationState.isPlaying ? 'Posts will appear here' : 'Select a simulation and press play'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
