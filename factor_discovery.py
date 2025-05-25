from strands import Agent
from strands.tools.decorators import tool

# Example tool for saving preferences
@tool
def save_preferences(preferences: dict) -> str:
    print("Saving preferences:", preferences)
    return "Preferences saved."

# Agent system prompt
factor_discovery_prompt = '''
You are a preference discovery assistant.
Your job is to help users uncover important variables in a decision they are considering.
For example, if the user is looking for a new job, you should suggest common factors like commute, salary, manager style, company size, etc.

Ask them which ones matter to them, and collect their preferences as structured output.
'''

# Create the agent
factor_discovery_agent = Agent(
    system_prompt=factor_discovery_prompt,
    tools=[save_preferences]
)

if __name__ == "__main__":
    # Example task invocation
    user_input = "I'm thinking about changing jobs and I want to understand what factors actually matter to me."
    result = factor_discovery_agent(user_input)
    print(result)
