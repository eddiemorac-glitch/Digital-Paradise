Move-Item "ARCHITECTURE_INSIGHTS.md" "docs/architecture/" -Force -ErrorAction SilentlyContinue
Move-Item "BACKEND_REBIRTH.md" "docs/architecture/" -Force -ErrorAction SilentlyContinue
Move-Item "FRONTEND_REBIRTH.md" "docs/architecture/" -Force -ErrorAction SilentlyContinue
Move-Item "PROJECT_SPEC.md" "docs/architecture/" -Force -ErrorAction SilentlyContinue
Move-Item "SWARM_ARCHITECTURE_TRAINING.md" "docs/architecture/" -Force -ErrorAction SilentlyContinue

Move-Item "PLAN.md" "docs/planning/" -Force -ErrorAction SilentlyContinue
Move-Item "REFACTOR_PLAN.md" "docs/planning/" -Force -ErrorAction SilentlyContinue
Move-Item "OPTIMIZATION_PLAN.md" "docs/planning/" -Force -ErrorAction SilentlyContinue
Move-Item "MEMORY.md" "docs/planning/" -Force -ErrorAction SilentlyContinue

Move-Item "docs/DEPLOYMENT_GUIDE.md" "docs/guides/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/GUIA_ADMINISTRADOR.md" "docs/guides/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/SETUP_GUIDE.md" "docs/guides/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/TESTING_MANUAL.md" "docs/guides/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/usuarios_sistema.md" "docs/guides/" -Force -ErrorAction SilentlyContinue
Move-Item "GUIA_INICIO.md" "docs/guides/" -Force -ErrorAction SilentlyContinue

Move-Item "docs/executor_prompt_phase_*.md" "docs/archive/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/implementation_plan_phase_*.md" "docs/archive/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/SESSION_REPORT_PAYMENTS_LOGISTICS.md" "docs/archive/" -Force -ErrorAction SilentlyContinue
Move-Item "docs/UAT_PHASE_4.md" "docs/archive/" -Force -ErrorAction SilentlyContinue

Write-Host "Documentación organizada correctamente."
