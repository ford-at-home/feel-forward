# Strands Agent System

The Strands agent system powers the AI-driven workflow of Feel Forward, orchestrating five specialized agents that guide users through a structured self-awareness journey.

## Overview

Each phase of the Feel Forward workflow is implemented as an independent Strands agent, allowing for modular development, testing, and deployment. The agents work together to create a cohesive experience while maintaining clear separation of concerns.

## Agent Architecture

```
strands/
├── agent.py      # Agent factory and orchestration
├── phase0.py     # Factor Discovery Agent
├── phase1.py     # Preference Detailing Agent
├── phase2.py     # Scenario Generation Agent
├── phase3.py     # Emotional Calibration Agent
├── phase4.py     # Insight Synthesis Agent
└── utils.py      # Shared utilities and helpers
```

## Phase Agents

### Phase 0: Factor Discovery Agent
**Purpose**: Identifies key factors that influence the user's decision

**Capabilities**:
- Analyzes decision context
- Extracts relevant factors
- Categorizes by importance
- Generates follow-up questions

**Input**: Decision context description
**Output**: List of factors with importance ratings

### Phase 1: Preference Detailing Agent
**Purpose**: Helps users articulate their preferences and priorities

**Capabilities**:
- Processes identified factors
- Elicits detailed preferences
- Identifies trade-offs
- Captures priority rankings

**Input**: Factors from Phase 0 + user preferences
**Output**: Detailed preference map with trade-offs

### Phase 2: Scenario Generation Agent
**Purpose**: Creates realistic decision scenarios for evaluation

**Capabilities**:
- Generates diverse scenarios
- Incorporates user constraints
- Balances factor representation
- Creates emotionally relevant situations

**Input**: Preferences and trade-offs from Phase 1
**Output**: 3-5 realistic decision scenarios

### Phase 3: Emotional Calibration Agent
**Purpose**: Captures and analyzes emotional responses to scenarios

**Capabilities**:
- Facilitates emotional exploration
- Identifies reaction patterns
- Measures response intensity
- Detects inconsistencies

**Input**: Scenarios + emotional reactions
**Output**: Emotional response patterns and analysis

### Phase 4: Insight Synthesis Agent
**Purpose**: Synthesizes learnings into actionable insights

**Capabilities**:
- Pattern recognition across responses
- Contradiction identification
- Priority clarification
- Recommendation generation

**Input**: All previous phase data
**Output**: Comprehensive insights and recommendations

## Agent Implementation

### Basic Structure
```python
from strands import Agent
from typing import Dict, Any

class PhaseAgent:
    def __init__(self):
        self.agent = Agent(
            name="phase_name",
            description="Agent purpose",
            instructions=self.get_instructions(),
            functions=self.get_functions(),
            model="gpt-4-turbo-preview"
        )
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        # Agent processing logic
        response = self.agent.run(input_data)
        return self.format_response(response)
```

### Shared Utilities

The `utils.py` module provides common functionality:

```python
# Response formatting
format_agent_response(raw_response, expected_structure)

# Validation
validate_phase_input(phase_num, input_data)

# Error handling
handle_agent_error(error, phase_num, fallback_response)

# Context building
build_conversation_context(previous_phases, current_input)
```

## Configuration

### Environment Variables
- `GITHUB_TOKEN`: Required for Strands SDK authentication
- `OPENAI_API_KEY`: Optional for enhanced LLM capabilities
- `STRANDS_LOG_LEVEL`: Logging verbosity (default: INFO)

### Agent Settings
Each agent can be configured with:
- Model selection (GPT-3.5, GPT-4, etc.)
- Temperature settings
- Token limits
- Retry policies
- Timeout values

## Integration Points

### API Integration
```python
from strands.agent import phase0_agent

@app.post("/phase0/factors")
async def discover_factors(request: Phase0Request):
    result = phase0_agent.process({
        "decision_context": request.decision_context
    })
    return Phase0Response(**result)
```

### Context Preservation
Agents maintain context across phases:
```python
context = {
    "phase0": phase0_response,
    "phase1": phase1_response,
    # ... accumulated context
}
phase4_agent.process(context)
```

## Error Handling

### Graceful Degradation
Each agent includes fallback logic:
1. Primary: Full Strands + OpenAI processing
2. Secondary: Strands with simplified prompts
3. Fallback: Pre-defined template responses

### Error Types
- **Authentication errors**: Invalid tokens
- **Rate limiting**: API quota exceeded
- **Timeout errors**: Long-running requests
- **Validation errors**: Invalid input format

## Testing Agents

### Unit Testing
```python
def test_phase0_agent():
    response = phase0_agent.process({
        "decision_context": "Choosing a career path"
    })
    assert "factors" in response
    assert len(response["factors"]) > 0
```

### Integration Testing
```python
def test_full_workflow():
    # Test complete flow through all phases
    context = {}
    for phase in [0, 1, 2, 3, 4]:
        agent = get_agent(phase)
        response = agent.process(context)
        context[f"phase{phase}"] = response
    
    assert "insights" in context["phase4"]
```

## Performance Optimization

### Caching
- Response caching for identical inputs
- Context caching between phases
- Model prediction caching

### Parallel Processing
Where applicable, agents can process multiple requests:
```python
scenarios = await asyncio.gather(
    *[generate_scenario(pref) for pref in preferences]
)
```

## Monitoring

### Metrics Tracked
- Response time per phase
- Token usage per request
- Error rates by type
- User satisfaction scores

### Logging
Structured logging for debugging:
```python
logger.info("Phase 0 processing", extra={
    "user_id": user_id,
    "decision_context_length": len(context),
    "processing_time": time.time() - start
})
```

## Extending the System

### Adding New Agents
1. Create new file in `strands/`
2. Implement agent class
3. Register in `agent.py`
4. Add API endpoint
5. Update tests

### Customizing Existing Agents
1. Extend base agent class
2. Override processing methods
3. Add custom functions
4. Update prompts

## Best Practices

1. **Keep agents focused**: Each agent should have a single, clear purpose
2. **Validate inputs**: Always validate before processing
3. **Handle errors gracefully**: Provide meaningful fallbacks
4. **Log extensively**: Aid debugging and monitoring
5. **Test thoroughly**: Unit and integration tests for all paths
6. **Document prompts**: Keep prompt engineering documented
7. **Version control**: Track prompt and configuration changes

## Troubleshooting

### Common Issues

1. **Agent not responding**
   - Check GITHUB_TOKEN validity
   - Verify network connectivity
   - Review CloudWatch logs

2. **Inconsistent responses**
   - Check temperature settings
   - Review prompt clarity
   - Validate input format

3. **Performance issues**
   - Monitor token usage
   - Check for timeout settings
   - Consider caching strategies

## Future Enhancements

### Planned Features
- Multi-language support
- Voice interaction capability
- Real-time collaboration
- Advanced analytics
- Custom agent creation UI

### Research Areas
- Emotion detection accuracy
- Scenario diversity algorithms
- Pattern recognition improvements
- Personalization strategies

---

For more information about the Strands SDK, visit the [official documentation](https://github.com/strands-ai/strands-sdk).