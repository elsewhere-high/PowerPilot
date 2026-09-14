"""MCP tool authentication and failure handling.

Production: validate JWT against MCP identity provider.
Current: simple API-key + scope gate for demo.
"""

from __future__ import annotations

import os
from collections.abc import Callable
from functools import wraps
from typing import Any

MCP_API_KEY = os.getenv("MCP_API_KEY", "")
TOOL_SCOPES: dict[str, list[str]] = {
    "get_energy_state": ["read"],
    "generate_dispatch_plan": ["write"],
    "execute_plan": ["execute"],
    "rolling_reoptimize": ["write"],
}


def mcp_auth_required(tool_name: str) -> Callable[..., Any]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = kwargs.pop("mcp_api_key", "")
            if not MCP_API_KEY or key != MCP_API_KEY:
                raise PermissionError("MCP auth failed: invalid api_key")
            required = TOOL_SCOPES.get(tool_name, [])
            scope = kwargs.pop("mcp_scope", "")
            if required and scope not in required:
                raise PermissionError(f"MCP scope '{scope}' not in {required}")
            return func(*args, **kwargs)

        return wrapper

    return decorator


class ToolCircuitBreaker:
    """Fail-fast after 3 consecutive tool failures."""

    def __init__(self, threshold: int = 3) -> None:
        self.failures: dict[str, int] = {}
        self.threshold = threshold

    def call(self, tool_name: str, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        if self.failures.get(tool_name, 0) >= self.threshold:
            raise RuntimeError(f"Circuit breaker OPEN for {tool_name}: too many failures")
        try:
            result = fn(*args, **kwargs)
            self.failures[tool_name] = 0
            return result
        except Exception:
            self.failures[tool_name] = self.failures.get(tool_name, 0) + 1
            raise

    def health(self) -> dict[str, Any]:
        return {"open_circuits": [k for k, v in self.failures.items() if v >= self.threshold]}
