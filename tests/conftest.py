from __future__ import annotations

from pathlib import Path

import pytest

from powerpilot.audit import IndependentSafetyAuditor
from powerpilot.config import Settings
from powerpilot.demo import load_demo_scenario
from powerpilot.optimizer import DispatchOptimizer
from powerpilot.orchestrator import DispatchOrchestrator
from powerpilot.perception import PerceptionAgent
from powerpilot.simulator import SimulationExecutor
from powerpilot.storage import EvidenceStore


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        simulation_mode=True,
        allow_production_write=False,
        agentteams_enabled=True,
        agentteams_live_required=False,
        agentteams_team_name="powerpilot-test-team",
        agentteams_instance_id=None,
        db_path=tmp_path / "powerpilot.db",
        evidence_dir=tmp_path / "evidence",
        host="127.0.0.1",
        port=8000,
    )


@pytest.fixture
def orchestrator(settings: Settings) -> DispatchOrchestrator:
    return DispatchOrchestrator(
        perception=PerceptionAgent(),
        optimizer=DispatchOptimizer(),
        auditor=IndependentSafetyAuditor(),
        executor=SimulationExecutor(settings),
        store=EvidenceStore(settings.db_path, settings.evidence_dir),
    )


@pytest.fixture
def scenario():
    return load_demo_scenario()
