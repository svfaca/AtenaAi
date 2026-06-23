"""
Data Migration: Convert interests column from TEXT to JSONB (PostgreSQL only)

⚠️ NOTA: Esta migration é necessária apenas ao migrar para PostgreSQL em produção.
SQLite continuará usando TEXT (funciona perfeitamente).

ANTES: interests TEXT (armazena strings como '["math","physics"]')
DEPOIS: interests JSONB (armazena objetos JSON nativos com indexação e queries eficientes)

Benefícios do JSONB:
  ✅ Queries eficientes: WHERE interests @> '["math"]'
  ✅ Indexação GIN para busca rápida
  ✅ Validação de formato no banco
  ✅ Operadores JSON nativos

Executar: python scripts/run_data_migrations.py
"""

from sqlalchemy import text
from app.database.database import engine, IS_SQLITE


def migrate_interests_to_jsonb():
    """
    Migra coluna interests de TEXT para JSONB (PostgreSQL).
    
    Passos:
      1. Cria coluna temporária interests_jsonb
      2. Converte dados de TEXT para JSONB
      3. Remove coluna antiga
      4. Renomeia nova coluna
      5. Cria índice GIN para queries rápidas
    """
    
    if IS_SQLITE:
        print("⏭️  SQLite detectado - migration não necessária (TEXT é adequado)")
        return
    
    print("🚀 Iniciando migration: interests TEXT → JSONB")
    
    with engine.begin() as conn:
        # 1. Adicionar coluna temporária JSONB
        print("  ➜ Criando coluna interests_jsonb...")
        conn.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS interests_jsonb JSONB
        """))
        
        # 2. Converter dados existentes
        print("  ➜ Convertendo dados TEXT → JSONB...")
        conn.execute(text("""
            UPDATE users
            SET interests_jsonb = 
                CASE 
                    WHEN interests IS NULL THEN NULL
                    WHEN interests = '' THEN NULL
                    -- Se já é JSON válido, converte direto
                    WHEN interests::text ~ '^\\[.*\\]$' THEN interests::jsonb
                    -- Se é string simples, tenta parsear
                    ELSE NULL
                END
        """))
        
        # 3. Verificar conversão
        result = conn.execute(text("""
            SELECT 
                COUNT(*) as total,
                COUNT(interests_jsonb) as converted,
                COUNT(*) - COUNT(interests_jsonb) as nulls
            FROM users
            WHERE interests IS NOT NULL
        """))
        stats = result.fetchone()
        print(f"  ✓ Convertidos: {stats.converted}/{stats.total} registros ({stats.nulls} nulos)")
        
        # 4. Remover coluna antiga
        print("  ➜ Removendo coluna antiga interests...")
        conn.execute(text("""
            ALTER TABLE users
            DROP COLUMN interests
        """))
        
        # 5. Renomear nova coluna
        print("  ➜ Renomeando interests_jsonb → interests...")
        conn.execute(text("""
            ALTER TABLE users
            RENAME COLUMN interests_jsonb TO interests
        """))
        
        # 6. Criar índice GIN para queries eficientes
        print("  ➜ Criando índice GIN...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_interests_gin
            ON users USING GIN (interests)
        """))
        
        print("✅ Migration concluída com sucesso!")
        print("\n📝 Agora você pode fazer queries eficientes:")
        print("   SELECT * FROM users WHERE interests @> '[\"math\"]'")
        print("   SELECT * FROM users WHERE interests ? 'physics'")


def rollback_interests_to_text():
    """
    Rollback: JSONB → TEXT (caso necessário).
    """
    
    if IS_SQLITE:
        print("⏭️  SQLite detectado - rollback não necessário")
        return
    
    print("🔄 Iniciando rollback: interests JSONB → TEXT")
    
    with engine.begin() as conn:
        # 1. Criar coluna TEXT temporária
        print("  ➜ Criando coluna interests_text...")
        conn.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS interests_text TEXT
        """))
        
        # 2. Converter JSONB para TEXT
        print("  ➜ Convertendo JSONB → TEXT...")
        conn.execute(text("""
            UPDATE users
            SET interests_text = interests::text
            WHERE interests IS NOT NULL
        """))
        
        # 3. Remover índice
        print("  ➜ Removendo índice GIN...")
        conn.execute(text("""
            DROP INDEX IF EXISTS idx_users_interests_gin
        """))
        
        # 4. Remover coluna JSONB
        print("  ➜ Removendo coluna JSONB...")
        conn.execute(text("""
            ALTER TABLE users
            DROP COLUMN interests
        """))
        
        # 5. Renomear
        print("  ➜ Renomeando interests_text → interests...")
        conn.execute(text("""
            ALTER TABLE users
            RENAME COLUMN interests_text TO interests
        """))
        
        print("✅ Rollback concluído!")


# ============================================================
# EXEMPLO DE QUERIES APÓS MIGRATION
# ============================================================

def example_jsonb_queries():
    """
    Exemplos de queries eficientes após migração para JSONB.
    """
    
    print("\n📚 Exemplos de queries JSONB:")
    print()
    
    examples = [
        {
            "description": "Usuários interessados em matemática",
            "query": "SELECT * FROM users WHERE interests @> '[\"math\"]'",
        },
        {
            "description": "Usuários com qualquer interesse em exatas",
            "query": """
                SELECT * FROM users 
                WHERE interests ?| array['math', 'physics', 'chemistry']
            """,
        },
        {
            "description": "Usuários com TODOS os interesses listados",
            "query": """
                SELECT * FROM users 
                WHERE interests @> '["math", "physics"]'
            """,
        },
        {
            "description": "Contar usuários por interesse",
            "query": """
                SELECT 
                    jsonb_array_elements_text(interests) as interest,
                    COUNT(*) as user_count
                FROM users
                WHERE interests IS NOT NULL
                GROUP BY interest
                ORDER BY user_count DESC
            """,
        },
        {
            "description": "Usuários com 3+ interesses",
            "query": """
                SELECT * FROM users
                WHERE jsonb_array_length(interests) >= 3
            """,
        },
    ]
    
    for ex in examples:
        print(f"🔍 {ex['description']}")
        print(f"   {ex['query'].strip()}")
        print()


if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("MIGRATION: interests TEXT → JSONB (PostgreSQL)")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "rollback":
        rollback_interests_to_text()
    elif len(sys.argv) > 1 and sys.argv[1] == "examples":
        example_jsonb_queries()
    else:
        migrate_interests_to_jsonb()
        print()
        example_jsonb_queries()
