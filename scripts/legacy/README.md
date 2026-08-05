# scripts/legacy

Scripts **one-shot já aplicados**, mantidos aqui só como histórico. **Nenhum
deles é chamado em runtime, build ou deploy** — nada em `package.json`,
`Dockerfile` ou `.github/` os referencia.

Foram gerados ao longo do desenvolvimento (majoritariamente por IA) para aplicar
patches pontuais no código: correções de UI (`fix_*`), aplicação de features
(`apply_*`, `inject_*`), migrações já concluídas (`migrate*`, `reset_database`),
reconstruções de componentes (`rebuild_*`, `replace_*`, `slice_*`) e scripts de
debug (`scratch/`, `test-asar.*`, `check_*`).

Também estão aqui artefatos do fluxo antigo de **TightVNC**, que foi substituído
por RustDesk (`vnc-web-launcher.bat`, `Instalar_VNC_Web*.bat`, `test.ps1`).

Pode apagar esta pasta inteira sem impacto no sistema — o histórico do git
preserva tudo. Ficou aqui para consulta rápida caso precise relembrar como algum
patch foi feito.
