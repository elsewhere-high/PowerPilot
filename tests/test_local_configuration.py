from pathlib import Path

import pytest

from powerpilot import mcp_auth
from powerpilot.config import Settings


def test_local_defaults_are_isolated_and_simulation_only(monkeypatch) -> None:
    for name in (
        "SIMULATION_MODE",
        "ALLOW_PRODUCTION_WRITE",
        "AGENTTEAMS_ENABLED",
        "AGENTTEAMS_LIVE_REQUIRED",
        "AGENTTEAMS_TEAM_NAME",
        "POWERPILOT_HOST",
        "POWERPILOT_DB_PATH",
        "POLARDB_DSN",
        "DATABASE_URL",
    ):
        monkeypatch.delenv(name, raising=False)

    settings = Settings.from_env()

    settings.assert_safe_runtime()
    assert settings.simulation_mode is True
    assert settings.allow_production_write is False
    assert settings.agentteams_enabled is False
    assert settings.agentteams_live_required is True
    assert settings.agentteams_team_name == "powerpilot-park-control"
    assert settings.host == "127.0.0.1"
    assert settings.db_path == Path("var/powerpilot.db")
    assert settings.polardb_dsn is None


def test_mcp_auth_rejects_unconfigured_key(monkeypatch) -> None:
    monkeypatch.setattr(mcp_auth, "MCP_API_KEY", "")
    calls = []

    @mcp_auth.mcp_auth_required("get_energy_state")
    def read_state():
        calls.append(True)
        return {"available": True}

    with pytest.raises(PermissionError, match="invalid api_key"):
        read_state(mcp_api_key="", mcp_scope="read")
    assert calls == []


def test_mcp_auth_requires_configured_key_and_scope(monkeypatch) -> None:
    test_key = "unit-test-only"
    monkeypatch.setattr(mcp_auth, "MCP_API_KEY", test_key)
    calls = []

    @mcp_auth.mcp_auth_required("get_energy_state")
    def read_state():
        calls.append(True)
        return {"available": True}

    with pytest.raises(PermissionError, match="invalid api_key"):
        read_state(mcp_api_key="wrong-key", mcp_scope="read")
    with pytest.raises(PermissionError, match="scope"):
        read_state(mcp_api_key=test_key, mcp_scope="execute")
    assert calls == []
    assert read_state(mcp_api_key=test_key, mcp_scope="read") == {"available": True}
    assert calls == [True]
