from strands import Agent, tool
import requests
import os

@tool
def http_request(method: str, url: str, headers: dict = None, body: str = None) -> str:
    """Make an HTTP request to check if a GitHub organization exists.
    Args:
        method: HTTP method (GET, POST, etc.)
        url: URL to make the request to
        headers: Optional headers for the request
        body: Optional request body
    Returns:
        Response text from the request
    """
    # Add GitHub token to headers if it's a GitHub API request
    if 'api.github.com' in url:
        headers = headers or {}
        if 'Authorization' not in headers:
            github_token = os.getenv('GITHUB_TOKEN')
            if github_token:
                headers['Authorization'] = f'token {github_token}'
            else:
                return "Error: GITHUB_TOKEN environment variable not set"
    response = requests.request(method, url, headers=headers, json=body if body else None)
    return response.text

NAMING_SYSTEM_PROMPT = """
You are an assistant that helps to name open source projects.

When providing open source project name suggestions, always provide
one or more available domain names and one or more available GitHub
organization names that could be used for the project.

Before providing your suggestions, use your tools to validate
that the GitHub organization names are not already used.
"""

naming_agent = Agent(
    system_prompt=NAMING_SYSTEM_PROMPT,
    tools=[http_request]
)

naming_agent("I need to name an open source project for building AI agents.") 