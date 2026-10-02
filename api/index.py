import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path

import bcrypt
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, redirect, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = Flask(__name__)
CORS(app)

_connection_pool = None


def get_connection_pool():
    global _connection_pool
    if _connection_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL nao configurada. Defina a URI do Supabase no arquivo .env.")
        connection_kwargs = {"dsn": database_url, "sslmode": "require"}
        _connection_pool = pool.SimpleConnectionPool(1, 10, **connection_kwargs)
    return _connection_pool


def query(sql, params=(), fetch=False):
    connection = get_connection_pool().getconn()
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(sql, params)
            result = cursor.fetchall() if fetch else None
        connection.commit()
        return result
    except Exception:
        connection.rollback()
        raise
    finally:
        get_connection_pool().putconn(connection)


def json_error(message, status):
    return jsonify(message=message), status


def integer_value(value):
    try:
        parsed = int(value)
        return parsed if parsed > 0 else None
    except (TypeError, ValueError):
        return None


def user_id_from_request():
    body = request.get_json(silent=True) or {}
    return integer_value(body.get("user_id", request.args.get("user_id", request.headers.get("X-User-Id"))))


def no_data_response(token=None, filhos=None, selected_id=None):
    return {
        "ok": True,
        "message": "Nenhum dado disponivel",
        "hasData": False,
        "token": token,
        "filhos": filhos or [],
        "filhoSelecionadoId": selected_id,
        "tempoPorApp": [],
        "tempoPorDia": [],
    }


@app.get("/api/health")
def health():
    return jsonify(ok=True, message="API online")


@app.get("/home")
def home():
    frontend_host = request.host.split(":", 1)[0]
    return redirect(f"http://{frontend_host}:5173/home")


@app.post("/api/auth/register")
def register():
    body = request.get_json(silent=True) or {}
    name, email, password = body.get("name"), body.get("email"), body.get("password")
    if not name or not email or not password:
        return json_error("Campos obrigatórios: nome, email e senha.", 400)

    normalized_email = email.strip().lower()
    normalized_name = name.strip()
    try:
        if query("SELECT id FROM public.usuarios WHERE email = %s LIMIT 1", (normalized_email,), True):
            return json_error("Este e-mail já está cadastrado.", 409)
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        query("INSERT INTO public.usuarios (nome, email, senha_hash, data_criacao) VALUES (%s, %s, %s, NOW())",
              (normalized_name, normalized_email, password_hash))
        return jsonify(ok=True, message="Cadastro realizado com sucesso."), 201
    except Exception as error:
        app.logger.exception("register")
        return jsonify(message="Erro interno ao cadastrar usuário.", detail=str(error)), 500


@app.post("/api/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    email, password = body.get("email"), body.get("password")
    if not email or not password:
        return json_error("Campos obrigatórios: email e senha.", 400)
    try:
        users = query("SELECT id, nome, email, senha_hash FROM public.usuarios WHERE email = %s LIMIT 1",
                      (email.strip().lower(),), True)
        user = users[0] if users else None
        if not user or not bcrypt.checkpw(password.encode(), user["senha_hash"].encode()):
            return json_error("Email ou senha invalidos.", 401)
        return jsonify(ok=True, message="Login realizado com sucesso.", token=secrets.token_hex(24), user={
            "id": user["id"], "name": user["nome"], "email": user["email"]
        })
    except RuntimeError as error:
        return jsonify(message="Banco de dados nao configurado.", detail=str(error)), 503
    except psycopg2.Error as error:
        app.logger.exception("login database connection")
        return jsonify(
            message="Nao foi possivel conectar ao PostgreSQL do Supabase.",
            detail="Use a Connection string do Supabase Pooler em DATABASE_URL.",
        ), 503
    except Exception as error:
        app.logger.exception("login")
        return jsonify(message="Erro interno ao autenticar usuário.", detail=str(error)), 500


@app.post("/api/dashboard/gerar-token")
def generate_token():
    user_id = user_id_from_request()
    if not user_id:
        return json_error("user_id invalido.", 400)
    try:
        if not query("SELECT id FROM usuarios WHERE id = %s LIMIT 1", (user_id,), True):
            return json_error("Usuario nao encontrado.", 404)
        token = secrets.token_urlsafe(32)
        expiration = datetime.utcnow() + timedelta(days=7)
        query("INSERT INTO tokens (user_id, token, data_expiracao) VALUES (%s, %s, %s)",
              (user_id, token, expiration))
        return jsonify(ok=True, token=token, data_expiracao=expiration), 201
    except Exception as error:
        return jsonify(message="Erro ao gerar token.", detail=str(error)), 500


@app.get("/api/dashboard")
def dashboard():
    user_id = user_id_from_request()
    requested_id = integer_value(request.args.get("filho_id")) if request.args.get("filho_id") else None
    if not user_id:
        return json_error("user_id invalido.", 400)
    try:
        latest = query("SELECT token, data_expiracao FROM tokens WHERE user_id = %s ORDER BY id DESC LIMIT 1",
                       (user_id,), True)
        filhos = query("SELECT id, nome FROM filhos WHERE user_id = %s ORDER BY id ASC", (user_id,), True)
        if not filhos:
            return jsonify(no_data_response(latest[0]["token"] if latest else None))
        selected_id = requested_id or filhos[0]["id"]
        if not any(child["id"] == selected_id for child in filhos):
            return json_error("filho_id invalido para este usuario.", 400)
        if not latest:
            return jsonify(no_data_response(None, filhos, selected_id))
        apps = query("""SELECT a.nome, SUM(t.tempo_minutos)::int AS total FROM tempo_uso t
                        JOIN apps a ON a.id = t.app_id WHERE t.filho_id = %s
                        AND t.data_uso >= date_trunc('week', CURRENT_DATE)
                        AND t.data_uso < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
                        GROUP BY a.nome ORDER BY total DESC""", (selected_id,), True)
        days = query("SELECT data_uso, SUM(tempo_minutos)::int AS total FROM tempo_uso WHERE filho_id = %s GROUP BY data_uso ORDER BY data_uso",
                     (selected_id,), True)
        if not apps or not days:
            return jsonify(no_data_response(latest[0]["token"], filhos, selected_id))
        return jsonify(ok=True, hasData=True, token=latest[0]["token"], tokenExpiraEm=latest[0]["data_expiracao"],
                       filhos=filhos, filhoSelecionadoId=selected_id, tempoPorApp=apps, tempoPorDia=days)
    except Exception as error:
        return jsonify(message="Erro ao carregar dashboard.", detail=str(error)), 500


@app.put("/api/dashboard/filhos/<int:filho_id>")
def update_child(filho_id):
    user_id = user_id_from_request()
    name = (request.get_json(silent=True) or {}).get("nome")
    if not user_id:
        return json_error("user_id invalido.", 400)
    if not name or not str(name).strip():
        return json_error("Nome do filho e obrigatorio.", 400)
    try:
        result = query("""UPDATE filhos SET nome = %s WHERE id = %s AND user_id = %s
                         RETURNING id, user_id, nome, data_nascimento, dispositivo_id""",
                       (str(name).strip(), filho_id, user_id), True)
        if not result:
            return json_error("Filho nao encontrado para este usuario.", 404)
        return jsonify(ok=True, message="Nome do filho atualizado com sucesso.", filho=result[0])
    except Exception as error:
        return jsonify(message="Erro ao atualizar filho.", detail=str(error)), 500


@app.post("/api/dashboard/tempo-uso")
def save_usage():
    body = request.get_json(silent=True) or {}
    token, data = body.get("token"), body.get("dados")
    if not token or not isinstance(data, list) or not data:
        return json_error("Payload invalido. Envie token e dados.", 400)
    connection = get_connection_pool().getconn()
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT user_id FROM tokens WHERE token = %s AND data_expiracao > NOW() ORDER BY id DESC LIMIT 1", (token,))
            token_row = cursor.fetchone()
            if not token_row:
                connection.rollback()
                return json_error("Token invalido ou expirado.", 401)
            cursor.execute("SELECT id FROM filhos WHERE user_id = %s ORDER BY id ASC LIMIT 1", (token_row["user_id"],))
            child = cursor.fetchone()
            if child:
                child_id = child["id"]
            else:
                cursor.execute("INSERT INTO filhos (user_id, nome, dispositivo_id) VALUES (%s, %s, %s) RETURNING id",
                               (token_row["user_id"], str(body.get("nome_filho") or "Filho App").strip(), str(body.get("dispositivo_id") or "app-mobile").strip()))
                child_id = cursor.fetchone()["id"]
            for item in data:
                package_name = str(item.get("package_name") or "").strip()
                usage = round(float(item.get("tempo_minutos"))) if item.get("tempo_minutos") is not None else -1
                usage_date = str(item.get("data_uso") or "").strip()
                app_name = str(item.get("nome") or package_name).strip()
                if not package_name or usage < 0 or not usage_date:
                    connection.rollback()
                    return json_error("Item de dados invalido no payload.", 400)
                cursor.execute("INSERT INTO apps (nome, package_name) VALUES (%s, %s) ON CONFLICT (package_name) DO UPDATE SET nome = EXCLUDED.nome RETURNING id", (app_name, package_name))
                app_id = cursor.fetchone()["id"]
                cursor.execute("INSERT INTO instalacoes (filho_id, app_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (child_id, app_id))
                cursor.execute("""INSERT INTO tempo_uso (filho_id, app_id, tempo_minutos, data_uso) VALUES (%s, %s, %s, %s)
                                ON CONFLICT (filho_id, app_id, data_uso) DO UPDATE SET tempo_minutos = EXCLUDED.tempo_minutos""",
                               (child_id, app_id, usage, usage_date))
        connection.commit()
        return jsonify(ok=True, message="Dados de tempo de uso salvos com sucesso."), 201
    except Exception as error:
        connection.rollback()
        return jsonify(message="Erro ao salvar tempo de uso.", detail=str(error)), 500
    finally:
        get_connection_pool().putconn(connection)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")