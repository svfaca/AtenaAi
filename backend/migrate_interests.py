"""
Script para normalizar interesses antigos no banco de dados.
Execute uma vez para corrigir todos os usuários com interesses desnormalizados.
"""
from app.database.database import SessionLocal
from app.models.user import User
from app.utilities.interests import normalize_interests


def migrate_interests():
    """Normaliza all interesses no banco para o padrão português"""
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        updated_count = 0
        
        for user in users:
            if user.interests:
                normalized = normalize_interests(user.interests)
                if normalized != user.interests:
                    print(f"[USER {user.id}] {user.email}")
                    print(f"  Antes: {user.interests}")
                    print(f"  Depois: {normalized}")
                    user.interests = normalized
                    updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"\n✅ {updated_count} usuários foram atualizados!")
        else:
            print("\n✅ Todos os interesses já estão normalizados!")
    
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    
    finally:
        db.close()


if __name__ == "__main__":
    migrate_interests()
