"""
Red Team Agent for SecureCodeGen (incuverse)
LangGraph implementation: Conducts adversarial vulnerability testing on code.
- Runs Semgrep, custom exploit checks, and LLM analysis.
- Compiles a unified audit report for upstream agent consumption.
"""

import langgraph
from typing import Dict, Any
import subprocess
import tempfile
import os
from red_team_exploits import run_custom_exploit

# --- Semgrep wrapper ---
def run_semgrep(code: str, language: str = "javascript") -> str:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as tmpfile:
        tmpfile.write(code)
        filepath = tmpfile.name
    try:
        result = subprocess.run(
            ['semgrep', '--config', 'auto', filepath],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout
    finally:
        os.remove(filepath)

# --- LLM Vulnerability Analysis ---
def run_llm_analysis(code: str, semgrep_report: str, custom_findings: list) -> str:
    """
    Call your LLM endpoint for vulnerability analysis.
    Example uses OpenAI, but adapt as needed.
    """
    import openai
    # Set your OpenAI API key
    openai.api_key = os.environ.get("OPENAI_API_KEY")  # or set directly
    prompt = (
        "You are an expert security auditor. Analyze the following JavaScript code for vulnerabilities. "
        "Here is the code:\n\n"
        f"{code}\n\n"
        "Semgrep report:\n"
        f"{semgrep_report}\n\n"
        "Custom exploit findings:\n"
        f"{custom_findings}\n\n"
        "Give a detailed audit listing all vulnerabilities, severity, and remediation suggestions. "
        "Format as a markdown report."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.0,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"LLM Analysis failed: {e}"

# --- LangGraph Node ---
class RedTeamNode(langgraph.BaseNode):
    def run(self, input: Dict[str, Any]) -> Dict[str, Any]:
        code = input.get("code", "")
        language = input.get("language", "javascript")
        semgrep_report = run_semgrep(code, language)
        custom_findings = run_custom_exploit(code)
        llm_audit = run_llm_analysis(code, semgrep_report, custom_findings)
        audit_report = (
            "# Red Team Audit Report\n\n"
            "## Semgrep Findings\n"
            f"{semgrep_report}\n\n"
            "## Custom Exploit Findings\n"
            f"{custom_findings}\n\n"
            "## LLM Security Audit\n"
            f"{llm_audit}\n"
        )
        return {
            "audit_report": audit_report,
            "status": "red_team_analysis_complete"
        }

def build_red_team_graph():
    graph = langgraph.Graph()
    graph.add_node("red_team_agent", RedTeamNode())
    graph.set_start("red_team_agent")
    return graph

if __name__ == "__main__":
    agent_graph = build_red_team_graph()
    test_code = """
    const password = "supersecret";
    function login(user, pass) {
        eval("console.log('User: ' + user)");
        // vulnerable code
    }
    """
    result = agent_graph.run({"code": test_code, "language": "javascript"})
    print(result["audit_report"])