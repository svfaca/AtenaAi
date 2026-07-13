# Problemas conhecidos e diretrizes

## Problemas recorrentes

### Avatar/imagens retornando erro 400 ou não carregando

Causas comuns:
- URL da imagem está incompleta ou mal formada
- o frontend não está prefixando o caminho com `NEXT_PUBLIC_API_URL`
- o backend está recebendo um caminho inválido ou um nome de arquivo inesperado
- a imagem não existe mais no storage do backend

Checklist rápido:
- confirmar se `user.profile_image` é uma URL absoluta ou um caminho relativo
- confirmar se o componente concatena corretamente a base da API
- validar se o endpoint do backend existe e responde corretamente

### Problemas de typing em providers React

Em alguns pontos, providers de contexto sofreram falhas por passar um valor com formato incompatível. A correção costuma ser:
- criar uma interface explícita para as props
- separar claramente `props` do `value` do contexto
- evitar misturar `children` com o objeto de contexto

## Diretrizes importantes

- preferir mudanças pequenas e localizadas
- validar impacto em componentes que usam a mesma fonte de dados
- não alterar o diretório legado sem necessidade clara
- manter consistência com o padrão atual do projeto
- sempre preferir rastrear a origem da URL ou do dado antes de corrigir o comportamento visual

## Observações de contexto

Este projeto já passou por ajustes de arquitetura e de integração de avatar. Quando uma tarefa parecer estar relacionada a imagens, autenticação ou providers, vale conferir os arquivos de contexto e as rotas de usuário antes de editar.
