
## Conexao com PostgreSQL (Login/Cadastro)

### Frontend
1. Copie `.env.example` para `.env`.
2. Ajuste `VITE_API_BASE_URL` se necessario.
3. Rode `npm run dev`.

### Backend API
1. Entre na pasta `server`.
2. Copie `.env.example` para `.env` e configure os dados do PostgreSQL.
3. Execute o SQL de `server/sql/schema.sql` no banco para criar a tabela `users`.
4. Instale dependencias da API com `npm install` dentro de `server`.
5. Rode `npm run dev` dentro de `server`.

Rotas disponiveis:
- `POST /api/auth/register`
- `POST /api/auth/login`
