import os, sys, tempfile

# Garante que o pacote 'app' (backend) seja importável
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

tmp_db = os.path.join(tempfile.gettempdir(), "atena_test_vuln.db")
if os.path.exists(tmp_db):
    os.remove(tmp_db)
os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"
os.environ["ENVIRONMENT"] = "development"
os.environ["OPENAI_API_KEY"] = "sk-dummy-for-test"
os.environ["GUEST_DAILY_MESSAGE_LIMIT"] = "3"  # limite pequeno p/ testar o 429 rápido

from fastapi.testclient import TestClient
import app.main
from app.database.database import Base, engine

# Banco temporário sem migrations do Alembic -> criar tabelas para o teste
Base.metadata.create_all(bind=engine)

client = TestClient(app.main.app)

# 1) Tentativa de auto-registro como admin deve ser rebaixada para student
r = client.post("/api/v1/auth/register", json={
    "email": "attacker@test.com",
    "password": "secret123",
    "full_name": "Attacker",
    "role": "admin",
})
assert r.status_code == 200, r.text
assert r.json()["role"] == "student", "role nao clampeado: " + str(r.json()["role"])
print("V1 OK: role=admin clampeado para student")

# 2) Teacher continua permitido (fluxo legitimo da UI)
r = client.post("/api/v1/auth/register", json={
    "email": "prof@test.com",
    "password": "secret123",
    "full_name": "Prof",
    "role": "teacher",
})
assert r.status_code == 200, r.text
assert r.json()["role"] == "teacher", r.text
print("V1 OK: teacher permitido")

# 3) Login nao retorna access_token no body
r = client.post("/api/v1/auth/login", data={
    "username": "attacker@test.com",
    "password": "secret123",
})
assert r.status_code == 200, r.text
body = r.json()
assert "access_token" not in body, "access_token vazou no body do login!"
assert r.headers.get("set-cookie") and "access_token=" in r.headers["set-cookie"]
print("V5 OK: login retorna apenas cookie HttpOnly")

# 4) Refresh nao retorna access_token no body
r = client.post("/api/v1/auth/refresh", cookies={
    "refresh_token": r.cookies.get("refresh_token"),
})
assert r.status_code == 200, r.text
assert "access_token" not in r.json()
print("V5 OK: refresh retorna apenas cookies")

# ============================================================
# 5) Limite DIÁRIO de visitantes (cookie guest_id assinado)
#    + 429 estruturado para o CTA de criação de conta
# ============================================================
import app.routes.chat as chat_routes

# Evitar chamadas reais à OpenAI durante o teste
chat_routes.generate_ai_response = lambda *args, **kwargs: "resposta-teste"
def _fake_stream(*args, **kwargs):
    def _gen():
        yield "resposta-teste"
    return _gen()
chat_routes.generate_ai_response_stream = _fake_stream

# Cliente novo (sem cookies de auth) → modo visitante
guest_client = TestClient(app.main.app)

# As primeiras GUEST_DAILY_MESSAGE_LIMIT (3) mensagens são permitidas
for i in range(3):
    r = guest_client.post("/api/v1/chat/stream", json={"content": f"olá {i}"})
    assert r.status_code == 200, f"msg {i}: {r.status_code} {r.text}"
    assert "guest_id" in guest_client.cookies, "cookie guest_id deveria ter sido emitido"

# A 4ª mensagem do MESMO visitante deve ser bloqueada (429 estruturado)
r = guest_client.post("/api/v1/chat/stream", json={"content": "estouro"})
assert r.status_code == 429, f"esperava 429, veio {r.status_code}: {r.text}"
body = r.json()
detail = body.get("detail", body)
assert isinstance(detail, dict), str(body)
assert detail.get("error_code") == "GUEST_DAILY_LIMIT", str(body)
assert detail.get("remaining") == 0, str(body)
assert r.headers.get("x-ratelimit-remaining") == "0", dict(r.headers)
print("V6 OK: limite diário de visitantes por guest_id (3/dia) + 429 estruturado")

# Um visitante DIFERENTE (cookies limpos) tem quota própria
guest_client.cookies.clear()
r = guest_client.post("/api/v1/chat/stream", json={"content": "outro visitante"})
assert r.status_code == 200, f"{r.status_code} {r.text}"
print("V6 OK: visitante diferente tem quota própria")

# ============================================================
# 7) Política mínima de senha (8+) — rejeitada no schema
# ============================================================
r = client.post("/api/v1/auth/register", json={
    "email": "shortpass@test.com",
    "password": "123",
    "full_name": "Short",
})
assert r.status_code == 422, f"esperava 422, veio {r.status_code}: {r.text}"
print("V7 OK: senha curta rejeitada (min 8 caracteres)")

# ============================================================
# 8) Hard delete antigo removido — o fluxo seguro é /users/me (soft delete)
# ============================================================
r = client.delete("/api/v1/auth/delete-account")
assert r.status_code == 404, f"esperava 404, veio {r.status_code}: {r.text}"
print("V8 OK: DELETE /auth/delete-account removido (unificado em /users/me)")

# ============================================================
# 9) LOGOUT revoga refresh tokens (token versioning)
# ============================================================
r = client.post("/api/v1/auth/register", json={
    "email": "logout@test.com",
    "password": "secret123",
    "full_name": "Logout",
})
assert r.status_code == 200, r.text

r = client.post("/api/v1/auth/login", data={
    "username": "logout@test.com",
    "password": "secret123",
})
assert r.status_code == 200, r.text
refresh_before_logout = client.cookies.get("refresh_token")
assert refresh_before_logout, "cookie refresh_token deveria existir após login"

# Refresh funciona normalmente ANTES do logout (rotação preserva o ver)
r = client.post("/api/v1/auth/refresh")
assert r.status_code == 200, f"{r.status_code} {r.text}"
refresh_rotated = client.cookies.get("refresh_token")
assert refresh_rotated, "rotação deveria emitir novo refresh_token"

# Logout → revoga + limpa cookies
r = client.post("/api/v1/auth/logout")
assert r.status_code == 200, r.text
assert "refresh_token" not in client.cookies, "cookie refresh_token deveria ter sido limpo"

# Refresh com o token ORIGINAL (emitido antes do logout) → 401 revogado
r = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_before_logout})
assert r.status_code == 401, f"esperava 401, veio {r.status_code}: {r.text}"

# Refresh com o token ROTACIONADO (também emitido antes do logout) → 401 revogado
r = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_rotated})
assert r.status_code == 401, f"esperava 401, veio {r.status_code}: {r.text}"

# Novo login volta a funcionar (emite refresh com o token_version atualizado)
r = client.post("/api/v1/auth/login", data={
    "username": "logout@test.com",
    "password": "secret123",
})
assert r.status_code == 200, r.text
r = client.post("/api/v1/auth/refresh")
assert r.status_code == 200, f"refresh pós-login deveria funcionar: {r.status_code} {r.text}"
print("V9 OK: logout revoga refresh tokens (token versioning)")

# ============================================================
# 10) TROCA DE SENHA revoga TODAS as sessões (token versioning)
# ============================================================
r = client.post("/api/v1/auth/register", json={
    "email": "change@test.com",
    "password": "secret123",
    "full_name": "Change",
})
assert r.status_code == 200, r.text

r = client.post("/api/v1/auth/login", data={
    "username": "change@test.com",
    "password": "secret123",
})
assert r.status_code == 200, r.text
refresh_before_change = client.cookies.get("refresh_token")
assert refresh_before_change, "cookie refresh_token deveria existir após login"

# Senha atual incorreta → 400 (não revoga nada)
r = client.post("/api/v1/auth/change-password", json={
    "current_password": "errada123",
    "new_password": "novaSenha123",
})
assert r.status_code == 400, f"esperava 400, veio {r.status_code}: {r.text}"

# Troca válida → 200 e cookies de auth limpos (sessão atual revogada)
r = client.post("/api/v1/auth/change-password", json={
    "current_password": "secret123",
    "new_password": "novaSenha123",
})
assert r.status_code == 200, f"{r.status_code}: {r.text}"
assert "refresh_token" not in client.cookies, "cookies deveriam ser limpos após troca de senha"

# Refresh com token emitido ANTES da troca → 401 (sessão revogada)
r = client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_before_change})
assert r.status_code == 401, f"esperava 401, veio {r.status_code}: {r.text}"

# Login com senha ANTIGA → 401
r = client.post("/api/v1/auth/login", data={
    "username": "change@test.com",
    "password": "secret123",
})
assert r.status_code == 401, f"esperava 401, veio {r.status_code}: {r.text}"

# Login com senha NOVA → 200 e refresh funciona
r = client.post("/api/v1/auth/login", data={
    "username": "change@test.com",
    "password": "novaSenha123",
})
assert r.status_code == 200, f"esperava 200, veio {r.status_code}: {r.text}"
r = client.post("/api/v1/auth/refresh")
assert r.status_code == 200, f"refresh pós-troca deveria funcionar: {r.status_code} {r.text}"
print("V10 OK: troca de senha revoga sessões (login antigo falha, novo funciona)")

# ============================================================
# 11) RATE LIMIT de login por EMAIL (contra brute force)
# ============================================================
# 5 tentativas permitidas (401 por credenciais inválidas), a 6ª bloqueada (429)
for i in range(5):
    r = client.post("/api/v1/auth/login", data={
        "username": "rl@test.com",
        "password": "senhaerrada",
    })
    assert r.status_code == 401, f"tentativa {i}: esperava 401, veio {r.status_code}"

r = client.post("/api/v1/auth/login", data={
    "username": "rl@test.com",
    "password": "senhaerrada",
})
assert r.status_code == 429, f"esperava 429, veio {r.status_code}: {r.text}"
assert "X-RateLimit-Remaining" in r.headers, dict(r.headers)
print("V11 OK: rate limit de login por email (5 tentativas -> 429)")

# ============================================================
# 12) PURGA LGPD (hard delete) + expurgo de guest_chat_usage
# ============================================================
from app.database.database import SessionLocal as _PurgeSessionLocal
from app.utilities.data_purge import purge_soft_deleted_users, purge_old_guest_usage
from app.models.user import User as _PurgeUserModel
from app.models.guest_chat_usage import GuestChatUsage as _PurgeGuestUsage
from datetime import datetime as _pdt, timedelta as _ptd, date as _pdate

_db = _PurgeSessionLocal()
try:
    # Registra, loga e soft-deleta uma conta
    r = client.post("/api/v1/auth/register", json={
        "email": "purge@test.com",
        "password": "secret123",
        "full_name": "Purge",
    })
    assert r.status_code == 200, r.text
    r = client.post("/api/v1/auth/login", data={
        "username": "purge@test.com",
        "password": "secret123",
    })
    assert r.status_code == 200, r.text
    r = client.request("DELETE", "/api/v1/users/me", json={
        "password": "secret123",
        "confirm_text": "DELETE",
    })
    assert r.status_code == 200, f"soft delete falhou: {r.status_code} {r.text}"

    # Garante deleted_at antigo (purga com days=0 remove tudo já deletado)
    _db.query(_PurgeUserModel).filter(
        _PurgeUserModel.email == "purge@test.com"
    ).update({"deleted_at": _pdt.utcnow() - _ptd(days=1)})
    _db.commit()

    purged = purge_soft_deleted_users(_db, older_than_days=0)
    assert purged >= 1, f"esperava purgar ao menos 1 usuário, purgou {purged}"
    still = _db.query(_PurgeUserModel).filter(
        _PurgeUserModel.email == "purge@test.com"
    ).first()
    assert still is None, "usuário deveria ter sido removido definitivamente"

    # Expurgo de guest_chat_usage antiga
    _db.add(_PurgeGuestUsage(guest_id="antigo-test", usage_date=_pdate.today(), count=1))
    _db.commit()
    _db.query(_PurgeGuestUsage).filter(
        _PurgeGuestUsage.guest_id == "antigo-test"
    ).update({"usage_date": _pdate.today() - _ptd(days=40)})
    _db.commit()

    purged_guests = purge_old_guest_usage(_db, older_than_days=30)
    assert purged_guests >= 1, f"esperava expurgar guest usage, expurgou {purged_guests}"
finally:
    _db.close()
print("V12 OK: purga LGPD (hard delete) + expurgo de guest_chat_usage")

# ============================================================
# 13) CSRF: mutação com Origin não permitida → 403
# ============================================================
# Sem Origin (clientes não-browser) → permitido (chega ao endpoint: 401)
r = client.post("/api/v1/auth/login", data={"username": "csrf@test.com", "password": "x"})
assert r.status_code != 403, f"sem Origin não deveria ser bloqueado: {r.text}"

# Origin malicioso (cross-site) → bloqueado pelo CSRF antes do endpoint
r = client.post("/api/v1/auth/login", data={"username": "csrf@test.com", "password": "x"},
                headers={"Origin": "https://evil.example.com"})
assert r.status_code == 403, f"esperava 403 CSRF, veio {r.status_code}: {r.text}"

# Origin permitido (CORS_ORIGINS) → não bloqueado
r = client.post("/api/v1/auth/login", data={"username": "csrf@test.com", "password": "x"},
                headers={"Origin": "http://localhost:3000"})
assert r.status_code != 403, r.text
print("V13 OK: CSRF bloqueia mutações com Origin não permitida")

# ============================================================
# 14) Cache-Control: no-store nas respostas /api/v1
# ============================================================
r = client.post("/api/v1/auth/check-email", json={"email": "cachetest@example.com"})
assert r.status_code == 200, r.text
assert r.headers.get("cache-control") == "no-store", dict(r.headers)
print("V14 OK: /api/v1 responde com Cache-Control: no-store")

# ============================================================
# 15) RATE LIMIT no change-password (contra brute force da senha atual)
# ============================================================
r = client.post("/api/v1/auth/register", json={
    "email": "cp@test.com", "password": "secret123", "full_name": "Cp",
})
assert r.status_code == 200, r.text
r = client.post("/api/v1/auth/login", data={"username": "cp@test.com", "password": "secret123"})
assert r.status_code == 200, r.text

for i in range(5):
    r = client.post("/api/v1/auth/change-password", json={
        "current_password": "errada123", "new_password": "novaSenha123",
    })
    assert r.status_code == 400, f"tentativa {i}: esperava 400, veio {r.status_code}"

r = client.post("/api/v1/auth/change-password", json={
    "current_password": "errada123", "new_password": "novaSenha123",
})
assert r.status_code == 429, f"esperava 429, veio {r.status_code}: {r.text}"
print("V15 OK: rate limit no change-password (5 tentativas -> 429)")

# ============================================================
# 16) Health check verifica banco de dados
# ============================================================
r = client.get("/health")
assert r.status_code == 200, r.text
assert r.json()["database"] == "ok", r.text
print("V16 OK: /health valida banco (database=ok)")

# ============================================================
# 17) WebSocket aceita token via subprotocolo (Sec-WebSocket-Protocol)
#     e rejeita classroom inexistente (prova que a auth via subprotocolo funciona)
# ============================================================
from starlette.testclient import WebSocketDisconnect
from app.core.security import create_access_token as _make_token

ws_token = _make_token(data={"sub": "1", "role": "student"})
try:
    with client.websocket_connect("/api/v1/group-chat/ws/9999", subprotocols=[ws_token]) as ws:
        # O servidor aceita e fecha com 4004 (classroom não existe). O receive()
        # entrega o close frame ao cliente — como exceção ou como mensagem.
        msg = ws.receive()
        print("  WS receive() retornou:", msg)
        assert msg.get("type") == "websocket.close", msg
        assert msg.get("code") == 4004, f"esperava code 4004, veio {msg}"
    print("V17 OK: WS autentica via subprotocolo e rejeita classroom inexistente (4004)")
except WebSocketDisconnect as e:
    assert e.code == 4004, f"esperava 4004 (classroom not found), veio {e.code}"
    print("V17 OK: WS autentica via subprotocolo e rejeita classroom inexistente (4004)")

os.remove(tmp_db)
print("ALL REGISTER/LOGIN CHECKS OK")
