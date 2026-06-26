# CONTEXTO E MEMÓRIA PARA A INTELIGÊNCIA ARTIFICIAL

**NOTA PARA A IA:** Ao abrir este projeto, SEMPRE leia este arquivo antes de tomar decisões arquiteturais ou tentar entender a topologia da rede.

## Informações Críticas sobre a Infraestrutura:
1. **Rede e Servidor (AYKO)**
   - O ecossistema está interligado com a infraestrutura da **Ayko**.
   - Existe uma pasta e configurações específicas da Ayko que governam o comportamento de rede, VPN ou tunelamento de acesso.
   - O IP central de comunicação (Servidor EAV) geralmente opera no IP `10.158.0.4`.

2. **Acesso Remoto e VNC**
   - O Painel Web dispara conexões de VNC diretamente pelo IP dos clientes (e não pelo hostname, devido à falta de resolução DNS na rede local).
   - Os clientes usam o `TightVNC Server` protegido pela política `IpAccessControl` (`0.0.0.0-255.255.255.255:2`) para forçar a janela de aprovação na tela do usuário final.
   - O instalador e o script de configuração do VNC exigem privilégios de Administrador (UAC) para modificar o Firewall e liberar pacotes ICMPv4 (Ping).

3. **Backend e Frontend**
   - O backend prioriza o IP real dos dispositivos ao invés do Hostname para testes de conectividade (Ping) e Acesso Remoto.

*Este arquivo serve como um "cérebro externo" para garantir que o contexto da rede da Ayko e as regras de infraestrutura nunca sejam esquecidos nas próximas atualizações.*
