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

## Problemas conhecidos do Railway

### Variáveis de ambiente com `\n` no nome (Railway)

**Sintoma:** `os.getenv("OPENAI_API_KEY")` retorna `None` mesmo com a variável configurada no painel do Railway.

**Causa:** O Railway pode salvar variáveis de ambiente com uma quebra de linha (`\n`) no final do nome da chave. Ex: a chave real no `os.environ` é `"OPENAI_API_KEY\n"` em vez de `"OPENAI_API_KEY"`.

**Solução:** Usar a função `getenv_railway()` definida em `backend/app/core/config.py`:

```python
def getenv_railway(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value and value.strip():
        return value.strip()
    # Fallback: buscar ignorando \n no nome
    for env_key, env_value in os.environ.items():
        if env_key.strip() == key:
            val = env_value.strip()
            if val.startswith("="):
                val = val[1:].strip()
            if val:
                return val
            break
    return default
```

**Arquivos afetados:** `backend/app/core/config.py`, `backend/app/database/database.py`

### Ordem de importação: database.py vs config.py

**Sintoma:** `DATABASE_URL` cai para SQLite mesmo com PostgreSQL configurado.

**Causa:** `backend/app/database/database.py` importa `os.getenv("DATABASE_URL")` diretamente no módulo, **antes** do `config.py` ser carregado. Se o `config.py` tem uma lógica de correção (como `getenv_railway`), ela não é aplicada.

**Solução:** Em `database.py`, importar a `DATABASE_URL` já corrigida do `config.py`:

```python
try:
    from app.core.config import DATABASE_URL as CONFIG_DATABASE_URL
    DATABASE_URL = CONFIG_DATABASE_URL
except Exception:
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///...")
```

### ENUM PostgreSQL duplicado com multi-workers

**Sintoma:** `IntegrityError: duplicate key value violates unique constraint "pg_type_typname_nsp_index"` ao iniciar com múltiplos workers.

**Causa:** Vários workers do uvicorn tentam criar o mesmo ENUM type (`userrole`) simultaneamente via `Base.metadata.create_all()`.

**Solução:** Envolver o `create_all()` em um try/except ignorando esse erro específico:

```python
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    if "duplicate key" in str(e) and "pg_type_typname_nsp_index" in str(e):
        logger.warning("ENUM type já existe (ignorado para multi-worker)")
    else:
        raise
```

### Caminho de diretório de avatares em produção

**Sintoma:** `PermissionError: [Errno 13] Permission denied: '/backend'` ou `FileNotFoundError` ao fazer upload de avatar.

**Causa:** O código original usava `BASE_DIR / "backend" / "storage" / "avatars"` que resolvia para `/backend/storage/avatars` no container Docker, mas o diretório correto é `/app/uploads/avatars`.

**Solução:** Usar `UPLOAD_DIR` do `config.py` que aponta para `BASE_DIR / "uploads"` (criado no Dockerfile):

```python
from app.core.config import UPLOAD_DIR
AVATAR_DIR = Path(UPLOAD_DIR) / "avatars"
```

## Diretrizes importantes

- preferir mudanças pequenas e localizadas
- validar impacto em componentes que usam a mesma fonte de dados
- não alterar o diretório legado sem necessidade clara
- manter consistência com o padrão atual do projeto
- sempre preferir rastrear a origem da URL ou do dado antes de corrigir o comportamento visual
- **sempre usar `getenv_railway()` ao invés de `os.getenv()` para ler variáveis de ambiente em produção**
- ao adicionar um novo banco de dados no Railway, remover a `DATABASE_URL` antiga das Variables para evitar conflito

## Observações de contexto

Este projeto já passou por ajustes de arquitetura e de integração de avatar. Quando uma tarefa parecer estar relacionada a imagens, autenticação ou providers, vale conferir os arquivos de contexto e as rotas de usuário antes de editar.
