# 厳密な実装順序

1. Phase 0: Setup + Database + Auth
2. Phase 1: Dashboard + Realtime + AgentCard
3. Phase 2: Escalation (最重要・ここで品質を極限まで上げる)
4. Phase 3: Minimal Agent Runtime connection (LangGraph thin wrapper)
5. Phase 4: Resume after human response
6. Phase 5: Research Crew Template launch
7. Phase 6: Permissions + basic controls
8. Phase 7: Plan limits + Stripe + Onboarding

各Phaseが完全に動作することを確認してから次に進むこと。
エスカレーションの完成度が製品の成否を決める。
