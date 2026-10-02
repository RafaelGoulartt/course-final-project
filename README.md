
## Conexao com PostgreSQL (Login/Cadastro)

### Frontend
1. Copie `.env.example` para `.env`.
2. Ajuste `VITE_API_BASE_URL` se necessario.
3. Rode `npm install` e depois `npm run dev`.

### Backend API
1. Instale Python 3.11+ e crie um ambiente virtual: `python -m venv .venv`.
2. Ative o ambiente e instale as dependencias: `pip install -r requirements.txt`.
3. No painel do Supabase, abra **Connect > Session pooler** e coloque a URI em `DATABASE_URL` no `.env`. Use o usuário `postgres.xxreivfpgmoihsdqrooq`, a porta `6543` e substitua `[YOUR-PASSWORD]` pela senha real. Para desenvolvimento local, prefira o pooler em vez do host direto `db.*.supabase.co:5432`.
4. Execute `server/sql/schema.sql` no SQL Editor do projeto Supabase.
5. Rode a API com `python api/index.py` (porta `5000`).
6. Em outro terminal, rode o frontend com `npm run dev` (porta `5173`). O acesso a `/auth` usa o proxy `/api` do Vite e chega à API Node na porta `3001`.

O link do dashboard do Supabase serve apenas para abrir o editor. A API precisa da string de conexao, que inclui host, porta, banco, usuario e senha. A senha do banco pode ser redefinida em **Project Settings > Database**. Nunca publique essa URI.

No Vercel, `api/index.py` e `requirements.txt` sao detectados automaticamente. A API Flask expoe:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/dashboard/gerar-token`
- `GET /api/dashboard`
- `PUT /api/dashboard/filhos/:filho_id`
- `POST /api/dashboard/tempo-uso`

### APK Android

O projeto `android-app` contém o coletor Android. Abra essa pasta no Android Studio, use Java 17 e gere o APK em **Build > Build APK(s)**. O app recebe o token criado pelo dashboard, coleta o uso em primeiro plano das últimas 24 horas e envia os dados para `POST /api/dashboard/tempo-uso`.
