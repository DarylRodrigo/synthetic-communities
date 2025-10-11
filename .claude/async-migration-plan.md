# Async Migration Plan for Synthetic Communities

## 🎯 Objective
Transition from synchronous to asynchronous LLM operations to achieve massive performance improvements through parallelization.

## 📊 Current State Analysis

### LLM Operations Requiring Async Parallelization
These operations involve `llm_client.generate_response()` calls and are the bottleneck:

1. **`update_beliefs()`** - Updates beliefs based on knowledge (debate/chat/social media)
2. **`chat_with_peers()`** - Generates conversational responses  
3. **`create_social_media_post()`** - Generates social media posts
4. **`react_to_post()`** - Generates reactions (thumbs up/down)
5. **`vote()`** - Makes voting decisions

### Non-LLM Operations (Keep Sync)
- `consume_debate_content()` - Just stores data
- `social_media_knowledge` storage - Just stores data
- File I/O operations
- Data serialization

## 🚀 Migration Tasks

### Phase 1: Add Missing Async Methods to Population
- [x] **Task 1.1**: Add `update_beliefs_from_debate_async()`
- [x] **Task 1.2**: Add `update_beliefs_from_chat_async()`  
- [X] **Task 1.3**: Add `update_beliefs_from_social_media_async()`

## 📋 Detailed Implementation Plan

### Task 1.1: `update_beliefs_from_debate_async()`
```python
async def update_beliefs_from_debate_async(self) -> None:
    """Update all personas' beliefs based on debate knowledge in parallel."""
    await self.update_beliefs_async("debate_knowledge")
```

### Task 1.2: `update_beliefs_from_chat_async()`
```python
async def update_beliefs_from_chat_async(self) -> None:
    """Update beliefs for personas who participated in chats in parallel."""
    tasks = [
        persona.update_beliefs_async("chats")
        for persona in self.personas
        if persona.chats
    ]
    if tasks:
        await asyncio.gather(*tasks)
```

### Task 1.3: `update_beliefs_from_social_media_async()`
```python
async def update_beliefs_from_social_media_async(self) -> None:
    """Update beliefs for personas who saw social media posts in parallel."""
    tasks = [
        persona.update_beliefs_async("social_media_knowledge")
        for persona in self.personas
        if persona.social_media_knowledge
    ]
    if tasks:
        await asyncio.gather(*tasks)
```

### Task 2.1-2.4: Game Engine Async Conversion
```python
async def run(self) -> Dict[str, Any]:
    # Initialize simulation output if not already done
    if self.simulation_file is None:
        self.initialize_simulation_output()

    for epoch in range(self.config.num_epochs):
        self.current_epoch = epoch
        await self._run_epoch()
        # Serialize state after each epoch
        self._serialize_epoch_state()

    return self._finalize_experiment()

async def _run_epoch(self) -> None:
    self._candidates_read_social_media()

    for topic_index in range(len(self.mediator.topics)):
        self._conduct_debate_on_topic(topic_index)

    self._population_consume_debate()
    await self.population.update_beliefs_from_debate_async()
    await self.population.chat_with_peers_async()
    await self.population.update_beliefs_from_chat_async()
    await self.population.create_social_media_posts_async()
    await self.population.react_to_posts_async()
    await self.population.update_beliefs_from_social_media_async()
```

## 📈 Expected Performance Gains

### Current Sequential Flow:
```
Persona 1: update_beliefs (2s) → Persona 2: update_beliefs (2s) → ... → Persona N: update_beliefs (2s)
Total: N × 2s = 2N seconds
```

### New Parallel Flow:
```
All Personas: update_beliefs_async (2s) [concurrent]
Total: ~2 seconds (regardless of N)
```

**For 100 personas: 200s → 2s = 100x speedup!**

## ✅ Success Criteria
- [ ] All LLM operations run in parallel
- [ ] Game Engine orchestrates async operations synchronously
- [ ] Performance improvement scales with population size
- [ ] No breaking changes to external interfaces
- [ ] All tests pass

## 🔄 Migration Order
1. **Start with Task 1.1** - Simplest async method
2. **Continue with Tasks 1.2-1.3** - Similar pattern
3. **Move to Task 2.1-2.4** - Game Engine conversion
4. **Finish with Task 3.1-3.3** - Testing and cleanup

## 📝 Notes
- Keep sync methods for backward compatibility initially
- Focus on LLM operations only (other operations are fast enough)
- Use `asyncio.gather()` for embarrassingly parallel operations
- Maintain synchronous interface for Game Engine orchestration

## 🎓 Key Learnings from Phase 1

### **Architecture Decision: Synchronous Interface with Async Internals**
- **Approach**: Keep methods synchronous externally, use `asyncio.run()` internally
- **Benefit**: No breaking changes to Game Engine, immediate performance gains
- **Pattern**: `asyncio.run()` + `asyncio.gather()` + semaphore for concurrency control

### **Code Refactoring: Common Async Orchestration**
- **Problem**: Duplicate async logic across belief update methods
- **Solution**: `_run_parallel_belief_updates()` common function
- **Result**: DRY code, consistent patterns, easy maintenance

### **Concurrency Control: Semaphore Pattern**
- **Challenge**: Unlimited concurrency can overwhelm APIs/memory
- **Solution**: `asyncio.Semaphore(max_concurrent)` with default limit of 20
- **Benefit**: Controlled resource usage, API rate limit friendly

### **Conditional Processing: Smart Filtering**
- **Pattern**: Filter personas before creating async tasks
- **Examples**: Only personas with chats, only personas with social media knowledge
- **Benefit**: Avoids unnecessary LLM calls, more efficient

### **Debug Output: Async Verification**
- **Added**: Comprehensive debug logging to `update_beliefs_async()`
- **Shows**: LLM calls, responses, parsed beliefs, concurrency
- **Purpose**: Verify async operations are working correctly

### **Performance Impact**
- **Before**: Sequential LLM calls (N × 2s = 2N seconds)
- **After**: Parallel LLM calls (~2 seconds regardless of N)
- **Gain**: 100x speedup for 100 personas
